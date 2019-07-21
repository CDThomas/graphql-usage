import { Command, flags } from "@oclif/command";
import { exec } from "child_process";
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
import readFiles from "./readFiles";
import { buildReport, Report } from "./report";
import createServer from "./server";

class GraphqlStats extends Command {
  static description = "describe the command here";

  static flags = {
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    schema: flags.string({ char: "s", description: "GraphQL schema" }),
    gitDir: flags.string({
      char: "g",
      description: "Path to Git project root",
      required: true
    }),
    json: flags.boolean({
      description: "Output report as JSON rather than starting the app"
    })
  };

  static args = [{ name: "sourceDir", required: true }];

  async run() {
    const { args, flags } = this.parse(GraphqlStats);
    const { gitDir, json } = flags;

    const schemaFile = flags.schema || "schema.json";

    const uiBuildPath = path.resolve(__dirname, "../graphql-usage-ui/build");
    const isUIBuilt = await exists(uiBuildPath);

    const analyzeFilesTask = {
      title: "Analyzing source files ",
      task: async (ctx: { report: Report | undefined }) => {
        ctx.report = await analyzeFiles(schemaFile, gitDir, args.sourceDir);
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

    const concurrentTasks = new Listr(
      [
        {
          title: "Building static assets",
          skip: () => {
            if (isUIBuilt) return "Already built";
          },
          task: async () => {
            await buildStaticAssets();
          }
        },
        analyzeFilesTask
      ],
      { concurrent: true }
    );

    const appTasks = new Listr([
      {
        title: "Building report",
        task: () => concurrentTasks
      },
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

async function analyzeFiles(
  schemaFile: string,
  gitDir: string,
  sourceDir: string
): Promise<Report> {
  const schema = await readSchema(schemaFile);

  const gitHubBaseURL = await getGitHubBaseURL(gitDir);

  const files = await readFiles(sourceDir);

  const summaryFields: Promise<FieldInfo[]>[] = files
    .filter(({ ext }) => ext === ".js")
    .map(async ({ filepath }) => {
      const content = await promisify(fs.readFile)(filepath, {
        encoding: "utf-8"
      });

      const tags = findGraphQLTags(content);
      const typeInfo = new TypeInfo(schema);

      const gitHubFileURL = filepath.replace(
        path.resolve(gitDir),
        gitHubBaseURL
      );

      const fields: FieldInfo[][] = tags.map(
        unary(partialRight(getFeildInfo, [typeInfo, gitHubFileURL]))
      );

      return flatten(fields);
    });
  const resolved = await Promise.all(summaryFields);

  return buildReport(flatten(resolved), schema);
}

async function buildStaticAssets() {
  const uiPath = path.resolve(__dirname, "../graphql-usage-ui");
  await promisify(exec)("yarn && yarn build", { cwd: uiPath });
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

async function exists(path: string): Promise<boolean> {
  try {
    await promisify(fs.access)(path, fs.constants.R_OK);
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  return true;
}

export = GraphqlStats;
