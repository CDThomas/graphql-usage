import R from "ramda";
import flatten from "./flatten";
import { FieldInfo } from "./getFieldInfo";
import { isObjectType, GraphQLSchema } from "graphql";

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
    schema.toConfig().types.map(type => {
      if (!isObjectType(type)) return [];

      return Object.values(type.getFields()).map(
        (field): ReportField => {
          return {
            parentType: type.name,
            type: field.type.toString(),
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
