import { Command, flags } from "@oclif/command";
import findGraphQLTags from "./findGraphQLTags";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import {
  buildClientSchema,
  TypeInfo,
  GraphQLSchema,
  buildSchema
} from "graphql";
import flatten from "./flatten";
import getFeildInfo, { FieldInfo } from "./getFieldInfo";
import readFiles from "./readFilesSync";
import { unary, partialRight } from "ramda";
import getGitHubBaseURL from "./getGitHubBaseURL";
import { buildReport } from "./report";
import createServer from "./server";
import { exec } from "child_process";
import open from "open";

const OUTPUT_FILE = "report.json";

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

    const uiBuildPath = path.resolve(__dirname, "../graphql-stats-ui/build");

    if (!(await promisify(fs.exists)(uiBuildPath))) {
      this.log("Building static assets for UI ...");
      const currentDir = process.cwd();
      process.chdir(path.resolve(__dirname, "../graphql-stats-ui"));
      await promisify(exec)("yarn && yarn build");
      process.chdir(currentDir);
    }

    this.log("Analyzing source files and starting server ...");

    const schema = readSchema(schemaFile);

    const gitHubBaseURL = await getGitHubBaseURL(gitDir);

    const files = await readFiles(args.sourceDir);

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

    const report = buildReport(flatten(resolved), schema);

    if (json) {
      fs.writeFile(
        OUTPUT_FILE,
        JSON.stringify(report, null, 2),
        "utf-8",
        function cb(err) {
          if (err) {
            console.error(err);
          }
        }
      );
    } else {
      const port = 3001;
      createServer(report).listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
        open(`http://localhost:${port}`);
      });
    }
  }
}

function readSchema(schemaFile: string): GraphQLSchema {
  const extension = path.extname(schemaFile);

  const schemaString = fs.readFileSync(schemaFile, {
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

export = GraphqlStats;
