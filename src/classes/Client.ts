import { mwn } from "mwn";
import fs from "fs";
import getAllFiles from "../utils/getAllFiles";
import md5Hash from "../utils/md5Hash";
import type { ClientOptions, WPFile } from "../types";
import { basename, dirname, extname } from "path";

/**
 * The WikiPages Client.
 */
export class Client {
  /**
   * Options for the Client, this can not be changed after initialization.
   */
  public readonly clientOptions?: ClientOptions;
  /**
   * The initialization state.
   */
  public initialized = false;
  /**
   * Whether or not there is a currently running instance scanning all files.
   */
  public running = false;
  /**
   * The mwn client for requests.
   */
  private mwnClient?: mwn;
  /**
   * Construct a new Client.
   * ```
   * const instance = new Client({
   *   apiUrl: "https://en.wikipedia.org/api.php",
   *   username: "TotallyNotBot",
   *   password: "Password123",
   *   srcDirectory: "src/",
   *   cacheFile: "cache/",
   *   onReady: (client) => {
   *     console.log("Ready")
   *   }
   * })
   * ```
   * @param options - The client options.
   */
  constructor(options: ClientOptions) {
    if (fs.existsSync(options.srcDirectory))
      if (!fs.lstatSync(options.cacheFile).isDirectory()) {
        this.clientOptions = this.clientOptions;
        mwn.init({
          apiUrl: options.apiUrl,
          maxRetries: options.maxRetries,
          username: options.username,
          password: options.password,
          userAgent: `${options.userAgent || "Instance"} (powered by @rumblewikis/wikipages)`
        }).then((client) => {
          try { options.onReady && options.onReady(this) } catch {};

          this.initialized = true;
          this.mwnClient = client;
        });
      } else throw new Error(`"${options.cacheFile}" is not a valid dirrectory for "cacheFile"`)
    else throw new Error(`"${options.srcDirectory}" is not a valid directory for "srcDirectory"`);
  }

  /**
   * Run the bot, going through all middlewares.
   * @param commitComment - The default message to commit with
   */
  public run(commitComment: string): Promise<void> {
    // i hate every part of this - Jullian 7/17/21
    if (!this.initialized || this.running) throw new Error(`Could not run because it was not initialized or was already running.`);
    return new Promise((resolve) => {
      this.running = true;
      const md5Hashes: Map<string, string> = new Map<string, string>();
      try { 
        const hashJSON = JSON.parse(fs.readFileSync(this.clientOptions!.cacheFile).toString());
        // we can assume it didn't error, so continue
        for (const [file, hash] of Object.entries<string>(hashJSON))
          md5Hashes.set(file, hash);
      } catch {}


      const pagesToEdit = new Map<string, WPFile>();
      const files = getAllFiles(this.clientOptions!.srcDirectory);

      files.forEach(file => {
        const content = fs.readFileSync(file);
        let shortFileDirectory: string = file.slice(this.clientOptions!.srcDirectory.length);
        const shortFileDirectorySplit = shortFileDirectory.split("/");
        // @ts-ignore: This will never be undefined
        let namespace: string = shortFileSplit.shift();
        shortFileDirectory = shortFileDirectorySplit.join("/");

        namespace = ((namespace === this.clientOptions!.mainNamespace) ? "" : `${namespace}:`);

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

        let wpFile: WPFile = { 
          longExtension,
          shortExtension,
          source: content.toString(),
          originalDirectory: file,
          commitComment: commitComment,
          shouldCommit: true,
          path:`${namespace}${folderDirectory}/${fileName}`
        };

        if (wpFile.longExtension === ".doc.wikitext") wpFile.path = `${wpFile.path}/doc`;

        if (this.clientOptions!.middlwares)
          for (const middleware of this.clientOptions!.middlwares) {
            if ((middleware.matchLongExtension && longExtension.match(middleware.matchLongExtension)) 
              && (middleware.matchShortExtension && shortExtension.match(middleware.matchShortExtension)) 
              && (middleware.matchPath && wpFile.path.match(middleware.matchPath))) 
                wpFile = middleware.execute(this.clientOptions!.middlewareSettings || {}, wpFile);
          }
        
        if (wpFile.shouldCommit) pagesToEdit.set(wpFile.path, wpFile);
      });

      const allEdits: Promise<unknown>[] = [];
      pagesToEdit.forEach((file) => {
        if (!(md5Hashes.get(file.path) && md5Hash(file.source.trimEnd()) === md5Hashes.get(file.path)))
          allEdits.push(new Promise((resolve) => {
            setTimeout(() => {
              this.mwnClient!.edit(file.path, (revision) => {
                if (!(md5Hashes.get(file.path) && md5Hash(revision.content.trimEnd()) === md5Hash(file.source.trimEnd()))) {
                  md5Hashes.set(file.path, md5Hash(file.source.trimEnd()));
                  return {
                    summary: file.commitComment,
                    text: file.source
                  }
                } else return {};
               })
               .then(resolve)
               .catch((error) => {
                 if (error.code === "missingtitle")
                  this.mwnClient!.create(file.path, file.source, commitComment).then(resolve).catch();
               });
            }, (allEdits.length + 1) * 10)
          }));
        });

      Promise.all(allEdits).then(() => {
        resolve(); 
        this.running = false; 
        const md5HashesJSON: Record<string, string> = {};
        md5Hashes.forEach((value, key) => {
          md5HashesJSON[key] = value;
        });
  
        fs.writeFile(this.clientOptions!.cacheFile, JSON.stringify(md5HashesJSON), () => {});
      });
    })
  }
}