import { Command, flags } from "@oclif/command";
import glob from "fast-glob";
import fs from "fs";
import {
  buildClientSchema,
  buildSchema,
  GraphQLSchema,
  TypeInfo
} from "graphql";
import Listr from "listr";
import open from "open";
import path from "path";
import { partialRight, unary } from "ramda";
import { promisify } from "util";

import findGraphQLTags from "./findGraphQLTags";
import flatten from "./flatten";
import getFeildInfo, { FieldInfo } from "./getFieldInfo";
import getGitHubBaseURL from "./getGitHubBaseURL";
import { buildReport, Report } from "./report";
import createServer from "./server";

class GraphqlStats extends Command {
  static description =
    "Analyzes JS source files and generates a report on GraphQL field usage.";

  static examples = ["$ graphql-usage ./schema.json ./src/ --gitDir ./"];

  static flags = {
    // Required flags
    gitDir: flags.string({
      char: "g",
      description: "Path to Git project root",
      required: true
    }),

    // Optional flags
    exclude: flags.string({
      // Default provided in `run` method
      description: "Directories to ignore under src",
      multiple: true
    }),

    // Meta flags
    help: flags.help({ char: "h" }),
    version: flags.version({ char: "v" }),

    // Hidden flags
    json: flags.boolean({
      description: "Output report as JSON rather than starting the app",
      hidden: true
    })
  };

  static args = [
    { name: "schema", required: true },
    { name: "sourceDir", required: true }
  ];

  async run() {
    const { args, flags } = this.parse(GraphqlStats);
    const { schema, sourceDir } = args;
    const { gitDir, json, exclude } = flags;

    const analyzeFilesTask = {
      title: "Analyzing source files ",
      task: async (ctx: { report: Report | undefined }) => {
        ctx.report = await analyzeFiles(schema, gitDir, sourceDir, exclude);
      }
    };

    const jsonTasks = new Listr([
      analyzeFilesTask,
      {
        title: "Writing JSON",
        task: ({ report }: { report: Report }) => {
          writeJSON(report);
        }
      }
    ]);

    const appTasks = new Listr([
      analyzeFilesTask,
      {
        title: "Starting server at http://localhost:3001",
        task: ({ report }: { report: Report }) => {
          startServer(report);
        }
      }
    ]);

    await (json ? jsonTasks : appTasks).run();
  }
}

async function analyzeFiles(
  schemaFile: string,
  gitDir: string,
  sourceDir: string,
  exclude?: string[]
): Promise<Report> {
  const schema = await readSchema(schemaFile);

  const gitHubBaseURL = await getGitHubBaseURL(gitDir);

  const extensions = ["js", "jsx"];
  const defaultExclude = [
    // Node modules
    "**/node_modules/**",
    // Relay compiler artifacts
    "**/__generated__/**",
    // Test files
    "**/__mocks__/**",
    "**/__tests__/**",
    "**/*.test.js"
  ];
  const files = await glob(`**/*.+(${extensions.join("|")})`, {
    cwd: sourceDir,
    ignore: exclude || defaultExclude
  });

  const summaryFields: Promise<FieldInfo[]>[] = files.map(async filepath => {
    const fullPath = path.resolve(process.cwd(), sourceDir, filepath);
    const content = await promisify(fs.readFile)(fullPath, {
      encoding: "utf-8"
    });

    const tags = findGraphQLTags(content);
    const typeInfo = new TypeInfo(schema);

    const gitHubFileURL = fullPath.replace(path.resolve(gitDir), gitHubBaseURL);

    const fields: FieldInfo[][] = tags.map(
      unary(partialRight(getFeildInfo, [typeInfo, gitHubFileURL]))
    );

    return flatten(fields);
  });
  const resolved = await Promise.all(summaryFields);

  return buildReport(flatten(resolved), schema);
}

async function readSchema(schemaFile: string): Promise<GraphQLSchema> {
  const extension = path.extname(schemaFile);

  const schemaString = await promisify(fs.readFile)(schemaFile, {
    encoding: "utf-8"
  });

  if (extension === ".json") {
    const schemaJSON = JSON.parse(schemaString);
    return buildClientSchema(schemaJSON.data);
  }

  if (extension === ".graphql") {
    return buildSchema(schemaString);
  }

  throw new Error(
    "Invalid schema file. Please provide a .json or .graphql GraphQL schema."
  );
}

function writeJSON(report: Report): void {
  const OUTPUT_FILE = "./report.json";

  fs.writeFile(OUTPUT_FILE, JSON.stringify(report, null, 2), "utf-8", err => {
    if (err) {
      throw err;
    }
  });
}

function startServer(report: Report): void {
  const port = 3001;
  createServer(report).listen(port, async () => {
    // tslint:disable-next-line:no-http-string
    await open(`http://localhost:${port}`);
  });
}

export = GraphqlStats;
