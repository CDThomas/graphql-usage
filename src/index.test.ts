import { test } from "@oclif/test";
import fs from "fs";
import path from "path";
import { FieldInfo } from "./getFieldInfo";
import { omit } from "ramda";

import cmd = require("../src");

// https://github.com/apollographql/apollo-tooling/blob/e8d432654ea840b9d59bf1f22a9bc37cf50cf800/packages/apollo/src/commands/client/__tests__/generate.test.ts

const deleteFolderRecursive = (path: string) => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });

    fs.rmdirSync(path);
  }
};

const makeNestedDir = (dir: string) => {
  if (fs.existsSync(dir)) return;

  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code == "ENOENT") {
      makeNestedDir(path.dirname(dir)); //create parent dir
      makeNestedDir(dir); //create dir
    }
  }
};

const setupFS = (files: Record<string, string>) => {
  let dir: string | undefined;
  return {
    async run(ctx: any, ...rest: any) {
      // make a random temp dir & chdir into it
      dir = fs.mkdtempSync("__tmp__");
      process.chdir(dir);
      // fill the dir with `files`
      Object.keys(files).forEach(key => {
        if (key.includes("/")) makeNestedDir(path.dirname(key));
        fs.writeFileSync(key, files[key]);
      });
    },
    finally(ctx: any) {
      process.chdir("../");
      deleteFolderRecursive(dir as string);
    }
  };
};

// helper function to resolve files from the actual filesystem
const resolveFiles = (opts: { [testPath: string]: string }) => {
  let files: { [testPath: string]: string } = {};
  Object.keys(opts).map(key => {
    files[key] = fs.readFileSync(path.resolve(__dirname, opts[key]), {
      encoding: "utf-8"
    });
  });

  return files;
};

describe("graphql-usage", () => {
  test
    .register("fs", setupFS)
    .fs(
      resolveFiles({
        "./schema.json": "../__fixtures__/schema.json",
        "./testSrc/foo.js": "../__fixtures__/testSrc/foo.js",
        "./testSrc/nestedDir/bar.js": "../__fixtures__/testSrc/foo.js"
      })
    )
    .do(() =>
      cmd.run([
        "./testSrc",
        "--schema",
        "./schema.json",
        "--gitDir",
        "../",
        "--json"
      ])
    )
    .it("writes a file given a .json GraphQL schema", () => {
      const output = JSON.parse(fs.readFileSync("./report.json", "utf-8"));

      assertOutputMatchesSnapshot(output);
    });

  test
    .register("fs", setupFS)
    .fs(
      resolveFiles({
        "./schema.graphql": "../__fixtures__/schema.graphql",
        "./testSrc/foo.js": "../__fixtures__/testSrc/foo.js",
        "./testSrc/nestedDir/bar.js": "../__fixtures__/testSrc/foo.js"
      })
    )
    .do(() =>
      cmd.run([
        "./testSrc",
        "--schema",
        "./schema.graphql",
        "--gitDir",
        "../",
        "--json"
      ])
    )
    .it("writes a file given a .graphql GraphQL schema", () => {
      const output = JSON.parse(fs.readFileSync("./report.json", "utf-8"));

      assertOutputMatchesSnapshot(output);
    });
});

function assertOutputMatchesSnapshot(output: {
  data: { types: Array<Object> };
}) {
  output.data.types.map((type: any) => {
    expect(omit(["fields"], type)).toMatchSnapshot();

    type.fields.map((field: any) => {
      expect(omit(["occurrences"], field)).toMatchSnapshot();

      field.occurrences.map((occurence: any) => {
        expect(occurence).toMatchSnapshot({
          filename: expect.stringMatching(
            /^https:\/\/github.com\/CDThomas\/graphql-usage\/tree\/.*\.js#L\d$/
          )
        });
      });
    });
  });
}
