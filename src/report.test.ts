import { buildSchema, isObjectType } from "graphql";

import { addOccurrence, buildInitialState, format } from "./report";

const testSchema = buildSchema(`
  type Query {
    books: [Book]
  }

  type Book {
    title: String!
    pageCount: Int
    isPublished: Boolean
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
      // kind: "Object",
      name: "Book"
    });
  });

  test("includes a property for each field of an Object type", () => {
    const initialState = buildInitialState(testSchema);
    const fields = initialState.types.Book.fields;

    expect(fields).toEqual({
      title: expect.any(Object),
      pageCount: expect.any(Object),
      isPublished: expect.any(Object)
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

describe("format", () => {
  test("formats types as a list sorted alphabetically", () => {
    const state = buildInitialState(testSchema);
    const report = format(state);

    expect(report.data.types.map(({ name }) => name)).toEqual([
      "Book",
      "Query",
      "__Directive",
      "__EnumValue",
      "__Field",
      "__InputValue",
      "__Schema",
      "__Type"
    ]);
  });

  test("formats fields as a list sorted alphabetically", () => {
    const state = buildInitialState(testSchema);
    const report = format(state);

    const bookType = report.data.types.find(type => type.name === "Book")!;
    expect(bookType.fields.map(({ name }) => name)).toEqual([
      "isPublished",
      "pageCount",
      "title"
    ]);
  });
});
