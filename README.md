<div align="center">
    <br />
    <p>
        <b>WikiPages</b>
        <br />
        Advance <b>page editing</b> on a <i>MediaWiki</i> instance
    </p>
    <p>
        <a href="//github.com/RumbleWikis/WikiPages/blob/main/LICENSE"><image src="https://img.shields.io/github/license/RumbleWikis/WikiPages" /></a>
        <a href="//www.npmjs.com/package/@rumblewikis/wikipages"><img src="https://img.shields.io/npm/v/@rumblewikis/wikipages.svg?maxAge=3600" /></a>
    </p>
    <p>
      <a href="//github.com/RumbleWikis/WikiPages-Middleware">Middlewares repository</a>
      <br />
      <a href="//github.com/RumbleWikis/WikiPages/wiki">Wiki <b>(in development)</b></a>
    </p>
</div>

# Dependencies
* [mwn](https://www.npmjs.com/package/mwn)
* [Evt](https://www.npmjs.com/package/evt)
* [yargs](https://www.npmjs.com/package/yargs)
* [chalk](https://www.npmjs.com/package/chalk)

# Middlewares
A list of approved middleware can be found [here](https://github.com/RumbleWikis/WikiPages-Middleware)

Middlewares are a great way to implement things not implemented by the base package, such as compiling SASS files, or bundling TypeScript files. Middleware is extremely easy to make with a simple format, and will be called in order per file.

To install middleware into a Client, define the `middlewares` property, and `middlewareSettings` if the middleware requires settings.
```ts
const wikipedia = new Client({
  credentials: {
    apiUrl: "https://en.wikipedia.org/api.php",
    username: "Example",
    password: "Example2",
  },
  path: {
    srcDirectory: "Wikipedia/src/pages",
    cacheFile: "md5cache.json",
  },
  middlewares: [middleware],
  middlewareSettings: {
    "sass": {
      "foo": "bar"
    }
  }
});
```

The **middleware** being a Record with the following fields:

* `type: "Middleware"`
  * Type of the middleware.
* `matchShortExtension?: RegExp | string`
  * The RegExp/string to match in the short extension,  ex `.lua`, not including `.client.lua`.
* `matchLongExtension?: RegExp | string`
  * The RegExp/string to match in the long extension, ex `.client.lua`, not including **just** `.lua`
* `matchPath?: Regexp | string`
  * The Regexp/string to match in the path of the file
* `settingsIndex?: string`
  * The settings index to index `middlewareSettings` with.
* `execute: (file: WPFile, settings?: Record<string, unknown>) => WPFile | Promise<WPFile>`

The `settings` will index the `middlewareSettings` on the client with `settingsIndex` if defined, and define it as the parameter.


The file is a **class**, and has parameters that can directly be modified, or with  `WPFile.change(options)`

* `readonly public originalDirectory: string`
  * The original path of where the file was located.
* `readonly public originalLongExtension: string`
  * The original long extension of the original file, ex `.lua`, not including `.client.lua`.
* `readonly public originalShortExtension: string`
  * The original short extension of the original file, ex `.lua`, not including `.client.lua`.
* `public shouldCommit: boolean`
  * Whether or not it should be committed to the site after finished going through the middlewares.
* `public commitComment: string`
  * The default (or modified) comment for the MediaWiki commit, "edit comment".
* `public path: string`
  * THe MediaWiki path of where the page would be. (MediaWiki/Common.js -> MediaWiki:Common.js
* `public errors: Error[]`
  * An array of the errors given from middlewares.
* `public source: string`
  * The source string of the file, intended to be modified by middlewares.
* `public change(options: WPFileChangeOptions): WPFile`
  * Change the properties with an interface.

`WPFileChangeOptions` can have the same properties at the `WIPFile` class, without `.run` and readonly properties.


An example of a middleware is:
```ts
{
  matchShortExtension: /^\.wikitext$/,
  execute: (file) => {
    return file.change({
      content: "Wiki!"
    })
  }
}
```

# Documentation
<div align="center">NOTICE: This documentation is as of v0.3.1, usage may change drastically as it reaches a full release</div>

## Path Resolving
MediaWiki's URL paths are not delightful to look at, this repository will <b>not</b> handle it the same way. (i.e:  MediaWiki's used format allows for `Module:Test` and `Module:Test/doc` to exist simultaneously as files).
* Only files read recursively from `srcDirectory` in the config will be considered and read.
* The highest ancestor of a file will determine the namespace it will be located at (i.e: `{srcDirectory}/Module/Test.lua` will be located at `Module:Test`)
* The extension of all files will be removed from the filename except for the `.js` and `.css` extensions.
* If the highest ancestor is the same value as `mainDirectory`, by default "Main", it will be considered to be in the main namespace (i.e: `{srcDirectory}/Main/Doggy.wikitext` will be located at `Doggy`).
* In version 0.3.0, custom **namespace mapping** were added. If the top namespace matched an index in `namespaceMappings`, it would replace the namespace with the value.
* If a file's basename is the same string as its direct parent, it will be considered to have the path of its directory (i.e: `{srcDirectory}/Module/Test/Test.lua` will be located at `Module:Test`).
* If a file's extension is `.doc.wikitext`, it will be located at its basename appeneded by `/doc`

## Command-line interface
In version 0.3.0, support was added for a **command-line interface** (CLI). You can install it with `npm install -g @rumblewikis/wikipages`.

The bin command for the CLI is `wikipages`, use `wikipages --help` for help.

### Project files (.wiki.js)
The project files used by the CLI are `.wiki.js` files. They would export the interface as the ClientOptions in the Client constructor.

## Setup
### Starters
1. Download and install Node from the [NodeJS website](https://nodejs.org), this will also install npm
2. Init an empty folder with `npm init` in the terminal
3. Install WikiPages with `npm i @rumblewikis/wikipages`
### Rest
4. Import the Client:

      JavaScript
      ```js
      const { Client } = require("@rumblewikis/wikipages")
      ```
  
      TypeScript
      ```ts
      import { Client } from "@rumblewikis/wikipages"
      ```
5. Create a new client, types can be found in the [types.ts file](https://github.com/RumbleWikis/WikiPages/blob/main/src/types.ts)
     ```js
     const wikipedia = new Client({
       credentials: {
         username: "Example",
         password: "Example2",
         apiUrl: "https://en.wikipedia.org/api.php"
       },
       path: {
         srcDirectory: "Wikipedia/src/pages",
         cacheFile: "md5cache.json"
       }
     });
     ```
     
## Client Object
A new client can be constructed and automatically login with:
`static async Client.init(options: ClientOptions): Promise<Client>`
* `credentials: ClientCredentialsOptions`
  * `username: string`
    * The username for the account, ex: `TotallyNotBot`, can also be a username from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords).
  * `password: string`
    * The password for the account, ex: `Password123`, can also be a password from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords)/
  * `apiUrl: string`
    * The API url for the MediaWiki wiki, add /api.php to the base URL of the site, ex: `https://en.wikipedia.org/api.php`.
  * `userAgent: string`
    * The user agent for all requests, use this to identify where the requests originate from.
* `path: ClientPathOptions`
  * `srcDirectory: string`
    * The directory to look for the source in.
  * `cacheFIle: string`
    * The path to the file to place and search for cache in.
  * `namespaceMappings?: Record<string, string>`
    * Namespace mappings to map namespaces to.
* `api: ClientAPIOptions`
  * `maxRetries?: number`
    * The maximum allowed of retries, will quit trying after the maximum allowed retries.
  * `editInterval?: number`
    * The timeout between each attempted edit.
* `middlewareSettings?: Record<string, Record<string, unknown>>`
  * Middleware settings for middleware, see https://github.com/RumbleWikis/WikiPages#Middlewares for more info
* `middlewares?: Middleware[]`
  * The array of middleware to add, see https://github.com/RumbleWikis/WikiPages#Middlewares for more info. 
or from a file path and login:
`Client.initFromFile(filePath: string): Promise<Client>`
or from a file path:
`Client.newFromFile(filePath: string): Client`
or just constructed:
`new Client(options: ClientOptions)`
 
`public clientOptions: ClientOptions`
* Client options for the client, this can be changed later **when** the client is not running.

`public initialized: boolean`
* The initialization state, initially `false` and will become `true` when the **mwnClient** is ready. 
* Use `client.$attach(to("ready"), () => {...})` to call a function when the client is ready.

`public running: boolean`
* The value of whether or not the client is currently running.
* Use `client.$attach(to("runningStarted"), () => {...})` to call a function when the client started running, or `client.$attach(to("runningStopped"), () => {...})` when the client stopped running.

`public setMiddlewareSettings(settings: Record<string, Record<string, unknown>>): void`
* Add new settings to the existing middleware settings. This can not be run while an instance is already active.

`public addMiddlewares(...middlware: Middleware[]): void`
* Add new middleware to the existing middlewares array. This can not be run while an instance is already active.

`public parseFileName(fileName: string): ParsedFileNameInformation`
* Parses a file name from a file system directory to MediaWiki directory

`public buildFile(file: WPFile): Promise<WPFile>`
Passes a file through all middlewares

`public async run(commitComment: string): Promise<void>`
* Run the bot, going through all middlewares, and then pushing the files with `shouldCommit` as true to the site. This can not be run while an instance is already active.

### Events
Proper events were added in **v0.2** with the addition of extending the `Evt` class.

```typescript
export class Client extends Evt<
["ready", undefined] | 
["loginError", { error: unknown }] |
["runningStarted", undefined] | 
["runningEnded", undefined] |
["editError", { file: WPFile, error: unknown}] |
["createError", { file: WPFile, error: unknown}] |
["middlewareError", { file: WPFile, error: unknown}]
>
```

Attach once to an event with:
```typescript
// "to" is also exported from the main package
Client.$attachOnce(to("ready"), () => {
  console.log("Ready!");
});
```

or as many times until the callback is detached:
```typescript
// "to" is also exported from the main package
Client.$attach(to("editError"), ({ file, error }) => {
  console.log(`Error! file: ${file.path}`);
});
```

The available event names are:
* `ready`
  * `undefined`
* `loginError`
  * `{ error: any }`
* `runningStarted`
  * ` undefined`
* `runningEnded`
  * `undefined`
* `editError`
  * `{ file: WPFile, error: unknown }`
* `createError`
  * `{ file: WPFile, error: unknown }`
* `middlewareError`
  * `{ file: W{File, error: unknown }}`
