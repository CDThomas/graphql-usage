import findTSGraphQLTags from "./findTSGraphQLTags";

describe("findTSGraphQLTags", () => {
  test("returns GraphQL tags given TS source code", () => {
    const ts = `
      import { graphql } from 'react-relay';
      const query = graphql\`query findGraphQLTagsQuery { hero { id } }\`
    `;

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
      {
        sourceLocationOffset: {
          column: 29,
          line: 3
        },
        template: "query findGraphQLTagsQuery { hero { id } }",
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags containing fragments", () => {
    const ts = `
    import {createFragmentContainer, graphql} from 'react-relay';
    import TodoItem from './TodoItem'

    export default createFragmentContainer(TodoItem, {
      hero: graphql\`fragment Hero_hero on Hero { id }\`,
    });
    `;

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
      {
        sourceLocationOffset: {
          column: 21,
          line: 6
        },
        template: "fragment Hero_hero on Hero { id }",
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags containing mutations", () => {
    const ts = `
    import {commitMutation, graphql} from 'react-relay';

    const mutation =
      graphql\`mutation TestMutation($input: ReviewInput!) { createReview(review: $input) { commentary } }\`;
    `;

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
      {
        sourceLocationOffset: {
          column: 15,
          line: 5
        },
        template:
          "mutation TestMutation($input: ReviewInput!) { createReview(review: $input) { commentary } }",
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags given source code with multiple tags", () => {
    const ts = `
      import { graphql } from 'react-relay';
      const queryOne = graphql\`query firstQuery { hero { id } }\`
      const queryTwo = graphql\`query secondQuery { hero { name } }\`
    `;

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
      {
        sourceLocationOffset: {
          column: 32,
          line: 3
        },
        template: "query firstQuery { hero { id } }",
        filePath: "Component.tsx"
      },
      {
        sourceLocationOffset: {
          column: 32,
          line: 4
        },
        template: "query secondQuery { hero { name } }",
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags for graphql-tag tags", () => {
    const ts = `
      import gql from "graphql-tag";
      const query = gql\`query findGraphQLTagsQuery { hero { id } }\`
    `;

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
      {
        sourceLocationOffset: {
          column: 25,
          line: 3
        },
        template: "query findGraphQLTagsQuery { hero { id } }",
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags for Apollo-style fragments", () => {
    const ts = `
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

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
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
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags for nested Apollo-style fragments", () => {
    const ts = `
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

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
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
        filePath: "Component.tsx"
      }
    ]);
  });

  test("returns GraphQL tags for tags containing both a query and fragment", () => {
    const ts = `
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

    expect(findTSGraphQLTags(ts, "Component.tsx")).toEqual([
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
        filePath: "Component.tsx"
      }
    ]);
  });
});
