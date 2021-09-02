import type { WPFile } from "./classes/WPFile";

/**
 * Information for the parsed file name.
 */
export interface ParsedFileNameInformation {
  /**
   * New MediaWiki path
   */
  path: string;
  /**
   * The original short extension parsed from the old file name.
   */
  originalShortExtension: string;
  /**
   * The original long extension parsed from the old file name.
   */
  originalLongExtension: string;
}

/**
 * Options to change in a properties for a WPFile class after construction.
 */
export interface WPFileChangeOptions {
  /**
   * Whether or not it should be committed to the site after finished going through the middlewares.
   */
  shouldCommit?: boolean;
   /*
   * The default (or modified) comment for the MediaWiki commit, "edit comment".
   */
  commitComment?: string;
  /**
  * THe MediaWiki path of where the page would be. (MediaWiki/Common.js -> MediaWiki:Common.js)
  */
  path?: string;
  /**
   * The source string of the file, intended to be modified by middlewares.
   */
  source?: string;
}

/**
 * Options for initial construction of a WPFile class, some can not be changed later.
 */
export interface WPFileOptions extends WPFileChangeOptions {
  /**
   * The original path of where the file was located.
   */
  originalPath: string;
  /**
   * The original long extension of the original file, ex `.lua`, not including `.client.lua`.
   */
  originalLongExtension: string;
  /**
   * The original short extension of the original file, ex `.lua`, not including `.client.lua`.
   */
  originalShortExtension: string;
}

export type MiddlewareType = "Page";

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
   * Type of the middleware.
   * 
   * "Page" is currently only available, this is to change in the future.
   */
  type: MiddlewareType;
  /**
   * The execute function of the middleware.
   */
  execute: (file: WPFile, settings?: Record<string, unknown>) => WPFile
}

/**
 * Credentials for the Client, such as username or password.
 */
export interface ClientCredentials {
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
   * The user agent for all requests, use this to identify where the requests originate from.
   */
   userAgent?: string;
}

/**
 * Options for the Client.
 */
export interface ClientOptions {
  /**
   * Credentials for the Client, such as username or password.
   */
  credentials: ClientCredentials;
  /**
   * The directory to look for the source in.
   */
  srcDirectory: string;
  /**
   * The path to the file to place and search for file MD5 cache in.
   */
  cacheFile: string;
  /**
   * Middleware settings for middleware, see https://github.com/RumbleWikis/WikiPages#Middlewares for more info.
   */
  middlewareSettings?: Record<string, Record<string, any>>;
  /**
   * The maximum allowed of retries, will quit trying after the maximum allowed retries.
   */
  maxRetries?: number;
  /**
   * Namespace mappings, an empty value for namespace will default to the main Namespace.
   * 
   * This can be used for non-english wikis or other uses.
   */
  namespaceMappings?: Record<string, string>
  /**
   * The array of middlewares to add, see https://github.com/RumbleWikis/WikiPages#Middlewares for more info. More middleware can be added later with `client.addMiddlewares(...)`.
   */
  middlewares?: Middleware[];
}