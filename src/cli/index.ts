#! /usr/bin/env node
import * as process from "process";
import * as fs from "fs";
import { resolve as resolvePath } from "path";
import { Client, to, WPFile } from "../index";
import chalk from "chalk";
import yargs from "yargs/yargs";
import getAllFiles from "../utils/getAllFiles";
import type { Argv } from "yargs";

const argv = yargs(process.argv.slice(2))
.scriptName("wikipages")
.version()
.usage("$0 <cmd> [args]")
.command({
  command: "$0",
  describe: "The default command, sends basic package information",
  handler: () => console.log(`WikiPages (NodeJS) by RumbleWikis\nHomepage: https://github.com/RumbleWikis/WikiPages\n\nUse "wikipages --help" for help.`)
})
.command({
  command: "run",
  aliases: ["start"],
  describe: "Gets all files in the specified srcDirectory and pushes them to the Wiki",
  builder: (yargs: Argv) => yargs
    .default("project", "default.wiki.js")
    .default("comment", "Commit via WikiPages CLI")
    .default("quiet", "true")
    .describe("project", "The path to the project (.wiki.js) file")
    .describe("comment", "The default commit (or edit) summary")
    .describe("quiet", "Whether or not it shouldn't log errors"),
  handler: async (argv) => {
    try {
      const client = await Client.initFromFile(argv.project);
      if (argv.quiet === "false") client.$attach(to("middlewareError"), (error) => console.log(`middlewareError: ${error.error}`));
      if (argv.quiet === "false") client.$attach(to("editError"), (error) => console.log(`editError: ${error.error}`));
      if (argv.quiet === "false") client.$attach(to("createError"), (error) => console.log(`editError: ${error.error}`));
      await client.run(argv.comment);
      console.log(`${chalk.greenBright("Done:")} Pushed to ${client.clientOptions!.credentials.apiUrl}`);
      process.exit(0);
    } catch (error) {
      if (argv.quiet === "false") console.error(`${chalk.red("Error:")} ${(error as TypeError).message}`);
      process.exit(0);
    }
  }
})
.command({
  command: "build [file]",
  describe: "Gets the file and runs it through all middlewares, logs the errors, and will write to file if out is specified",
  builder: (yargs: Argv) => yargs
    .default("project", "default.wiki.js")
    .default("quiet", "true")
    .string("out")
    .string("file")
    .demandOption("file")
    .describe("project", "The path to the project (.wiki.js) file")
    .describe("out", "The path to the file to be written in the current directory")
    .describe("file", "The path to the file in the srcDirectory")
    .describe("quiet", "Whether or not it shouldn't log errors"),
  handler: async (argv) => {
    try {
      const client = Client.newFromFile(argv.project);
      try {
        const filePath = resolvePath(`${client.clientOptions!.path.srcDirectory}/${argv.file}`);
        const file = fs.readFileSync(filePath);
        const parsedFileInformation = client.parseFileName(filePath);
        const wpFile = new WPFile({
          originalShortExtension: parsedFileInformation.originalShortExtension,
          originalLongExtension: parsedFileInformation.originalLongExtension,
          originalPath: filePath,
          path: parsedFileInformation.path,
          source: file.toString()
        });

        await client.buildFile(wpFile);

        if ((argv.quiet === "false") && wpFile.errors.length)
          wpFile.errors.forEach(console.log); 
        
        if (wpFile.shouldCommit) { 
          if (argv.out) { 
            try {
              fs.writeFileSync(resolvePath(process.cwd(), argv.out), wpFile.source!);
              console.log(`${chalk.greenBright("Done:")} Wrote to ${argv.out}`);
            } catch {
              if (argv.quiet === "false") console.error(`${chalk.red("Error:")} Could not write to "${argv.out}", is it a valid file path?`);
            }
            process.exit(0);
          } else console.log(wpFile.source);
        } else process.exit(0);
      } catch {
        if (argv.quiet === "false") console.error(`${chalk.red("Error:")} "${argv.file}" is not a valid file.`);
        process.exit(0);
      }
    } catch (error) {
      if (argv.quiet === "false") console.error(`${chalk.red("Error:")} ${(error as TypeError).message}`);
      process.exit(0);
    }
  }
})
.command({
  command: "test [file]",
  aliases: ["check"],
  describe: "Gets the file or all files in srcDirectory and runs it through all middlewares, and logs the errors",
  builder: (yargs: Argv) => yargs
    .default("project", "default.wiki.js")
    .default("quiet", "true")
    .string("file")
    .describe("project", "The path to the project (.wiki.js) file")
    .describe("file", "The file to be checked")
    .describe("quiet", "Whether or not it shouldn't log errors"),
  handler: async (argv) => {
    try {
      const client = Client.newFromFile(argv.project);
      try {
        const filesPromise: Promise<WPFile | void>[] = [];
        const files = argv.file ? [`${client.clientOptions!.path.srcDirectory}/${argv.file}`] : getAllFiles(client.clientOptions!.path.srcDirectory);
        files.forEach(file => {
          filesPromise.push(new Promise(async (resolve) => {
            try {
              const fileContent = fs.readFileSync(file);
              const parsedFileInformation = client.parseFileName(file);
              const wpFile = new WPFile({
                originalShortExtension: parsedFileInformation.originalShortExtension,
                originalLongExtension: parsedFileInformation.originalLongExtension,
                originalPath: file,
                path: parsedFileInformation.path,
                source: fileContent.toString()
              });
              await client.buildFile(wpFile);
              if (wpFile.errors.length && argv.quiet === "false") wpFile.errors.forEach(error => console.log(`${chalk.red(`Error (${file}):`)} ${error}`));
              resolve(wpFile);
            } catch {
              if (argv.quiet === "false") console.error(`${chalk.red("Error:")} "${file}" is not a valid file.`);
              resolve();
            }
          })); 
        });
        const wpFiles = await Promise.all(filesPromise) as WPFile[];

        let errorCount: number = 0;
        let successfulFileCount: number = 0;
        wpFiles.forEach(file => {
          if (file.errors.length) { errorCount += file.errors.length } else successfulFileCount++;
        });
        const erroredFiles = wpFiles.filter(file =>
          file.errors.length
        ).map(file => file.originalPath).join("\n- ");

        console.log(`${chalk.greenBright("Done:")} Checked ${chalk.bold(wpFiles.length)} files\n${chalk.green(successfulFileCount)} succeeded\n${chalk.red(wpFiles.length - successfulFileCount)} had errors${errorCount ? `\nFiles that had errors:\n- ${erroredFiles}` : ""}`);

        process.exit(0);
      } catch (error) {
        if (argv.quiet === "false") console.error(`${chalk.red("Error:")} ${error}`);
        process.exit(0);
      }
    } catch (error) {
      if (argv.quiet === "false") console.error(`${chalk.red("Error:")} ${error}`);
      process.exit(0);
    }
  }
})
.help(true)
.strict(true)
.showHelpOnFail(true)
.parseAsync()