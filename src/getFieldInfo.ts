import {
  getLocation,
  parse,
  visit,
  visitWithTypeInfo,
  Source,
  TypeInfo
} from "graphql";
import { GraphQLTag } from "./findGraphQLTags";

export interface FieldInfo {
  name: string;
  link: string;
  parentType: string;
  type: string;
}

function getFeildInfo(
  { template, sourceLocationOffset }: GraphQLTag,
  typeInfo: TypeInfo,
  githubBaseURL: string
) {
  const fields: FieldInfo[] = [];
  const ast = parse(template);

  visit(
    ast,
    visitWithTypeInfo(typeInfo, {
      Field(graphqlNode) {
        const parentType = typeInfo.getParentType();
        const nodeType = typeInfo.getType();
        const nodeName = graphqlNode.name.value;

        if (!parentType) {
          throw new Error(`No parent type for ${nodeName}`);
        }

        if (!nodeType) {
          throw new Error(`No type for ${nodeName}`);
        }

        if (!graphqlNode.loc) {
          throw new Error(`No location for ${nodeName}`);
        }

        const loc = graphqlNode.loc;
        const source = new Source(template);
        const templateStart = getLocation(source, loc.start);
        const line = sourceLocationOffset.line + templateStart.line - 1;

        fields.push({
          name: nodeName,
          type: nodeType.toString(),
          parentType: parentType.toString(),
          link: `${githubBaseURL}#L${line}`
        });
      }
    })
  );

  return fields;
}

export default getFeildInfo;
