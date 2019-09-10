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
import R from "ramda";

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

type ReportAccumulatorType = ReportAccumulatorObjectType;

interface ReportAccumulatorObjectType {
  fields: ReportAccumulatorFieldMap;
  // kind: TypeKind.Object;
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
  type: string;
  parentType: string;
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
    // TODO: abstract types are breaking tests at the moment
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

function buildObjectType(type: GraphQLObjectType): ReportAccumulatorObjectType {
  return {
    fields: buildFields(type),
    // kind: TypeKind.Object,
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
  // TODO: handle non-object types
  if (!state.types[typeName]) {
    return state;
  }

  // TODO: handle invalid type/field names.
  // TODO: why doesn't TS warn about potentially null values here?
  state.types[typeName].fields[fieldName].occurrences.push(occurrence);
  return state;
}

function format(report: ReportAccumulator): Report {
  const sortByName = R.sortBy(R.prop("name"));

  const types = Object.values(report.types).map(type => {
    // TODO: Remove this. Types are formatted as strings and the parent type is here for ease of
    //       refactoring the FE and integration tests.
    const fields = Object.values(type.fields).map(field => {
      return {
        ...field,
        type: formatOfType(field.type),
        parentType: type.name
      };
    });

    return {
      ...type,
      fields: sortByName(fields)
    };
  });

  return { data: { types: sortByName(types) } };
}

function formatOfType(ofType: ReportAccumulatorOfType | null): string {
  if (!ofType) return "";

  if (ofType.kind === TypeKind.NonNull) {
    return `${formatOfType(ofType.ofType)}!`;
  }

  if (ofType.kind === TypeKind.List) {
    return `[${formatOfType(ofType.ofType)}]`;
  }

  if (!ofType.name) {
    throw new Error(
      "report: formatOfType expects ofType to be a wrapper or named type"
    );
  }

  return ofType.name;
}

export { addOccurrence, buildInitialState, format, Report };
