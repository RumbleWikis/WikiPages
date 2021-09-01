import { mwn } from "mwn";
import * as fs from "fs";
import getAllFiles from "../utils/getAllFiles";
import md5Hash from "../utils/md5Hash";
import { Evt, to } from "evt";
import { basename, dirname, extname } from "path";
import { WPFile } from "./WPFile";
import type { ClientOptions, Middleware } from "../types";

/**
 * The WikiPages Client.
 */
export class Client extends Evt<
["ready", undefined] | 
["loginError", { error: unknown }] |
["runningStarted", undefined] | 
["runningEnded", undefined] |
["editError", { file: WPFile, error: unknown }] |
["createError", { file: WPFile, error: unknown }]
> {
  /**
   * Creates a new WikiPages Client and logs in with a Promise
   * ```
   * Client.init({
   *   username: "Username",
   *   password: "Password",
   *   srcDirectory: "src/",
   *   cacheFile: "cache.json",
   *   apiUrl: "https://en.wikipedia.org/api.php",
   * }).then((client) => {
   *   ...
   * }).catch((error) => {
   *   ...
   * })
   * ```
   * @param options - The client options.
   */
  static init(options: ClientOptions): Promise<Client> {
    const client = new this(options);
    return new Promise((resolve, reject) => {
      client.login().then(() => resolve(client)).catch(error => reject(error));
    });
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
   *   cacheFile: "cache.json",
   *   apiUrl: "https://en.wikipedia.org/api.php",
   * })
   * ```
   * @param options - The client options.
   */
  constructor(options: ClientOptions) {
    super()
    if (fs.existsSync(options.cacheFile) ? !fs.lstatSync(options.cacheFile).isDirectory() : true) {
      this._clientOptions = options;
      this._mwnClient = new mwn({
        apiUrl: options.apiUrl,
        maxRetries: options.maxRetries,
        username: options.username,
        password: options.password,
        userAgent: `${options.userAgent ?? "Instance"} (powered by @rumblewikis/wikipages)`,
        silent: true
      });
    } else throw new Error(`"${options.cacheFile}" is not a valid dirrectory for "cacheFile"`)
  }

  public login(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._mwnClient!.login().then(() => {
        this._initialized = true;
        this.post(["ready", undefined]);
        resolve();
      }).catch((error) => {
        this.post(["loginError", { error }]);
        reject(error);
      });
    });
  }

  /**
   * Add new middleware to the existing middlewares array. This can not be run while an instance is already active.
   * @param middleware - The array of middleware to add to the Client. Middleware can not be removed easily later.
   */
  public addMiddlewares(...middleware: Middleware[]): void {
    if (this._running) throw new Error(`Could not run because it was already running.`);
    (this._clientOptions!.middlewares ||= []).concat(middleware);
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
  public parseFileName(fileName: string): string {
    // TO-DO
  }

  /**
   * Passes a file through all middlewares
   */
  public buildFile(file: WPFile): Promise<WPFile> {
    return new Promise((resolve, reject) => {
      // TO-DO
    });
  }

  /**
   * Run the bot, going through all middlewares, and then pushing the files with `shouldCommit` as true to the site. This can not be run while an instance is already active.
   * @param commitComment - The default message to commit with, can be changed by the middlewares.
   */
  public run(commitComment: string): Promise<void> {
    // Jullian(7/17/21): i hate every part of this
    if (!fs.existsSync(this._clientOptions!.srcDirectory)) throw new Error("Could not start because `srcDirectory` doesn't exist."); 
    if (!this._initialized || this._running) throw new Error(`Could not start because it was not initialized or had already started.`);
    return new Promise((resolve) => {
      this.post(["runningStarted", undefined]);
      this._running = true;
      const md5Hashes: Map<string, string> = new Map<string, string>();
      const newMd5Hashes: Map<string, string> = new Map<string, string>();
      try { 
        const hashJSON = JSON.parse(fs.readFileSync(this._clientOptions!.cacheFile).toString());
        // we can assume it didn't error, so continue
        for (const [file, hash] of Object.entries<string>(hashJSON))
          md5Hashes.set(file, hash);
      } catch {}


      const pagesToEdit = new Map<string, WPFile>();
      const files = getAllFiles(this._clientOptions!.srcDirectory);

      files.forEach(file => {
        const content = fs.readFileSync(file);
        let shortFileDirectory: string = file.slice(this._clientOptions!.srcDirectory.length + 1);
        const shortFileDirectorySplit = shortFileDirectory.split("/");
        // @ts-ignore: This will never be undefined
        let namespace: string = shortFileDirectorySplit.shift();
        shortFileDirectory = shortFileDirectorySplit.join("/");

        namespace = ((namespace === this._clientOptions!.mainNamespace) ? "" : `${namespace}:`);

        let folderDirectory: string = dirname(shortFileDirectory);
        let folder: string = basename(folderDirectory);

        let fileName: string = basename(shortFileDirectory);
        const longExtension = ((fileName.match(/\.(.*)/) || [])[0]) || "";
        const shortExtension = extname(fileName);
        fileName = basename(fileName, longExtension);

        // ex: Bruh/Bruh.lua -> Bruh
        if (fileName === folder) {
          folderDirectory = dirname(folderDirectory);
          folder = basename(folderDirectory);
        }

        const wpFile = new WPFile({
          commitComment,
          originalLongExtension: longExtension,
          originalShortExtension: shortExtension,
          originalPath: file,
          source: content.toString(),
          shouldCommit: true,
          path:`${namespace}${folderDirectory === "." ? "" : `${folderDirectory}/`}${fileName}`
        });

        // Change bruh.doc.wikitext to bruh/doc
        if (wpFile.originalLongExtension === ".doc.wikitext") wpFile.path = `${wpFile.path}/doc`;
        if (wpFile.originalShortExtension === ".css" || wpFile.originalShortExtension === ".js") wpFile.path = `${wpFile.path}${wpFile.originalShortExtension}`;

        if (this._clientOptions!.middlewares)
          for (const middleware of this._clientOptions!.middlewares) {
            if ((middleware.matchLongExtension ? longExtension.match(middleware.matchLongExtension) : true) 
              && (middleware.matchShortExtension ? shortExtension.match(middleware.matchShortExtension) : true) 
              && (middleware.matchPath ? wpFile.path!.match(middleware.matchPath) : true)) 
                middleware.execute(wpFile, middleware.settingsIndex ? this._clientOptions!.middlewareSettings?.[middleware.settingsIndex] : undefined);
          }
        
        if (wpFile.shouldCommit) pagesToEdit.set(wpFile.path!, wpFile);
      });

      const allEdits: Promise<unknown>[] = [];
      pagesToEdit.forEach((file) => {
        if (!(md5Hashes.get(file.path!) && (md5Hash(file.source!.trimEnd()) === md5Hashes.get(file.path!))))
          allEdits.push(new Promise((resolve) => {
            setTimeout(() => {
              this._mwnClient!.edit(file.path!, (revision) => {
                if (!(md5Hashes.get(file.path!) && md5Hash(revision.content.trimEnd()) === md5Hash(file.source!.trimEnd()))) {
                  newMd5Hashes.set(file.path!, md5Hash(file.source!.trimEnd()));
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
            }, (allEdits.length + 1) * 10000)
          }));
        });
        Promise.all(allEdits).then(() => {
          const newMd5HashesJSON: Record<string, string> = {};
          newMd5Hashes.forEach((value, key) => {
            newMd5HashesJSON[key] = value;
          });
    
          fs.writeFileSync(this._clientOptions!.cacheFile, JSON.stringify(newMd5HashesJSON));
          this._running = false;
          this.post(["runningEnded", undefined]);
          resolve(); 
        });
    })
  }
}

export { to };