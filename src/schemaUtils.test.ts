import {
  getAbstractType,
  GraphQLSchema,
  isAbstract,
  getPossibleTypes
} from "./schemaUtils";

describe("getAbstractType", () => {
  test("Returns the name of the abstract type given a field and parent type", () => {
    const schema: GraphQLSchema = {
      data: {
        __schema: {
          types: [
            {
              name: "ParentType",
              kind: "OBJECT",
              description: null,
              possibleTypes: null,
              fields: [
                {
                  name: "field",
                  type: {
                    kind: "INTERFACE",
                    name: "AbstractType",
                    ofType: null
                  }
                }
              ]
            }
          ]
        }
      }
    };

    expect(getAbstractType(schema, "ParentType", "field")).toBe("AbstractType");
  });

  test("Returns null given an invalid parent type name", () => {
    const schema: GraphQLSchema = {
      data: {
        __schema: {
          types: []
        }
      }
    };

    expect(getAbstractType(schema, "InvalidType", "field")).toBe(null);
  });

  test("Returns null given an invalid field name", () => {
    const schema: GraphQLSchema = {
      data: {
        __schema: {
          types: [
            {
              name: "ParentType",
              kind: "OBJECT",
              description: null,
              possibleTypes: null,
              fields: []
            }
          ]
        }
      }
    };

    expect(getAbstractType(schema, "ParentType", "invalidField")).toBe(null);
  });
});

describe("isAbstract", () => {
  const schema: GraphQLSchema = {
    data: {
      __schema: {
        types: [
          {
            name: "UnionType",
            kind: "UNION",
            description: null,
            possibleTypes: null,
            fields: []
          },
          {
            name: "InterfaceType",
            kind: "INTERFACE",
            description: null,
            possibleTypes: null,
            fields: []
          },
          {
            name: "ObjectType",
            kind: "OBJECT",
            description: null,
            possibleTypes: null,
            fields: []
          }
        ]
      }
    }
  };

  test("returns true when the type is a union", () => {
    expect(isAbstract("UnionType", schema)).toBe(true);
  });
  test("returns true when the type is an interface", () => {
    expect(isAbstract("InterfaceType", schema)).toBe(true);
  });
  test("returns false when the type is not a union or interface", () => {
    expect(isAbstract("ObjectType", schema)).toBe(false);
  });
  test("returns false when the type is not found in the schema", () => {
    expect(isAbstract("NotAType", schema)).toBe(false);
  });
});

describe("getPossibleTypes", () => {
  const schema: GraphQLSchema = {
    data: {
      __schema: {
        types: [
          {
            name: "UnionType",
            kind: "UNION",
            description: null,
            possibleTypes: [
              {
                kind: "OBJECT",
                name: "ObjectType",
                ofType: null
              }
            ],
            fields: []
          },
          {
            name: "InterfaceType",
            kind: "INTERFACE",
            description: null,
            possibleTypes: null,
            fields: []
          },
          {
            name: "ObjectType",
            kind: "OBJECT",
            description: null,
            possibleTypes: null,
            fields: []
          }
        ]
      }
    }
  };

  test("returns a list of possible types for an abstract type", () => {
    expect(getPossibleTypes("UnionType", schema)).toEqual(["ObjectType"]);
  });
  test("returns an empty list when the type has no concrete types", () => {
    expect(getPossibleTypes("InterfaceType", schema)).toEqual([]);
  });
  test("returns an empty list when the type is not found in the schema", () => {
    expect(getPossibleTypes("NotAType", schema)).toEqual([]);
  });
  test("returns an empty list when the type is not an abstract type", () => {
    expect(getPossibleTypes("ObjectType", schema)).toEqual([]);
  });
});
