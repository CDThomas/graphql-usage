import { Command, flags } from "@oclif/command";
import findGraphQLTags from "./findGraphQLTags";
import fs from "fs";
import path from "path";
import { buildClientSchema, TypeInfo } from "graphql";
import flatten from "./flatten";
import getFeildInfo from "./getFieldInfo";
import readFilesSync from "./readFilesSync";
import { unary, partialRight } from "ramda";

class GraphqlStats extends Command {
  static description = "describe the command here";

  static flags = {
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    schema: flags.string({ char: "s", description: "GraphQL schema" })
  };

  static args = [{ name: "sourceDir", required: true }];

  async run() {
    const { args, flags } = this.parse(GraphqlStats);

    const schemaFile = flags.schema || "schema.json";

    const schema = fs.readFileSync(path.resolve(schemaFile), {
      encoding: "utf-8"
    });

    var srcFiles = readFilesSync(args.sourceDir).map(
      ({ filepath, content }) => {
        const tags = findGraphQLTags(content);
        const { data } = JSON.parse(schema);
        const typeInfo = new TypeInfo(buildClientSchema(data));

        const fields = tags.map(unary(partialRight(getFeildInfo, [typeInfo])));

        return {
          filepath,
          fields: flatten(fields)
        };
      }
    );

    const typeCount = JSON.parse(schema).data.__schema.types.length;
    const output = { typeCount, src: args.sourceDir, srcFiles };

    fs.writeFile("test.json", JSON.stringify(output), "utf-8", function cb(
      err
    ) {
      if (err) {
        console.error(err);
      }
    });
  }
}

export = GraphqlStats;
