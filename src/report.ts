import {
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  isObjectType
  // isScalarType,
  // isInterfaceType,
  // isUnionType,
  // isEnumType,
  // isInputObjectType,
} from "graphql";
import path from "path";
import R from "ramda";

import flatten from "./flatten";
import { FieldInfo } from "./getFieldInfo";

interface ReportAccumulator {
  types: ReportAccumulatorTypeMap;
  // directives: ReportAccumulatorDirectiveMap;
}

interface ReportAccumulatorTypeMap {
  [key: string]: ReportAccumulatorType;
}

// Each of these types should probably get their own interface and
// ReportAccumulatorType would become a union of those. `kind` would then
// be a string literal (e.g. "Scalar") on each of those interfaces.
// Probably just need named types (both input and output)

const enum TypeKind {
  Scalar = "Scalar",
  Object = "Object",
  Interface = "Interface",
  Union = "Union",
  Enum = "Enum",
  InputObject = "InputObject"
}

// TODO: consider making this a union of other types (e.g. ObjectType | EnumType)
interface ReportAccumulatorType {
  name: string;
  fields: ReportAccumulatorFieldMap; // TODO: should this be nullable rather than empty?
  kind: TypeKind;
}

interface ReportAccumulatorFieldMap {
  [key: string]: ReportAccumulatorField;
}

interface ReportAccumulatorField {
  name: string;
  // occurences: ReportOccurrence;
  // type: ReportAccumulatorOfType;
  // args: ReportAccumulatorArgs;
}

// interface ReportAccumulatorOfType {
//   kind: TypeKind;
//   name: string;
//   ofType: ReportAccumulatorOfType | null; // TODO: Maybe<T>?
// }

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

function buildInitialState(schema: GraphQLSchema): ReportAccumulator {
  const types = schema.toConfig().types.reduce((typeMap, type) => {
    // TODO: non-object types
    return isObjectType(type)
      ? {
          ...typeMap,
          [type.name]: buildType(type)
        }
      : typeMap;
  }, {});

  return {
    types
  };
}

function buildType(type: GraphQLNamedType): ReportAccumulatorType {
  if (isObjectType(type)) {
    const fields = buildFields(type);

    return {
      name: type.name,
      kind: TypeKind.Object,
      fields
    };
  }

  throw new Error("report: buildType expects a GraphQLNamedType");
}

function buildFields(type: GraphQLObjectType): ReportAccumulatorFieldMap {
  return Object.values(type.getFields()).reduce((fieldMap, currentField) => {
    return {
      ...fieldMap,
      [currentField.name]: {
        name: currentField.name
      }
    };
  }, {});
}

function buildReport(
  summaryFields: FieldInfo[],
  schema: GraphQLSchema,
  gitDir: string,
  gitHubBaseURL: string
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
      const gitHubFileURL = summaryField.filePath.replace(
        path.resolve(gitDir),
        gitHubBaseURL
      );
      const link = `${gitHubFileURL}#L${summaryField.line}`;

      return {
        filename: link,
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

export { buildReport, buildInitialState, Report };
