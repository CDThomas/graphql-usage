import {
  FieldNode,
  FragmentDefinitionNode,
  getLocation,
  OperationDefinitionNode,
  parse,
  Source,
  TypeInfo,
  visit,
  visitWithTypeInfo
} from "graphql";

import { GraphQLTag } from "./types";

export interface FieldInfo {
  name: string;
  line: number;
  parentType: string;
  type: string;
  rootNodeName: string;
  filePath: string;
}

function findFields(
  graphQLTag: GraphQLTag,
  typeInfo: TypeInfo,
  cb: (fieldInfo: FieldInfo) => void
) {
  const ast = parse(graphQLTag.template);

  visit(
    ast,
    visitWithTypeInfo(typeInfo, {
      OperationDefinition(node) {
        visitFields(node, graphQLTag, typeInfo, cb);
      },
      FragmentDefinition(node) {
        visitFields(node, graphQLTag, typeInfo, cb);
      }
    })
  );
}

function visitFields(
  node: OperationDefinitionNode | FragmentDefinitionNode,
  graphQLTag: GraphQLTag,
  typeInfo: TypeInfo,
  cb: (fieldInfo: FieldInfo) => void
) {
  if (!node.name) {
    throw new Error(
      "visitFields expects OperationDefinitions and FragmentDefinitions to be named"
    );
  }

  const { filePath, sourceLocationOffset, template } = graphQLTag;
  const operationOrFragmentName = node.name.value;

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
          throw new Error(
            `visitFields expects fields to have a parent type. No parent type for ${nodeName}`
          );
        }

        if (!nodeType) {
          throw new Error(
            `visitFields expects fields to have a type. No type for ${nodeName}`
          );
        }

        if (!graphqlNode.loc) {
          throw new Error(
            `visitFields expects fields to have a location. No location for ${nodeName}`
          );
        }

        const loc = graphqlNode.loc;
        const source = new Source(template);
        const templateStart = getLocation(source, loc.start);
        const line = sourceLocationOffset.line + templateStart.line - 1;

        cb({
          name: nodeName,
          type: nodeType.toString(),
          parentType: parentType.toString(),
          rootNodeName: operationOrFragmentName,
          filePath,
          line
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

export default findFields;
