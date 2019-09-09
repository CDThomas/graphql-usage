import {
  GraphQLField,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLType,
  isEnumType,
  isInterfaceType,
  isListType,
  isNamedType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
  isWrappingType
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

const enum TypeKind {
  Scalar = "Scalar",
  Object = "Object",
  Interface = "Interface",
  Union = "Union",
  Enum = "Enum",
  InputObject = "InputObject",
  List = "List",
  NonNull = "NonNull"
}

type ReportAccumulatorType = ReportObjectType;

interface ReportObjectType {
  fields: ReportAccumulatorFieldMap;
  kind: TypeKind.Object;
  name: string;
}

interface ReportAccumulatorFieldMap {
  [key: string]: ReportAccumulatorField;
}

interface ReportAccumulatorField {
  name: string;
  occurrences: ReportOccurrence[];
  type: ReportAccumulatorOfType;
  // args: ReportAccumulatorArgs;
}

interface ReportAccumulatorOfType {
  kind: TypeKind;
  name: string | null;
  ofType: ReportAccumulatorOfType | null;
}

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
  if (isObjectType(type)) return buildObjectType(type);

  throw new Error("report: buildType expects a GraphQLNamedType");
}

function buildObjectType(type: GraphQLObjectType): ReportObjectType {
  return {
    fields: buildFields(type),
    kind: TypeKind.Object,
    name: type.name
  };
}

function buildFields(type: GraphQLObjectType): ReportAccumulatorFieldMap {
  return Object.values(type.getFields()).reduce((fieldMap, currentField) => {
    return {
      ...fieldMap,
      [currentField.name]: buildField(currentField)
    };
  }, {});
}

function buildField(field: GraphQLField<any, any>): ReportAccumulatorField {
  const { type } = field;
  return {
    name: field.name,
    occurrences: [],
    type: buildOfType(type)
  };
}

function getTypeKind(type: GraphQLType): TypeKind {
  if (isScalarType(type)) return TypeKind.Scalar;
  if (isObjectType(type)) return TypeKind.Object;
  if (isInterfaceType(type)) return TypeKind.Interface;
  if (isUnionType(type)) return TypeKind.Union;
  if (isEnumType(type)) return TypeKind.Enum;
  if (isListType(type)) return TypeKind.List;
  if (isNonNullType(type)) return TypeKind.NonNull;
  // TODO: add input types?

  throw new Error("report: getTypeKind expects a GraphQLType");
}

function buildOfType(type: GraphQLType): ReportAccumulatorOfType {
  return {
    kind: getTypeKind(type),
    name: isNamedType(type) ? type.name : null,
    ofType: isWrappingType(type) ? buildOfType(type.ofType) : null
  };
}

function addOccurrence(
  state: ReportAccumulator,
  typeName: string,
  fieldName: string,
  occurrence: ReportOccurrence
): ReportAccumulator {
  // TODO: handle invalid type/field names.
  // TODO: why doesn't TS warn about potentially null values here?
  // TODO: github links
  state.types[typeName].fields[fieldName].occurrences.push(occurrence);
  return state;
}

function format(report: ReportAccumulator): any {
  const sortByName = R.sortBy(R.prop("name"));

  const types = Object.values(report.types).map(type => {
    const fields = Object.values(type.fields);
    return {
      ...type,
      fields: sortByName(fields)
    };
  });

  return { types: sortByName(types) };
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

    // TODO: should probably include concrete type occurrences here for interface fields
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

export { addOccurrence, buildReport, buildInitialState, format, Report };
