import { Command, flags } from "@oclif/command";
import findGraphQLTags from "./findGraphQLTags";
import fs from "fs";
import path from "path";

function readFilesSync(dir: string) {
  const files: {
    filepath: string;
    name: string;
    ext: string;
    stat: fs.Stats;
    content: string;
  }[] = [];

  fs.readdirSync(dir).forEach(filename => {
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();
    const content = fs.readFileSync(path.resolve(filepath), {
      encoding: "utf-8"
    });

    if (isFile) files.push({ filepath, name, ext, stat, content });
  });

  files.sort((a, b) => {
    // natural sort alphanumeric strings
    // https://stackoverflow.com/a/38641281
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });

  return files;
}

class GraphqlStats extends Command {
  static description = "describe the command here";

  static flags = {
    // add --version flag to show CLI version
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

    var srcFiles = readFilesSync(args.sourceDir).map(({ name, content }) => ({
      name,
      tags: findGraphQLTags(content)
    }));

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
