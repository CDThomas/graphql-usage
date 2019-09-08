import { buildSchema, isObjectType } from "graphql";

import { addOccurrence, buildInitialState } from "./report";

// const testSchema = buildSchema(
//   fs.readFileSync(path.resolve(__dirname, "../__fixtures__/schema.graphql"), {
//     encoding: "utf-8"
//   })
// );

const testSchema = buildSchema(`
  type Query {
    books: [Book]
  }

  type Book {
    title: String!
  }
`);

describe("buildInitialState", () => {
  test("includes a property for each named type in the schema", () => {
    // TODO: non-object types
    const expectedTypes = testSchema.toConfig().types.filter(isObjectType);

    const { types } = buildInitialState(testSchema);

    expectedTypes.forEach(type => {
      expect(types).toHaveProperty(type.name);
    });
  });

  test("builds the correct properties for Object types", () => {
    const { types } = buildInitialState(testSchema);

    expect(types.Book).toEqual({
      fields: expect.any(Object),
      kind: "Object",
      name: "Book"
    });
  });

  test("includes a property for each field of an Object type", () => {
    const initialState = buildInitialState(testSchema);
    const fields = initialState.types.Book.fields;

    expect(fields).toEqual({
      title: expect.any(Object)
    });
  });

  test("includes the correct properties for individual object fields", () => {
    const initialState = buildInitialState(testSchema);
    const field = initialState.types.Book.fields.title;

    expect(field).toEqual({
      name: "title",
      occurrences: [],
      type: {
        kind: "NonNull",
        name: null,
        ofType: {
          kind: "Scalar",
          name: "String",
          ofType: null
        }
      }
    });
  });
});

describe("addOccurrence", () => {
  test("adds an occurrence to the given field", () => {
    const state = buildInitialState(testSchema);

    addOccurrence(state, "Book", "title", {
      filename: "src/Component.js",
      rootNodeName: "ComponentQuery"
    });

    expect(state.types.Book.fields.title.occurrences).toEqual([
      {
        filename: "src/Component.js",
        rootNodeName: "ComponentQuery"
      }
    ]);
  });
});
