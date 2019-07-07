import {
  getLocation,
  parse,
  visit,
  visitWithTypeInfo,
  Location as GraphQLLocation,
  Source,
  TypeInfo
} from "graphql";
import { GraphQLTag } from "./findGraphQLTags";

interface Location {
  line: number;
  column: number;
}

export interface FieldInfo {
  name: string;
  location: Location;
}

function getFeildInfo(
  { template, sourceLocationOffset }: GraphQLTag,
  typeInfo: TypeInfo
) {
  const fields: FieldInfo[] = [];
  const { line, column } = sourceLocationOffset;
  const ast = parse(template);

  visit(
    ast,
    visitWithTypeInfo(typeInfo, {
      Field(graphqlNode) {
        const parentType = typeInfo.getParentType();
        const nodeName = graphqlNode.name.value;

        const loc: GraphQLLocation = graphqlNode.loc as GraphQLLocation;
        const source = new Source(template);
        const templateStart = getLocation(source, loc.start);

        if (!parentType) {
          throw new Error(`No parent type found for ${nodeName}`);
        }

        fields.push({
          name: `${parentType.name}.${nodeName}`,
          location: {
            line: line + templateStart.line - 1,
            column:
              templateStart.column === 1
                ? column + templateStart.column
                : templateStart.column
          }
        });
      }
    })
  );

  return fields;
}

export default getFeildInfo;
