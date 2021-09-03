import { mwn } from "mwn";
import * as fs from "fs";
import { promisify } from "util";
import getAllFiles from "../utils/getAllFiles";
import md5Hash from "../utils/md5Hash";
import { Evt, to } from "evt";
import { basename, dirname, extname, resolve } from "path";
import { WPFile } from "./WPFile";
import type { ClientOptions, Middleware, ParsedFileNameInformation } from "../types";

/**
 * The WikiPages Client.
 */
export class Client extends Evt<
["ready", undefined] | 
["loginError", { error: unknown }] |
["runningStarted", undefined] | 
["runningEnded", undefined] |
["editError", { file: WPFile, error: unknown }] |
["createError", { file: WPFile, error: unknown }] |
["middlewareError", { file: WPFile, error: unknown }]
> {
  /**
   * Creates a new WikiPages Client and logs in with a Promise
   * ```
   * Client.init({
   *   username: "Username",
   *   password: "Password",
   *   srcDirectory: "src/",
   *   cacheFilePath: "cache.json",
   *   apiUrl: "https://en.wikipedia.org/api.php",
   * }).then((client) => {
   *   ...
   * }).catch((error) => {
   *   ...
   * })
   * ```
   * @param options - The client options.
   */
  static async init(options: ClientOptions): Promise<Client> {
    const client = new this(options);
    try {
      await client.login();
      return client;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Init a new Client from a given path
   * @param filePath - The path to the .wiki.js or similar
   */
  static initFromFile(filePath: string): Promise<Client> {
    const fileReturn = require(resolve(process.cwd(), filePath));
    if (!fileReturn) throw new Error(`"${filePath}" must return an object.`);

    return this.init(fileReturn);
  }

  /**
   * Client options for the client, this can be changed later **when** the client is not running.
   */
  private _clientOptions?: ClientOptions;
  public get clientOptions() {
    return this._clientOptions;
  }
  /**
   * The initialization state, initially `false` and will become `true` when the **mwnClient** is ready.
   * 
   * Use `client.$attach(to("ready"), () => {...})` to call a function when the client is ready.
   */
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }
  /**
   * The value of whether or not the client is currently running.
   * 
   * Use `client.$attach(to("runningStarted"), () => {...})` to call a function when the client started running, or `client.$attach(to("runningStopped"), () => {...})` when the client stopped running.
   */
  private _running = false;
  public get running() {
    return this._running;
  }
  /**
   * The API client **mwn** for doing API requests to the MediaWiki site from `apiUrl`.
   * 
   * There is currently no Deno variant available, which is why this library is still written in NodeJS.
   */
  private _mwnClient?: mwn;
  /**
   * Create a new WikiPages client.
   * ```
   * const instance = new Client({
   *   username: "Username",
   *   password: "Password",
   *   srcDirectory: "src/",
   *   cacheFilePath: "cache.json",
   *   apiUrl: "https://en.wikipedia.org/api.php",
   * })
   * ```
   * @param options - The client options.
   */
  constructor(options: ClientOptions) {
    super()
    if (fs.existsSync(options.path.cacheFile) ? !fs.lstatSync(options.path.cacheFile).isDirectory() : true) {
      this._clientOptions = options;
      if (this._clientOptions.middlewares) this._clientOptions.middlewares = this._clientOptions.middlewares.map(middleware => {
        if (middleware.execute instanceof Promise) return middleware;
        return {
          ...middleware,
          execute: promisify(middleware.execute)
        }
      });

      this._mwnClient = new mwn({
        apiUrl: options.credentials.apiUrl,
        maxRetries: options.api?.maxRetries,
        username: options.credentials.username,
        password: options.credentials.password,
        userAgent: `${options.credentials.userAgent ?? "Instance"} (powered by @rumblewikis/wikipages)`,
        silent: true
      });
    } else throw new Error(`"${options.path.cacheFile}" is not a valid dirrectory for "cacheFilePath"`)
  }

  public async login(): Promise<void> {
    try {
      await this._mwnClient!.login();
      this.post(["ready", undefined]);
      return;
    } catch (error) {
      this.post(["loginError", { error }]);
      throw error;
    }
  }

  /**
   * Add new middleware to the existing middlewares array. This can not be run while an instance is already active.
   * @param middleware - The array of middleware to add to the Client. Middleware can not be removed easily later.
   */
  public addMiddlewares(...middleware: Middleware[]): void {
    if (this._running) throw new Error(`Could not run because it was already running.`);
    (this._clientOptions!.middlewares ||= []).concat(middleware.map(middleware => {
      if (middleware.execute instanceof Promise) return middleware;
      return {
        ...middleware,
        execute: promisify(middleware.execute)
      }
    }));
  }

  /**
   * Add new settings to the existing middleware settings. This can not be run while an instance is already active.
   * @param settings - The settings to add, can override existing ones.
   */
  public setMiddlewareSettings(settings: Record<string, Record<string, unknown>>): void {
    if (this._running) throw new Error(`Could not run because it was already running.`);
    this._clientOptions!.middlewareSettings = {
      ...this._clientOptions!.middlewareSettings,
      ...settings
    }
  }

  /**
   * Parses a file name from a file system directory to MediaWiki directory
   * @param fileName - The name of the file from the File System.
   */
  public parseFileName(file: string): ParsedFileNameInformation {
    // Trim off srcDirectory
    let shortFileDirectory: string = file.slice(this._clientOptions!.path.srcDirectory.length + 1);
    const shortFileDirectorySplit = shortFileDirectory.split("/");
    // Grab namespace and join the rest of the filename
    let namespace: string = shortFileDirectorySplit.shift()!;
    shortFileDirectory = shortFileDirectorySplit.join("/");

    // Jullian(9/2/21): not sure if this is bad, but only way to do it right now that I can think of.
    const namespaceMappings: Record<string, string> = {
      Main: "",
      ...this._clientOptions!.path.namespaceMappings
    };
    // Change namespace if it exists in clientOptions.namespaceMappings
    namespace = namespaceMappings[namespace] ?? namespace;
    // If empty, assume that it's Main
    namespace = namespace === "" ? "" : `${namespace}:`;

    let folderDirectory: string = dirname(shortFileDirectory);
    let folder: string = basename(folderDirectory);

    let fileName: string = basename(shortFileDirectory);
    // Grab long extension & short extension. short: .js long: .test.js
    const originalLongExtension = ((fileName.match(/\.(.*)/) || [])[0]) || "";
    const originalShortExtension = extname(fileName);
    // Remove long extension (this of course leaves no .*)
    fileName = basename(fileName, originalLongExtension);

    // ex: Bruh/Bruh.lua -> Bruh
    if (fileName === folder) {
      folderDirectory = dirname(folderDirectory);
      folder = basename(folderDirectory);
    }

    // Add namespace, folder, and file name
    let newPath: string = `${namespace}${folderDirectory === "." ? "" : `${folderDirectory}/`}${fileName}`;
    
    // Change bruh.doc.wikitext to bruh/doc
    if (originalLongExtension === ".doc.wikitext") newPath = `${newPath}/doc`;
    if (originalShortExtension === ".css" || originalShortExtension === ".js") 
      newPath = `${newPath}${originalShortExtension}`;

    return {
      path: newPath,
      originalLongExtension,
      originalShortExtension
    }
  }

  /**
   * Passes a file through all middlewares
   * @param file - The file to be passed though
   */
  public async buildFile(file: WPFile): Promise<WPFile> {
    if (this._clientOptions?.middlewares) {
      for (const middleware of this._clientOptions.middlewares.filter(middleware => middleware.type === "Page")) {
        let shouldExecuteMiddleware: boolean = true;
        if (shouldExecuteMiddleware && middleware.matchLongExtension) 
          shouldExecuteMiddleware = file.originalLongExtension!.match(middleware.matchLongExtension) ? true : false;

        if (shouldExecuteMiddleware && middleware.matchShortExtension) 
          shouldExecuteMiddleware = file.originalLongExtension!.match(middleware.matchShortExtension) ? true : false;

        if (shouldExecuteMiddleware && middleware.matchPath)
          shouldExecuteMiddleware = file.originalLongExtension!.match(middleware.matchPath) ? true : false;
        
        if (shouldExecuteMiddleware) {
          const middlewareSettings = middleware.settingsIndex ? this._clientOptions!.middlewareSettings?.[middleware.settingsIndex] : undefined;
          try {
            await middleware.execute(file, middlewareSettings);
          } catch(error) {
            this.post(["middlewareError", { file, error }]);
            file.errors.push(error as Error);
            file.change({
              shouldCommit: false
            });
          }
        }
      }
    }
    return file;
  }

  /**
   * Run the bot, going through all middlewares, and then pushing the files with `shouldCommit` as true to the site. This can not be run while an instance is already active.
   * @param commitComment - The default message to commit with, can be changed by the middlewares.
   */
  public run(commitComment: string): Promise<void> {
    // Jullian(7/17/21): i hate every part of this
    if (!fs.existsSync(this._clientOptions!.path.srcDirectory)) throw new Error("Could not start because `srcDirectory` doesn't exist."); 
    if (!this._initialized || this._running) throw new Error(`Could not start because it was not initialized or had already started.`);
    return new Promise(async(resolve) => {
      this.post(["runningStarted", undefined]);
      this._running = true;
      const md5Hashes: Map<string, string> = new Map<string, string>();
      const newMd5Hashes: Map<string, string> = new Map<string, string>();
      try { 
        const hashJSON = JSON.parse(fs.readFileSync(this._clientOptions!.path.cacheFile).toString());
        // we can assume it didn't error, so continue
        for (const [file, hash] of Object.entries<string>(hashJSON))
          md5Hashes.set(file, hash);
      } catch {}


      const pagesToEdit = new Map<string, WPFile>();
      const files = getAllFiles(this._clientOptions!.path.srcDirectory);

      for (const file of files) {
        const content = fs.readFileSync(file);
        const { path, originalShortExtension, originalLongExtension} = this.parseFileName(file);
        const wpFile = new WPFile({
          commitComment,
          originalLongExtension,
          originalShortExtension,
          originalPath: file,
          source: content.toString(),
          shouldCommit: true,
          path: path
        });
        await this.buildFile(wpFile);
        if (wpFile.shouldCommit) pagesToEdit.set(wpFile.path!, wpFile);
      }

      const allEdits: Promise<unknown>[] = [];
      pagesToEdit.forEach((file) => {
        if (!(md5Hashes.get(file.path!) && (md5Hash(file.source!) === md5Hashes.get(file.path!))))
          allEdits.push(new Promise((resolve) => {
            setTimeout(() => {
              this._mwnClient!.edit(file.path!, (revision) => {
                if (!(md5Hashes.get(file.path!) && md5Hash(revision.content) === md5Hash(file.source!.trimEnd()))) {
                  newMd5Hashes.set(file.path!, md5Hash(file.source!));
                  return {
                    summary: file.commitComment,
                    text: file.source
                  }
                } else return {};
              })
              .then(resolve)
              .catch((error) => {
                if (error.code === "missingtitle") {
                  newMd5Hashes.set(file.path!, md5Hash(file.source!.trimEnd()));
                  this._mwnClient!.create(file.path!, file.source!, file.commitComment).then(resolve).catch((error) => {
                    this.post(["createError", { file, error}]);
                  });
                } else this.post(["editError", { file, error }])
              });
            }, (allEdits.length + 1) * (this._clientOptions!.api?.editTimeout ?? 10000));
          }));
        });
        await Promise.all(allEdits);
        const newMd5HashesJSON: Record<string, string> = {};
        newMd5Hashes.forEach((value, key) => {
          newMd5HashesJSON[key] = value;
        });
    
        fs.writeFileSync(this._clientOptions!.path.cacheFile, JSON.stringify(newMd5HashesJSON));
        this._running = false;
        this.post(["runningEnded", undefined]);
        resolve(); 
    })
  }
}

export { to };