import parser = require("@babel/parser");
import traverse, { NodePath } from "@babel/traverse";
import {
  Expression,
  TaggedTemplateExpression,
  TemplateElement,
  TemplateLiteral
} from "@babel/types";
import util from "util";

// https://github.com/facebook/relay/blob/master/packages/relay-compiler/language/RelayLanguagePluginInterface.js
export interface GraphQLTag {
  /**
   * Should hold the string content of the `graphql` tagged template literal,
   * which is either an operation or fragment.
   *
   * @example
   *
   *  grapqhl`query MyQuery { … }`
   *  grapqhl`fragment MyFragment on MyType { … }`
   */
  template: string;

  /**
   * The location in the source file that the tag is placed at.
   */
  sourceLocationOffset: {
    /**
     * The line in the source file that the tag is placed on.
     *
     * Lines use 1-based indexing.
     */
    line: number;

    /**
     * The column in the source file that the tag starts on.
     *
     * Columns use 1-based indexing.
     */
    column: number;
  };
}

// https://github.com/facebook/relay/blob/master/packages/relay-compiler/language/javascript/FindGraphQLTags.js

const plugins: parser.ParserPlugin[] = [
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

const PARSER_OPTIONS: parser.ParserOptions = {
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  sourceType: "module",
  plugins,
  strictMode: false
};

function find(text: string): Array<GraphQLTag> {
  const result: Array<GraphQLTag> = [];
  const ast = parser.parse(text, PARSER_OPTIONS);

  const visitors = {
    TaggedTemplateExpression: ({
      node
    }: NodePath<TaggedTemplateExpression>) => {
      if (isGraphQLTag(node.tag)) {
        result.push({
          template: node.quasi.quasis[0].value.raw,
          sourceLocationOffset: getSourceLocationOffset(node.quasi)
        });
      }
    }
  };

  traverse(ast, visitors);
  return result;
}

function isGraphQLTag(tag: Expression): boolean {
  return (
    tag.type === "Identifier" && (tag.name === "graphql" || tag.name === "gql")
  );
}

function getTemplateNode(quasi: TemplateLiteral): TemplateElement {
  const quasis = quasi.quasis;
  invariant(
    quasis && quasis.length === 1,
    "findGraphQLTags: Substitutions are not allowed in graphql tags."
  );
  return quasis[0];
}

function getSourceLocationOffset(
  quasi: TemplateLiteral
): { line: number; column: number } {
  const loc = getTemplateNode(quasi).loc;

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

function invariant(condition: boolean, msg: string, ...args: any[]) {
  if (!condition) {
    throw new Error(util.format(msg, ...args));
  }
}

export default find;
