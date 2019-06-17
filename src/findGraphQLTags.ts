import parser = require("@babel/parser");
import util from "util";

// TODO: Add better types.
//       Reference for types:
//       https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/babel-types/index.d.ts

// https://github.com/facebook/relay/blob/master/packages/relay-compiler/language/RelayLanguagePluginInterface.js
interface GraphQLTag {
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
  // "exportExtensions", // This seems to be an invalid opt in the latest version of Babel
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
    CallExpression: (node: any) => {
      const callee = node.callee;
      if (
        !(
          (callee.type === "Identifier" &&
            CREATE_CONTAINER_FUNCTIONS[callee.name]) ||
          (callee.kind === "MemberExpression" &&
            callee.object.type === "Identifier" &&
            callee.object.value === "Relay" &&
            callee.property.type === "Identifier" &&
            CREATE_CONTAINER_FUNCTIONS[callee.property.name])
        )
      ) {
        traverse(node, visitors);
        return;
      }
      const fragments = node.arguments[1];
      if (fragments.type === "ObjectExpression") {
        fragments.properties.forEach((property: any) => {
          invariant(
            property.type === "ObjectProperty" &&
              property.key.type === "Identifier" &&
              property.value.type === "TaggedTemplateExpression",
            "FindGraphQLTags: `%s` expects fragment definitions to be " +
              "`key: graphql`.",
            node.callee.name
          );
          invariant(
            isGraphQLTag(property.value.tag),
            "FindGraphQLTags: `%s` expects fragment definitions to be tagged " +
              "with `graphql`, got `%s`.",
            node.callee.name,
            getSourceTextForLocation(text, property.value.tag.loc)
          );
          result.push({
            template: getGraphQLText(property.value.quasi),
            sourceLocationOffset: getSourceLocationOffset(property.value.quasi)
          });
        });
      } else {
        invariant(
          fragments && fragments.type === "TaggedTemplateExpression",
          "FindGraphQLTags: `%s` expects a second argument of fragment " +
            "definitions.",
          node.callee.name
        );
        invariant(
          isGraphQLTag(fragments.tag),
          "FindGraphQLTags: `%s` expects fragment definitions to be tagged " +
            "with `graphql`, got `%s`.",
          node.callee.name,
          getSourceTextForLocation(text, fragments.tag.loc)
        );
        result.push({
          template: getGraphQLText(fragments.quasi),
          sourceLocationOffset: getSourceLocationOffset(fragments.quasi)
        });
      }

      // Visit remaining arguments
      for (let ii = 2; ii < node.arguments.length; ii++) {
        visit(node.arguments[ii], visitors);
      }
    },
    TaggedTemplateExpression: (node: any) => {
      if (isGraphQLTag(node.tag)) {
        result.push({
          template: node.quasi.quasis[0].value.raw,
          sourceLocationOffset: getSourceLocationOffset(node.quasi)
        });
      }
    }
  };
  visit(ast, visitors);
  return result;
}

const CREATE_CONTAINER_FUNCTIONS = Object.create(null, {
  createFragmentContainer: { value: true },
  createPaginationContainer: { value: true },
  createRefetchContainer: { value: true }
});

const IGNORED_KEYS: { [key: string]: boolean } = {
  comments: true,
  end: true,
  leadingComments: true,
  loc: true,
  name: true,
  start: true,
  trailingComments: true,
  type: true
};

function isGraphQLTag(tag: any): boolean {
  return tag.type === "Identifier" && tag.name === "graphql";
}

function getTemplateNode(quasi: any) {
  const quasis = quasi.quasis;
  invariant(
    quasis && quasis.length === 1,
    "FindGraphQLTags: Substitutions are not allowed in graphql tags."
  );
  return quasis[0];
}

function getGraphQLText(quasi: any): string {
  return getTemplateNode(quasi).value.raw;
}

function getSourceLocationOffset(quasi: any) {
  const loc = getTemplateNode(quasi).loc.start;
  return {
    line: loc.line,
    column: loc.column + 1 // babylon is 0-indexed, graphql expects 1-indexed
  };
}

function getSourceTextForLocation(text: string, loc: any) {
  if (loc == null) {
    return "(source unavailable)";
  }
  const lines = text.split("\n").slice(loc.start.line - 1, loc.end.line);
  lines[0] = lines[0].slice(loc.start.column);
  lines[lines.length - 1] = lines[lines.length - 1].slice(0, loc.end.column);
  return lines.join("\n");
}

function invariant(condition: boolean, msg: string, ...args: any) {
  if (!condition) {
    throw new Error(util.format(msg, ...args));
  }
}

function visit(node: any, visitors: any) {
  const fn = visitors[node.type];
  if (fn != null) {
    fn(node);
    return;
  }
  traverse(node, visitors);
}

function traverse(node: any, visitors: any) {
  for (const key in node) {
    if (IGNORED_KEYS[key]) {
      continue;
    }
    const prop = node[key];
    if (prop && typeof prop === "object" && typeof prop.type === "string") {
      visit(prop, visitors);
    } else if (Array.isArray(prop)) {
      prop.forEach(item => {
        if (item && typeof item === "object" && typeof item.type === "string") {
          visit(item, visitors);
        }
      });
    }
  }
}

export default find;
