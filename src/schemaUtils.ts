import flatten from "./flatten";

interface GraphQLSchema {
  data: {
    __schema: {
      types: GraphQLType[];
    };
  };
}

interface GraphQLType {
  description: string | null;
  fields: GraphQLField[] | null;
  kind: GraphQLTypeKind;
  name: string;
  possibleTypes: GraphQLAbbreviatedType[] | null;
}

interface GraphQLField {
  name: string;
  type: GraphQLAbbreviatedType;
}

type GraphQLAbbreviatedType = UnnamedType | NamedType;

interface UnnamedType {
  kind: "LIST" | "NON_NULL";
  name: null;
  ofType: GraphQLAbbreviatedType;
}

interface NamedType {
  kind: "OBJECT" | "INTERFACE" | "UNION" | "SCALAR" | "ENUM" | "INPUT_OBJECT";
  name: string;
  ofType: null;
}

type GraphQLTypeKind =
  | "OBJECT"
  | "INTERFACE"
  | "UNION"
  | "NON_NULL"
  | "SCALAR"
  | "ENUM"
  | "LIST"
  | "INPUT_OBJECT";

// This is necessary since the relay compiler doesn't always keep track of
// abstract types.
function getAbstractType(
  schema: GraphQLSchema,
  parentTypeName: string,
  fieldName: string
): string | null {
  const parentType = schema.data.__schema.types.find(
    type => type.name === parentTypeName
  );

  if (!parentType || !parentType.fields) return null;

  // Get type for field. This doesn't have to be an abstract type, but that's
  // the only type that the Relay compiler doesn't always give enough info for.
  const field = parentType.fields.find(field => field.name === fieldName);

  if (!field) return null;

  return field.type.name;
}

function getFieldNames(schema: GraphQLSchema): string[] {
  const fieldNames = schema.data.__schema.types.map(type => {
    if (!type.fields) return [];

    return type.fields.map(field => {
      return `${type.name}.${field.name}`;
    });
  });

  return flatten(fieldNames);
}

function isAbstract(typeName: string, schema: GraphQLSchema): boolean {
  const type = schema.data.__schema.types.find(type => type.name === typeName);

  return !!type && isUnionOrInterface(type.kind);
}

function isUnionOrInterface(kind: GraphQLTypeKind): boolean {
  return kind === "UNION" || kind === "INTERFACE";
}

function getPossibleTypes(
  abstractTypeName: string,
  schema: GraphQLSchema
): string[] {
  const type = schema.data.__schema.types.find(
    type => type.name === abstractTypeName
  );

  if (!type || !type.possibleTypes) return [];

  return type.possibleTypes.map(possibleType => {
    if (!possibleType.name)
      throw new Error(`Couldn't find concrete type for ${type.name}`);

    return possibleType.name;
  });
}

function getTypes(schema: GraphQLSchema): GraphQLType[] {
  return schema.data.__schema.types;
}

export {
  getAbstractType,
  getFieldNames,
  isAbstract,
  getPossibleTypes,
  getTypes,
  GraphQLField,
  GraphQLType,
  GraphQLSchema,
  GraphQLAbbreviatedType
};
