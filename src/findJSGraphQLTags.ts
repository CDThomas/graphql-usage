import { parse, ParserOptions, ParserPlugin } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import {
  Expression,
  TaggedTemplateExpression,
  TemplateLiteral
} from "@babel/types";

import { GraphQLTag } from "./types";

// https://github.com/facebook/relay/blob/master/packages/relay-compiler/language/javascript/FindGraphQLTags.js

const plugins: ParserPlugin[] = [
  "asyncGenerators",
  "classProperties",
  ["decorators", { decoratorsBeforeExport: true }],
  "doExpressions",
  "dynamicImport",
  "flow",
  "functionBind",
  "functionSent",
  "jsx",
  "nullishCoalescingOperator",
  "objectRestSpread",
  "optionalChaining",
  "optionalCatchBinding"
];

const PARSER_OPTIONS: ParserOptions = {
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  sourceType: "module",
  plugins,
  strictMode: false
};

function findGraphQLTags(code: string, filePath: string): GraphQLTag[] {
  const results: GraphQLTag[] = [];
  const ast = parse(code, PARSER_OPTIONS);

  const visitors = {
    TaggedTemplateExpression: ({
      node
    }: NodePath<TaggedTemplateExpression>) => {
      if (isGraphQLTag(node.tag)) {
        results.push({
          template: node.quasi.quasis[0].value.raw,
          sourceLocationOffset: getSourceLocationOffset(node.quasi),
          filePath
        });
      }
    }
  };

  traverse(ast, visitors);
  return results;
}

function isGraphQLTag(tag: Expression): boolean {
  return (
    tag.type === "Identifier" && (tag.name === "graphql" || tag.name === "gql")
  );
}

function getSourceLocationOffset(
  quasi: TemplateLiteral
): { line: number; column: number } {
  const loc = quasi.quasis[0].loc;

  if (!loc) {
    throw new Error(
      "findGraphQLTags: Expects template element to have a location"
    );
  }

  const start = loc.start;
  return {
    line: start.line,
    column: start.column + 1 // babylon is 0-indexed, graphql expects 1-indexed
  };
}

export default findGraphQLTags;
