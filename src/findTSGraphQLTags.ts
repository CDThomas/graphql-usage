import {
  createSourceFile,
  forEachChild,
  Identifier,
  isNoSubstitutionTemplateLiteral,
  isTemplateExpression,
  Node,
  NoSubstitutionTemplateLiteral,
  ScriptTarget,
  SyntaxKind,
  TaggedTemplateExpression,
  TemplateHead
} from "typescript";

import { GraphQLTag } from "./types";

function visit(node: Node, addGraphQLTag: (tag: GraphQLTag) => void): void {
  function visitNode(node: Node) {
    switch (node.kind) {
      case SyntaxKind.TaggedTemplateExpression: {
        const taggedTemplate = node as TaggedTemplateExpression;
        if (isGraphQLTag(taggedTemplate.tag)) {
          addGraphQLTag({
            template: getGraphQLText(taggedTemplate),
            sourceLocationOffset: getSourceLocationOffset(taggedTemplate)
          });
        }
      }
    }
    forEachChild(node, visitNode);
  }

  visitNode(node);
}

function isGraphQLTag(tag: Node): boolean {
  return (
    tag.kind === SyntaxKind.Identifier &&
    ((tag as Identifier).text === "graphql" ||
      (tag as Identifier).text === "gql")
  );
}

function getTemplateNode(
  quasi: TaggedTemplateExpression
): NoSubstitutionTemplateLiteral | TemplateHead {
  if (isNoSubstitutionTemplateLiteral(quasi.template)) {
    return quasi.template as NoSubstitutionTemplateLiteral;
  }

  if (isTemplateExpression(quasi.template)) {
    return quasi.template.head;
  }

  throw new Error(
    "findTSGraphQLTags: getTemplateNode expects a TaggedTemplateExpression"
  );
}

function getGraphQLText(quasi: TaggedTemplateExpression) {
  return getTemplateNode(quasi).text;
}

function getSourceLocationOffset(quasi: TaggedTemplateExpression) {
  const pos = quasi.template.pos;
  const loc = quasi.getSourceFile().getLineAndCharacterOfPosition(pos);
  return {
    line: loc.line + 1,
    column: loc.character + 2 // TODO: This seems questionable...
  };
}

function find(text: string, filePath: string) {
  const result: GraphQLTag[] = [];
  const ast = createSourceFile(filePath, text, ScriptTarget.Latest, true);
  visit(ast, tag => result.push(tag));
  return result;
}

export default find;
