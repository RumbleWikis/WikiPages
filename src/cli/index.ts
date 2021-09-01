#! /usr/bin/env node
import yargs from "yargs/yargs";
import * as process from "process";
import type { Argv } from "yargs";

// TODO: ["run", "start"] ["build"] ["test"]
// Need to improve basic library before CLI
yargs(process.argv.slice(2))
.scriptName("wikipages")
.version()
.usage("$0 <cmd> [args]")
.command({
  command: "$0",
  describe: "The default command, sends basic package information.",
  handler: () => console.log(`WikiPages (NodeJS) by RumbleWikis\nHomepage: https://github.com/RumbleWikis/WikiPages\n\nUse "wikipages --help" for help.`)
})
.command({
  command: "run",
  aliases: ["start"],
  describe: "TODO",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").default("comment", "Commit via WikiPages CLI"),
  handler: (argv) => {
    // TODO
  }
})
.command({
  command: "build [file]",
  describe: "TODO",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").string("out").string("file"),
  handler: (argv) => {
    // TODO
  }
})
.command({
  command: "test [file]",
  describe: "TODO",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").string("file"),
  handler: (argv) => {
    // TODO
  }
})
.help(true)
.strict(true)
.showHelpOnFail(true)
.parse()
