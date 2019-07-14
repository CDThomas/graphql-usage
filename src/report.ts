import R from "ramda";
import flatten from "./flatten";
import { FieldInfo } from "./getFieldInfo";
import {
  GraphQLAbbreviatedType,
  GraphQLField,
  GraphQLSchema,
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

function buildReport(
  summaryFields: FieldInfo[],
  schema: GraphQLSchema
): Report {
  const byName = R.groupBy((summaryField: FieldInfo) => {
    return `${summaryField.parentType}.${summaryField.name}`;
  });

  const summaryFieldsByName = byName(summaryFields);

  // Get all fields in schema
  // For each field
  // Format as Report field
  //   Find occurrences in matching summary fields
  const fields: ReportField[] = flatten(
    getTypes(schema).map(type => {
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

  return {
    data: {
      types: sortByName(reportTypes)
    }
  };
}

export { buildReport, Report };
