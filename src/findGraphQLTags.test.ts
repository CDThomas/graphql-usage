import findGraphQLTags from "./findGraphQLTags";

describe("findGraphQLTags", () => {
  test("returns GraphQL tags given JS source code", () => {
    const js = `
      import { graphql } from 'react-relay';
      const query = graphql\`query findGraphQLTagsQuery { hero { id } }\`
    `;

    expect(findGraphQLTags(js)).toEqual([
      {
        sourceLocationOffset: {
          column: 29,
          line: 3
        },
        template: "query findGraphQLTagsQuery { hero { id } }"
      }
    ]);
  });

  test("returns GraphQL tags containing fragments", () => {
    const js = `
    import {createFragmentContainer, graphql} from 'react-relay';
    import TodoItem from './TodoItem'

    export default createFragmentContainer(TodoItem, {
      hero: graphql\`fragment Hero_hero on Hero { id }\`,
    });
    `;

    expect(findGraphQLTags(js)).toEqual([
      {
        sourceLocationOffset: {
          column: 21,
          line: 6
        },
        template: "fragment Hero_hero on Hero { id }"
      }
    ]);
  });

  test("returns GraphQL tags containing mutations", () => {
    const js = `
    import {commitMutation, graphql} from 'react-relay';

    const mutation =
      graphql\`mutation TestMutation($input: ReviewInput!) { createReview(review: $input) { commentary } }\`;
    `;

    expect(findGraphQLTags(js)).toEqual([
      {
        sourceLocationOffset: {
          column: 15,
          line: 5
        },
        template:
          "mutation TestMutation($input: ReviewInput!) { createReview(review: $input) { commentary } }"
      }
    ]);
  });

  test("returns GraphQL tags given source code with multiple tags", () => {
    const js = `
      import { graphql } from 'react-relay';
      const queryOne = graphql\`query firstQuery { hero { id } }\`
      const queryTwo = graphql\`query secondQuery { hero { name } }\`
    `;

    expect(findGraphQLTags(js)).toEqual([
      {
        sourceLocationOffset: {
          column: 32,
          line: 3
        },
        template: "query firstQuery { hero { id } }"
      },
      {
        sourceLocationOffset: {
          column: 32,
          line: 4
        },
        template: "query secondQuery { hero { name } }"
      }
    ]);
  });

  test("returns GraphQL tags for graphql-tag tags", () => {
    const js = `
      import gql from "graphql-tag";
      const query = gql\`query findGraphQLTagsQuery { hero { id } }\`
    `;

    expect(findGraphQLTags(js)).toEqual([
      {
        sourceLocationOffset: {
          column: 25,
          line: 3
        },
        template: "query findGraphQLTagsQuery { hero { id } }"
      }
    ]);
  });
});
