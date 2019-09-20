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

import findJSGraphQLTags from "./findJSGraphQLTags";
import findTSGraphQLTags from "./findTSGraphQLTags";
import flatten from "./flatten";
import getFeildInfo, { FieldInfo } from "./getFieldInfo";
import { getGitHubBaseURL, getGitProjectRoot } from "./gitUtils";
import { addOccurrence, buildInitialState, format, Report } from "./report";
import createServer from "./server";
import { GraphQLTag } from "./types";

class GraphqlStats extends Command {
  static description =
    "Analyzes JS source files and generates a report on GraphQL field usage.";

  static examples = ["$ graphql-usage ./schema.json ./src/"];

  static flags = {
    exclude: flags.string({
      // Default provided in `run` method
      description: "Directories to ignore under src",
      multiple: true
    }),
    port: flags.integer({
      description: "Port to run the report server on",
      default: 3001
    }),
    quiet: flags.boolean({
      description: "No output to stdout",
      default: false
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
    const { json, exclude, port, quiet } = flags;
    const renderer = quiet ? "silent" : "default";

    const analyzeFilesTask = {
      title: "Analyzing source files ",
      task: async (ctx: { report: Report | undefined }) => {
        ctx.report = await analyzeFiles(schema, sourceDir, exclude);
      }
    };

    const jsonTasks = new Listr(
      [
        analyzeFilesTask,
        {
          title: "Writing JSON",
          task: async ({ report }: { report: Report }) => {
            await writeJSON(report);
          }
        }
      ],
      { renderer }
    );

    const appTasks = new Listr(
      [
        analyzeFilesTask,
        {
          title: `Starting server at http://localhost:${port}`,
          task: ({ report }: { report: Report }) => {
            startServer(report, port);
          }
        }
      ],
      { renderer }
    );

    await (json ? jsonTasks : appTasks).run();
  }
}

async function analyzeFiles(
  schemaFile: string,
  sourceDir: string,
  exclude?: string[]
): Promise<Report> {
  const schema = await readSchema(schemaFile);

  const gitHubBaseURL = await getGitHubBaseURL(sourceDir);
  const gitDir = await getGitProjectRoot(sourceDir);

  const extensions = ["js", "jsx", "ts", "tsx"];
  const defaultExclude = [
    // Node modules
    "**/node_modules/**",
    // Relay compiler artifacts
    "**/__generated__/**",
    // Test files
    "**/__mocks__/**",
    "**/__tests__/**",
    "**/*.test.(js|jsx|ts|tsx)"
  ];
  const files = await glob(`**/*.+(${extensions.join("|")})`, {
    cwd: sourceDir,
    ignore: exclude || defaultExclude
  });

  const data = await Promise.all<SourceFile>(
    files.map(unary(partialRight(readFile, [sourceDir])))
  );
  let tags = flatten(data.map(findGraphQLTags));

  const state = buildInitialState(schema);
  findFields(
    schema,
    tags,
    ({ parentType, name, filePath, line, rootNodeName }: FieldInfo) => {
      const gitHubFileURL = filePath.replace(
        path.resolve(gitDir),
        gitHubBaseURL
      );
      const link = `${gitHubFileURL}#L${line}`;

      addOccurrence(state, parentType, name, {
        filename: link,
        rootNodeName
      });
    }
  );

  return format(state);
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

function writeJSON(report: Report): Promise<void> {
  const OUTPUT_FILE = "./report.json";

  return promisify(fs.writeFile)(
    OUTPUT_FILE,
    JSON.stringify(report, null, 2),
    "utf-8"
  );
}

function startServer(report: Report, port: number): void {
  createServer(report).listen(port, async () => {
    // tslint:disable-next-line:no-http-string
    await open(`http://localhost:${port}`);
  });
}

interface SourceFile {
  content: string;
  extname: string;
  fullPath: string;
}

async function readFile(
  filePath: string,
  sourceDir: string
): Promise<SourceFile> {
  const fullPath = path.resolve(process.cwd(), sourceDir, filePath);
  const extname = path.extname(filePath);
  const content = await promisify(fs.readFile)(fullPath, {
    encoding: "utf-8"
  });

  return { fullPath, extname, content };
}

function findGraphQLTags({
  fullPath,
  extname,
  content
}: SourceFile): GraphQLTag[] {
  let tags: GraphQLTag[] | undefined;
  if (extname === ".js" || extname === ".jsx") {
    tags = findJSGraphQLTags(content, fullPath);
  }
  if (extname === ".ts" || extname === ".tsx") {
    tags = findTSGraphQLTags(content, fullPath);
  }

  if (!tags) {
    throw new Error("run: analyzeFiles expects a js, jsx, tx, or tsx file");
  }

  return tags;
}

function findFields(
  schema: GraphQLSchema,
  tags: GraphQLTag[],
  cb: (data: FieldInfo) => void
): void {
  const typeInfo = new TypeInfo(schema);

  tags.forEach((tag: GraphQLTag) => {
    getFeildInfo(tag, typeInfo, cb);
  });
}

export = GraphqlStats;
