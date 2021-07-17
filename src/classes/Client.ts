import { mwn } from "mwn";
import fs from "fs";
import getAllFiles from "../utils/getAllFiles";
import type { ClientOptions } from "../types";
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
  public run(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pagesToEdit = new Map<string, string>();
      const files = getAllFiles(this.clientOptions!.srcDirectory);

      files.forEach(file => {
        const content = fs.readFileSync(file);
        let shortFileDirectory: string = file.slice(this.clientOptions!.srcDirectory.length);
        const shortFileDirectorySplit = shortFileDirectory.split("/");
        // @ts-ignore: This will never be undefined
        let namespace: string = shortFileSplit.shift();
        shortFileDirectory = shortFileDirectorySplit.join("/");

        namespace = ((namespace === this.clientOptions!.mainNamespace) ? "" : `${namespace}:`);

        const folderDirectory = dirname(shortFileDirectory);
        const folder = basename(folderDirectory);

        let fileName: string = basename(shortFileDirectory);
        const longExtension = ((fileName.match(/\.(.*)/) || [])[0]) || "";
        const shortExtension = extname(fileName);
        const fileNameWithoutExtension = basename(fileName, longExtension);

        if (fileName === folder) fileName = "";
        
      });
    })
  }
}