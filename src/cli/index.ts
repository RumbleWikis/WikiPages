#! /usr/bin/env node
import yargs from "yargs/yargs";
import { Client, to, WPFile } from "../index";
import * as process from "process";
import * as fs from "fs";
import { resolve as resolvePath } from "path";
import getAllFiles from "../utils/getAllFiles";
import { Argv } from "yargs";

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
    .default("silent", "true")
    .describe("project", "The path to the project (.wiki.js) file")
    .describe("comment", "The default commit (or edit) summary")
    .describe("silent", "Whether or not it shouldn't log errors"),
  handler: async (argv) => {
    try {
      const client = await Client.initFromFile(argv.project);
      if (argv.silent === "false") client.$attach(to("middlewareError"), (error) => console.log(`middlewareError: ${error.error}`));
      if (argv.silent === "false") client.$attach(to("editError"), (error) => console.log(`editError: ${error.error}`));
      if (argv.silent === "false") client.$attach(to("createError"), (error) => console.log(`editError: ${error.error}`));
      await client.run(argv.comment);
      console.log(`Finished pushing to ${client.clientOptions!.credentials.apiUrl}`);
      process.exit(0);
    } catch (error) {
      if (argv.silent === "false") console.error((error as TypeError).message);
      process.exit(0);
    }
  }
})
.command({
  command: "build [file]",
  describe: "Gets the file and runs it through all middlewares, logs the errors, and will write to file if out is specified",
  builder: (yargs: Argv) => yargs
    .default("project", "default.wiki.js")
    .default("silent", "true")
    .string("out")
    .string("file")
    .demandOption("file")
    .describe("project", "The path to the project (.wiki.js) file")
    .describe("out", "The path to the file to be written in the current directory")
    .describe("file", "The path to the file in the srcDirectory")
    .describe("silent", "Whether or not it shouldn't log errors"),
  handler: async (argv) => {
    try {
      const client = await Client.initFromFile(argv.project);
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

        if ((argv.silent === "false") && wpFile.errors.length)
          wpFile.errors.forEach(console.log); 
        
        if (wpFile.shouldCommit) { 
          if (argv.out) { 
            try {
              fs.writeFileSync(argv.out, wpFile.source!);
              console.log(`Wrote to ${argv.out}`);
            } catch {
              if (argv.silent === "false") console.error(`Could not write to "${argv.out}", is it a valid file path?`);
            }
            process.exit(0);
          } else console.log(wpFile.source);
        } else process.exit(0);
      } catch {
        if (argv.silent === "false") console.error(`"${argv.file}" is not a valid file.`);
        process.exit(0);
      }
    } catch (error) {
      if (argv.silent === "false") console.error((error as TypeError).message);
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
    .default("silent", "true")
    .string("file")
    .describe("project", "The path to the project (.wiki.js) file")
    .describe("file", "The file to be checked")
    .describe("silent", "Whether or not it shouldn't log errors"),
  handler: async (argv) => {
    try {
      const client = await Client.initFromFile(argv.project);
      try {
        const filesPromise: Promise<void>[] = [];
        const files = argv.file ? [`${client.clientOptions!.path.srcDirectory}/${argv.file}`] : getAllFiles(client.clientOptions!.path.srcDirectory);
        files.forEach(file => {
          filesPromise.push((async () => {
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
              try {
                await client.buildFile(wpFile);
                console.log(`File ${file} had ${wpFile.errors.length} errors`);
                if (wpFile.errors.length && (argv.silent === "false")) wpFile.errors.forEach(error => console.error(error));
              } catch {
                if (argv.silent === "false") console.error(`An error occurred while building "${file}"`);
              }
            } catch {
              if (argv.silent === "false") console.error(`"${file}" is not a valid file.`);
            }
            return;
          })()); 
        });
        await Promise.all(filesPromise);
        console.log(`Finished checking ${files.length} files`);
        process.exit(0);
      } catch (error) {
        if (argv.silent === "false") console.error((error as Error).message);
        process.exit(0);
      }
    } catch (error) {
      if (argv.silent === "false") console.error((error as Error).message);
      process.exit(0);
    }
  }
})
.help(true)
.strict(true)
.showHelpOnFail(true)
.parseAsync()