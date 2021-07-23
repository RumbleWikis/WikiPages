import { Client } from "./classes/Client";

/**
 * A file to be handled by client middlewares.
 */
export interface WPFile {
  /**
   * The original path of where the file was located.
   */
  readonly originalPath: string;
  /**
   * The short extension of the file, ex `.lua`, not including `.client.lua`.
   * 
   * See `originalShortExtension` for the original short extension.
   */
  shortExtension: string;
  /**
   * The original short extension of the original file, ex `.lua`, not including `.client.lua`.
   */
  readonly originalShortExtension: string;
  /**
   * The long extension o fthe file, ex `.client.lua`, not including **just** `.lua`
   * 
   * See `originalLongExtension` for the original long extension.
   */
  longExtension: string;
  /*
   * The original long extension of the original file, ex `.lua`, not including `.client.lua`.
   */
   readonly originalLongExtension: string;
  /**
   * The default (or modified) comment for the MediaWiki commit, "edit comment".
   */
  commitComment: string;
  /**
   * Whether or not it should be committed to the site after finished going through the middlewares.
   */
  shouldCommit: boolean;
  /**
   * THe MediaWiki path of where the page would be. (MediaWiki/Common.js -> MediaWiki:Common.js)
   */
  path: string;
  /**
   * The source string of the file, can be modified.
   */
  source: string;
}

/**
 * Middleware that will be called on every file in the `srcDirectory`.
 */
export interface Middleware {
  /**
   * The RegExp/string to match in the short extension,  ex `.lua`, not including `.client.lua`.
   */
  matchShortExtension?: RegExp | string;
  /**
   * The RegExp/string to match in the long extension, ex `.client.lua`, not including **just** `.lua`.
   */
  matchLongExtension?: RegExp | string;
  /**
   * The Regexp/string to match in the path of the file.
   */
  matchPath?: RegExp | string;
  /**
   * The settings index to index `middlewareSettings` with.
   */
  settingsIndex?: string;
  /**
   * The execute function of the middleware.
   */
  execute: (file: WPFile, settings?: Record<string, unknown>) => WPFile
}

/**
 * Options for the Client, this can be changed with `client.setSettings()`.
 */
export interface ClientOptions {
  /**
   * The username for the account, ex: `TotallyNotBot`, can also be a username from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords).
   */
  username: string;
  /**
   * The password for the account, ex: `Password123`, can also be a password from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords).
   */
  password: string;
  /**
   * The API url for the MediaWiki wiki, add /api.php to the base URL of the site, ex: `https://en.wikipedia.org/api.php`.
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
   * The user agent for all requests, use this to identify where the requests originate from.
   */
  userAgent?: string;
  /**
   * Middleware settings for middleware, see https://github.com/RumbleWikis/WikiPages#Middlewares for more info.
   */
  middlewareSettings?: Record<string, Record<string, any>>;
  /**
   * The maximum allowed of retries, will quit trying after the maximum allowed retries.
   */
  maxRetries?: number;
  /**
   * The main namespace, `(main)` on MediaWiki, default `Main`.
   */
  mainNamespace?: string;
  /**
   * The array middlewares to add, see https://github.com/RumbleWikis/WikiPages#Middlewares for more info.
   */
  middlwares?: Middleware[];
}
