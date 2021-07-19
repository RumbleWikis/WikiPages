<div align="center">
    <br />
    <p>
        <b>WikiPages</b>
        <br />
        Sync wiki pages on a <b>MediaWiki wiki</b> with possible <b>configurations</b> and <b>middlware</b> from a filesystem, upon <b>call</b>
    </p>
    <p>
        <a href="//github.com/RumbleWikis/WikiPages/blob/main/LICENSE"><image src="https://img.shields.io/github/license/RumbleWikis/WikiPages" /></a>
        <a href="//www.npmjs.com/package/@rumblewikis/wikipages"><img src="https://img.shields.io/npm/v/@rumblewikis/wikipages.svg?maxAge=3600" /></a>
    </p>
    <p>
      <a href="//github.com/RumbleWikis/WikiPages-Middleware">Middlewares repository</a>
    </p>
</div>

# Dependencies
* [mwn](https://www.npmjs.com/package/mwn)

# Documentation
<div align="center">NOTICE: This documentation is as of v0.1, usage may change drastically as it reaches a full release</div>

## Path Resolving
MediaWiki's URL paths are not delightful to look at, this repository will <b>not</b> handle it the same way. (i.e:  MediaWiki's used format allows for `Module:Test` and `Module:Test/doc` to exist simultaneously as files).
* Only files read recursively from `srcDirectory` in the config will be considered and read.
* The highest ancestor of a file will determine the namespace it will be located at (i.e: `{srcDirectory}/Module/Test.lua` will be located at `Module:Test`)
* The extension of all files will be removed from the filename except for the `.js` and `.css` extensions.
* If the highest ancestor is the same value as `mainDirectory`, by default "Main", it will be considered to be in the main namespace (i.e: `{srcDirectory}/Main/Doggy.wikitext` will be located at `Doggy`).
* If a file's basename is the same string as its direct parent, it will be considered to have the path of its directory (i.e: `{srcDirectory}/Module/Test/Test.lua` will be located at `Module:Test`).
* If a file's extension is `.doc.wikitext`, it will be located at its basename appeneded by `/doc`

## Setup
### Starters
1. Download and install Node from the [NodeJS website](https://nodejs.org), this will also install npm
2. Init an empty folder with `npm init` in the terminal
3. Install WikiPages with `npm i @rumblewikis/wikipages`
### Rest
4. Import the Client:

      JavaScript
      ```js
      const { client } = require("@rumblewikis/wikipages")
      ```
  
      TypeScript
      ```ts
      import { client } from "@rumblewikis/wikipages"
      ```
5. Create a new client, types can be found in the [types.ts file](https://github.com/RumbleWikis/WikiPages/blob/main/src/types.ts)
     ```js
     const wikipedia = new Client({
       apiUrl: "https://en.wikipedia.org/api.php",
       username: "Example",
       password: "Example2",
       srcDirectory: "Wikipedia/src/pages",
       cacheFile: "md5cache.json",
       onReady: (client) => {
         // do client.run(commitMessage: string) whenever an event happens after ready, this is really ugly, yes
       }
     });
     ```
     
## Client Object
A new client can be constructed with the parameters:
`new Client(options: ClientOptions)`
* `username: string`
  * The username for the account, ex: `TotallyNotBot`, can also be a username from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords)
* `password: string`
  * The password for the account, ex: `Password123`, can also be a password from [Special:BotPasswords](https://www.mediawiki.org/wiki/Manual:Bot_passwords)
* `apiUrl: string`
  * The API url for the MediaWiki wiki, add /api.php to the base URL of the site, ex: `https://en.wikipedia.org/api.php`
* `srcDirectory: string`
  * The directory to look for the source in.
* `cacheFIle: string`
  * The directory to the file to place and search for cache in.
* `userAgent: string`
  * The user agent for all requests.
  * This is a feature from **mwn**
* `middlewareSettings?: Record<string, Record<string, any>>`
  * Middleware settings for middleware, see https://github.com/RumbleWikis/WikiPages-Middleware for more info
* `maxRetries?: number`
  * The maximum allowed of retries, will quit after the amount of retries.
  * This is a feature from **mwn**
* `mainNamespace?: string`
  * The main namespace, `(main)` on MediaWiki.
  * Default `Main`
* `middlewares?: Middleware[]
  * The middleware to add, see https://github.com/RumbleWikis/WikiPages-Middleware for more info.
* `onReady?: (client: Client) => void`
  * Start event to be called when ready.
 
`public clientOptions: ClientOptions`
* Options for the Client, this can not be changed after initialization.

`public initialized: boolean`
* The initialization state.
* Default will always be false, true when initialized

`public running: boolean`
* Whether or not there is a currently running instance scanning all files.

`private mwnClient: mwn`
* The mwn client for requests.

`public run(commitComment: string): Promise<void>`
* Run the bot, going through all middlewares.
