#! /usr/bin/env node
import yargs from "yargs/yargs";
import { Client, to, WPFile } from "../index";
import * as process from "process";
import * as fs from "fs";
import { Argv } from "yargs";

// TODO: [Need to improve core library before CLI
const argv = yargs(process.argv.slice(2))
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
  describe: "Gets all files in the specified srcDirectory and pushes them to the wiki.",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").default("comment", "Commit via WikiPages CLI"),
  handler: async (argv) => {
    try {
      const client = await Client.initFromFile(argv.project);
      client.$attach(to("middlewareError"), (error) => console.log(`middlewareError: ${error.error}`));
      client.$attach(to("editError"), (error) => console.log(`editError: ${error.error}`));
      client.$attach(to("createError"), (error) => console.log(`editError: ${error.error}`));
      await client.run(argv.comment);
      process.exit(0);
    } catch (error) {
      console.error((error as TypeError).message);
    }
  }
})
.command({
  command: "build [file]",
  describe: "Gets the file and runs it through all middlewares, logs the errors, and will write to file if out is specified.",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").string("out").string("file"),
  handler: async (argv) => {
    if (!argv.file) {
      console.error(`"file" is required for this operation.`);
      process.exit(0);
    }
    try {
      const client = await Client.initFromFile(argv.project);
      try {
        const filePath = `${client.clientOptions!.srcDirectory ?? ""}/${argv.file}`;
        const file = fs.readFileSync(filePath);
        const parsedFileInformation = client.parseFileName(argv.file);
        const wpFile = new WPFile({
          originalShortExtension: parsedFileInformation.originalShortExtension,
          originalLongExtension: parsedFileInformation.originalLongExtension,
          originalPath: filePath,
          source: file.toString()
        });

        client.buildFile(wpFile);

        if (wpFile.errors.length)
          wpFile.errors.forEach(console.log); 
        
        if (wpFile.shouldCommit) { 
          if (argv.out) { 
            try {
              fs.writeFileSync(argv.out, wpFile.source!);
              console.log(`Wrote to ${argv.out}`);
            } catch {
              console.error(`Could not write to "${argv.out}", is it a valid file path?`);
            }
            process.exit(0);
          } else console.log(wpFile.source);
        } else process.exit(0);
      } catch {
        console.error(`"${argv.file}" is not a valid file.`);
        process.exit(0);
      }
    } catch (error) {
      console.error((error as TypeError).message);
      process.exit(0);
    }
  }
})
.command({
  command: "test [file]",
  aliases: ["check"],
  describe: "Gets the file or all files in srcDirectory and runs it through all middlewares, and logs the errors.",
  builder: (yargs: Argv) => yargs.default("project", "default.wiki.js").string("file"),
  handler: async (argv) => {
  }
})
.help(true)
.strict(true)
.showHelpOnFail(true)
.parse()