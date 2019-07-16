import { Command, flags } from "@oclif/command";
import findGraphQLTags from "./findGraphQLTags";
import fs from "fs";
import path from "path";
import { buildClientSchema, TypeInfo } from "graphql";
import flatten from "./flatten";
import getFeildInfo, { FieldInfo } from "./getFieldInfo";
import readFilesSync from "./readFilesSync";
import { unary, partialRight } from "ramda";
import getGitHubBaseURL from "./getGitHubBaseURL";
import { buildReport } from "./report";
import createServer from "./server";
import { execSync } from "child_process";
import open from "open";

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

    if (!fs.existsSync(uiBuildPath)) {
      this.log("Building static assets for UI ...");
      const currentDir = process.cwd();
      process.chdir(path.resolve(__dirname, "../graphql-stats-ui"));
      execSync("yarn && yarn build");
      process.chdir(currentDir);
    }

    this.log("Analyzing source files and starting server ...");

    const schema = JSON.parse(
      fs.readFileSync(path.resolve(schemaFile), {
        encoding: "utf-8"
      })
    );

    const gitHubBaseURL = await getGitHubBaseURL(gitDir);

    const summaryFields: FieldInfo[][] = readFilesSync(args.sourceDir)
      .filter(({ ext }) => ext === ".js")
      .map(({ filepath }) => {
        const content = fs.readFileSync(filepath, {
          encoding: "utf-8"
        });

        const tags = findGraphQLTags(content);
        const { data } = schema;
        const typeInfo = new TypeInfo(buildClientSchema(data));

        const gitHubFileURL = filepath.replace(
          path.resolve(gitDir),
          gitHubBaseURL
        );

        const fields: FieldInfo[][] = tags.map(
          unary(partialRight(getFeildInfo, [typeInfo, gitHubFileURL]))
        );

        return flatten(fields);
      });

    const report = buildReport(flatten(summaryFields), schema);

    if (json) {
      fs.writeFile(
        path.resolve(__dirname, "../graphql-stats-ui/src/graphql-stats.json"),
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

export = GraphqlStats;
