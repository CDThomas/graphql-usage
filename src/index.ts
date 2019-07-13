import { Command, flags } from "@oclif/command";
import findGraphQLTags from "./findGraphQLTags";
import fs from "fs";
import path from "path";
import { buildClientSchema, TypeInfo } from "graphql";
import flatten from "./flatten";
import getFeildInfo from "./getFieldInfo";
import readFilesSync from "./readFilesSync";
import { unary, partialRight } from "ramda";
import NodeGit from "nodegit";

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
    })
  };

  static args = [{ name: "sourceDir", required: true }];

  async run() {
    const { args, flags } = this.parse(GraphqlStats);
    const { gitDir } = flags;

    const { refName, remoteURL } = await NodeGit.Repository.open(gitDir).then(
      async repo => {
        const refName = await repo.getCurrentBranch().then(ref => {
          return ref.name();
        });

        const remoteURL = await repo.getRemote("origin").then(remote => {
          return remote.url();
        });

        return { refName, remoteURL };
      }
    );

    const branchNameRegEx = /^refs\/heads\/(.*)/;
    const repoBasePathRegEx = /^git@github\.com:(.*)\.git$/;

    const branchName = refName.match(branchNameRegEx)[1];
    const repoBasePath = remoteURL.match(repoBasePathRegEx)[1];
    const githubURL = `https://github.com/${repoBasePath}/tree/${branchName}`;

    const schemaFile = flags.schema || "schema.json";

    const schema = fs.readFileSync(path.resolve(schemaFile), {
      encoding: "utf-8"
    });

    var fields = readFilesSync(args.sourceDir)
      .filter(({ ext }) => ext === ".js")
      .map(({ filepath }) => {
        const content = fs.readFileSync(filepath, {
          encoding: "utf-8"
        });

        const tags = findGraphQLTags(content);
        const { data } = JSON.parse(schema);
        const typeInfo = new TypeInfo(buildClientSchema(data));

        const githubBaseURL = filepath.replace(path.resolve(gitDir), githubURL);
        const fields = tags.map(
          unary(partialRight(getFeildInfo, [typeInfo, githubBaseURL]))
        );

        return flatten(fields);
      });

    const output = { fields: flatten(fields) };

    fs.writeFile(
      "test.json",
      JSON.stringify(output, null, 2),
      "utf-8",
      function cb(err) {
        if (err) {
          console.error(err);
        }
      }
    );
  }
}

export = GraphqlStats;
