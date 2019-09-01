import {
  ASTNode,
  FieldNode,
  getLocation,
  parse,
  Source,
  TypeInfo,
  visit,
  visitWithTypeInfo
} from "graphql";

import { GraphQLTag } from "./types";

export interface FieldInfo {
  name: string;
  link: string;
  parentType: string;
  type: string;
  rootNodeName: string;
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
      OperationDefinition(graphqlNode) {
        if (graphqlNode.name) {
          visitFields(
            graphqlNode,
            graphqlNode.name.value,
            typeInfo,
            fields,
            template,
            sourceLocationOffset,
            githubBaseURL
          );
        } else {
          throw new Error(`No name for OperationDefinition`);
        }
      },
      FragmentDefinition(graphqlNode) {
        if (graphqlNode.name) {
          visitFields(
            graphqlNode,
            graphqlNode.name.value,
            typeInfo,
            fields,
            template,
            sourceLocationOffset,
            githubBaseURL
          );
        } else {
          throw new Error(`No name for FragmentDefinition`);
        }
      }
    })
  );

  return fields;
}

function visitFields(
  node: ASTNode,
  operationOrFragmentName: string,
  typeInfo: TypeInfo,
  fields: FieldInfo[],
  template: string,
  sourceLocationOffset: { line: number; column: number },
  githubBaseURL: string
) {
  visit(
    node,
    visitWithTypeInfo(typeInfo, {
      Field(graphqlNode) {
        // Discard client only fields, but don't throw an error
        if (isClientOnlyField(graphqlNode)) return;

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
          link: `${githubBaseURL}#L${line}`,
          rootNodeName: operationOrFragmentName
        });
      }
    })
  );
}

function isClientOnlyField(field: FieldNode): boolean {
  if (!field.directives) return false;

  const clientOnlyDirective = field.directives.find(directive => {
    return directive.name.value === "client";
  });

  return !!clientOnlyDirective;
}

export default getFeildInfo;
