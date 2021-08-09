#! /usr/bin/env node
import yargs from "yargs/yargs";
import * as process from "process";
import type { Argv } from "yargs";

// ["run", "start"] ["build"] ["test"] TODO
yargs(process.argv.slice(2))
.scriptName("wikipages")
.version()
.usage("$0 <cmd> [args]")
.command({
  command: "$0",
  describe: "The default command, sends basic package information.",
  handler: () => console.log(`WikiPages (Node) by RumbleWikis\nHomepage: https://github.com/RumbleWikis/WikiPages\n\nUse "wikipages --help" for help.`)
})
.command({
  command: "run",
  aliases: ["start"],
  describe: "TODO",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").default("comment", "Commit via WikiPages CLI"),
  handler: (args) => {
    // TODO
  }
})
.help(true)
.strict(true)
// Jullian 8/8/21: Is there a better way to do this than having it strict and show help on fail for
// 404 commands.
.showHelpOnFail(true)
.parse()