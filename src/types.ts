import { Client } from "./classes/Client";

/**
 * A file interface for WikiPages.
 */
export interface WPFile {
  /**
   * The original directory of the file.
   */
  readonly originalDirectory: string;
  /**
   * The short extension of the file, ex `.lua`, not including `.client.lua`
   */
  shortExtension: string;
  /**
   * The long extension o fthe file, ex `.client.lua`, not including **just** `.lua`
   */
  longExtension: string;
  /**
   * The comment for the MediaWiki commit
   */
  commitComment: string;
  /**
   * Whether or not it should commit when it goes through all middlewares
   */
  shouldCommit: boolean;
  /**
   * THe new MediaWiki path of the file.
   */
  path: string;
  /**
   * The source string of the file.
   */
  source: string;
}
/**
 * Middleware that will be called on every file found.
 */
export interface Middleware<Settings = Record<string, unknown>> {
  /**
   * The RegExp/string to match in the short extension,  ex `.lua`, not including `.client.lua`
   */
  matchShortExtension?: RegExp | string;
  /**
   * The RegExp/string to match in the long extension, ex `.client.lua`, not including **just** `.lua`
   */
  matchLongExtension?: RegExp | string;
  /**
   * The Regexp/string to match in the name of the file
   */
  matchPath?: RegExp | string;
  /**
   * The execute function of the middleware
   */
  execute: (settings: Record<string, Settings>, file: WPFile) => WPFile
}
/**
 * Options for the Client, this can not be changed after initialization.
 */
export interface ClientOptions {
  /**
   * The username for the account, ex: `TotallyNotBot`, can also be a username from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords)
   */
  username: string;
  /**
   * The password for the account, ex: `Password123`, can also be a password from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords)
   */
  password: string;
  /**
   * The API url for the MediaWiki wiki, add /api.php to the base URL of the site, ex: `https://en.wikipedia.org/api.php`
   */
  apiUrl: string;
  /**
   * The directory to look for the source in.
   */
  srcDirectory: string;
  /**
   * The path to the file to place and search for cache in.
   */
  cacheFile: string;
  /**
   * The user agent for all requests.
   * 
   * This is a feature from **mwn**
   */
  userAgent?: string;
  /**
   * Middleware settings for middleware, see https://github.com/RumbleWikis/WikiPages-Middleware for more info
   */
  middlewareSettings?: Record<string, Record<string, any>>;
  /**
   * The maximum allowed of retries, will quit after the amount of retries.
   * 
   * This is a feature from **mwn**
   */
  maxRetries?: number;
  /**
   * The main namespace, `(main)` on MediaWiki.
   * 
   * Default `Main`
   */
  mainNamespace?: string;
  /**
   * The middleware to add, see https://github.com/RumbleWikis/WikiPages-Middleware for more info.
   */
  middlwares?: Middleware[];
  /**
   * Start event to be called when ready.
   */
  onReady?: (client: Client) => void;
}
