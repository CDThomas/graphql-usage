import { graphql } from "react-relay";

const query = graphql`
  query findGraphQLTagsQuery {
    hero {
      id
    }
  }
`;
