import findGraphQLTags from "./findGraphQLTags";

test("returns content of GraphQL tags given JS source code", () => {
  const js = `
    import { graphql } from 'react-relay';
    const query = graphql\`query findGraphQLTagsQuery { hero { id } }\`
  `;

  expect(findGraphQLTags(js)).toEqual([
    {
      keyName: null,
      sourceLocationOffset: {
        column: 27,
        line: 3
      },
      template: "query findGraphQLTagsQuery { hero { id } }"
    }
  ]);
});

// TODO: test fragments
// TODO: test mutations
// TODO: test multiple tags in one file
