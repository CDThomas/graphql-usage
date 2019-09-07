import findJSGraphQLTags from "./findJSGraphQLTags";

describe("findJSGraphQLTags", () => {
  test("returns GraphQL tags given JS source code", () => {
    const js = `
      import { graphql } from 'react-relay';
      const query = graphql\`query findJSGraphQLTagsQuery { hero { id } }\`
    `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 29,
          line: 3
        },
        template: "query findJSGraphQLTagsQuery { hero { id } }",
        filePath: "Component.js"
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

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 21,
          line: 6
        },
        template: "fragment Hero_hero on Hero { id }",
        filePath: "Component.js"
      }
    ]);
  });

  test("returns GraphQL tags containing mutations", () => {
    const js = `
    import {commitMutation, graphql} from 'react-relay';

    const mutation =
      graphql\`mutation TestMutation($input: ReviewInput!) { createReview(review: $input) { commentary } }\`;
    `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 15,
          line: 5
        },
        template:
          "mutation TestMutation($input: ReviewInput!) { createReview(review: $input) { commentary } }",
        filePath: "Component.js"
      }
    ]);
  });

  test("returns GraphQL tags given source code with multiple tags", () => {
    const js = `
      import { graphql } from 'react-relay';
      const queryOne = graphql\`query firstQuery { hero { id } }\`
      const queryTwo = graphql\`query secondQuery { hero { name } }\`
    `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 32,
          line: 3
        },
        template: "query firstQuery { hero { id } }",
        filePath: "Component.js"
      },
      {
        sourceLocationOffset: {
          column: 32,
          line: 4
        },
        template: "query secondQuery { hero { name } }",
        filePath: "Component.js"
      }
    ]);
  });

  test("returns GraphQL tags for graphql-tag tags", () => {
    const js = `
      import gql from "graphql-tag";
      const query = gql\`query findJSGraphQLTagsQuery { hero { id } }\`
    `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 25,
          line: 3
        },
        template: "query findJSGraphQLTagsQuery { hero { id } }",
        filePath: "Component.js"
      }
    ]);
  });

  test("returns GraphQL tags for Apollo-style fragments", () => {
    const js = `
      export const COMMENT_QUERY = gql\`
        query Comment($repoName: String!) {
          entry(repoFullName: $repoName) {
            comments {
              ...CommentsPageComment
            }
          }
        }
        \${CommentsPage.fragments.comment}
      \`;
    `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 40,
          line: 2
        },
        template: `
        query Comment($repoName: String!) {
          entry(repoFullName: $repoName) {
            comments {
              ...CommentsPageComment
            }
          }
        }
        `,
        filePath: "Component.js"
      }
    ]);
  });

  test("returns GraphQL tags for nested Apollo-style fragments", () => {
    const js = `
      FeedEntry.fragments = {
        entry: gql\`
          fragment FeedEntry on Entry {
            commentCount
            repository {
              full_name
              html_url
              owner {
                avatar_url
              }
            }
            ...VoteButtons
            ...RepoInfo
          }
          \${VoteButtons.fragments.entry}
          \${RepoInfo.fragments.entry}
        \`,
      };
    `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 20,
          line: 3
        },
        template: `
          fragment FeedEntry on Entry {
            commentCount
            repository {
              full_name
              html_url
              owner {
                avatar_url
              }
            }
            ...VoteButtons
            ...RepoInfo
          }
          `,
        filePath: "Component.js"
      }
    ]);
  });

  test("returns GraphQL tags for tags containing both a query and fragment", () => {
    const js = `
      export const COMMENT_QUERY = gql\`
        query Comment($repoName: String!) {
          entry(repoFullName: $repoName) {
            comments {
              ...CommentsPageComment
            }
          }
        }

        fragment CommentsPageComment on Comment {
          id
          postedBy {
            login
            html_url
          }
          createdAt
          content
        }
      \`;
  `;

    expect(findJSGraphQLTags(js, "Component.js")).toEqual([
      {
        sourceLocationOffset: {
          column: 40,
          line: 2
        },
        template: `
        query Comment($repoName: String!) {
          entry(repoFullName: $repoName) {
            comments {
              ...CommentsPageComment
            }
          }
        }

        fragment CommentsPageComment on Comment {
          id
          postedBy {
            login
            html_url
          }
          createdAt
          content
        }
      `,
        filePath: "Component.js"
      }
    ]);
  });
});
