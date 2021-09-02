import type { WPFileChangeOptions, WPFileOptions } from "../types";

/**
 * A file to be handled by client middlewares.
 */
export class WPFile {
  /**
  * The original path of where the file was located.
  */
  public readonly originalPath?: string;
  /*
   * The original long extension of the original file, ex `.lua`, not including `.client.lua`.
   */
  public readonly originalLongExtension?: string;
  /**
   * The original short extension of the original file, ex `.lua`, not including `.client.lua`.
   */
  public readonly originalShortExtension?: string;
  /**
   * Whether or not it should be committed to the site after finished going through the middlewares.
   */
  public shouldCommit?: boolean;
  /*
  * The default (or modified) comment for the MediaWiki commit, "edit comment".
  */
  public commitComment?: string;
  /**
   * THe MediaWiki path of where the page would be. (MediaWiki/Common.js -> MediaWiki:Common.js)
   */
  public path?: string;
  /**
   * The source string of the file, intended to be modified by middlewares.
   */
  public source?: string;
  /**
   * An array of the errors given from middlewares.
   */
  public errors: Error[] = [];
  /**
   * Create a new WPFile.
   */
  constructor(options: WPFileOptions) {
    this.originalPath = options.originalPath;
    this.originalLongExtension = options.originalLongExtension;
    this.originalShortExtension = options.originalShortExtension;

    this.shouldCommit = options.shouldCommit ?? true;
    this.commitComment = options.commitComment;
    this.path = options.path;
    this.source = options.source;
  }
  /**
   * Change the properties with an interface.
   */
  public change(options: WPFileChangeOptions): WPFile {
    for (const key in options)
      // @ts-ignore: Everything should be OK. The field should have the same type on Options and this.
      this[key as keyof WPFileChangeOptions] = options[key as keyof WPFileChangeOptions];

    return this;
  }
}