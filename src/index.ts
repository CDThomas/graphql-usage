import { Command, flags } from "@oclif/command";
import findGraphQLTags from "./findGraphQLTags";
import fs from "fs";
import path from "path";
import { buildClientSchema, TypeInfo } from "graphql";
import flatten from "./flatten";
import getFeildInfo, { FieldInfo } from "./getFieldInfo";
import readFilesSync from "./readFilesSync";
import R, { unary, partialRight } from "ramda";
import getGitHubBaseURL from "./getGitHubBaseURL";

import {
  GraphQLField,
  GraphQLSchema,
  GraphQLAbbreviatedType,
  getTypes
} from "./schemaUtils";

interface Report {
  data: {
    types: ReportType[];
  };
}

interface ReportType {
  name: string;
  fields: ReportField[];
}

interface ReportField {
  parentType: string;
  type: string;
  name: string;
  occurrences: ReportOccurrence[];
}

interface ReportOccurrence {
  filename: string;
  rootNodeName: string;
}

function formatTypeName(type: GraphQLAbbreviatedType): string {
  switch (type.kind) {
    case "LIST":
      return `[${formatTypeName(type.ofType)}]`;
    case "NON_NULL":
      return `${formatTypeName(type.ofType)}!`;
    default:
      return type.name;
  }
}

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

    const schemaFile = flags.schema || "schema.json";

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

    const byName = R.groupBy((summaryField: FieldInfo) => {
      return `${summaryField.parentType}.${summaryField.name}`;
    });

    const summaryFieldsByName = byName(flatten(summaryFields));

    // Get all fields in schema
    // For each field
    // Format as Report field
    //   Find occurrences in matching summary fields
    const fields: ReportField[] = flatten(
      getTypes(<GraphQLSchema>schema).map(type => {
        if (!type.fields) return [];

        return type.fields.map(
          (field: GraphQLField): ReportField => {
            return {
              parentType: type.name,
              type: formatTypeName(field.type),
              name: field.name,
              occurrences: []
            };
          }
        );
      })
    );

    const reportFields = fields.map(field => {
      const summaryFields =
        summaryFieldsByName[`${field.parentType}.${field.name}`];

      if (!summaryFields) return field;

      // TODO: should probably include concrete type occurences here for interface fields
      // TODO: how to handle unions?
      const occurrences = summaryFields.map(summaryField => {
        return {
          filename: summaryField.link,
          rootNodeName: summaryField.rootNodeName
        };
      });

      return {
        ...field,
        occurrences
      };
    });

    const byParentType = R.groupBy(({ parentType }: ReportField) => parentType);
    const sortByName = R.sortBy(R.prop("name"));

    const reportTypes: ReportType[] = Object.entries(
      byParentType(reportFields)
    ).map(item => {
      const [name, fields] = item;
      return { name, fields: sortByName(fields) };
    });

    const report: Report = {
      data: {
        types: sortByName(reportTypes)
      }
    };

    const output = report;

    fs.writeFile(
      path.resolve(__dirname, "../graphql-stats-ui/src/graphql-stats.json"),
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
