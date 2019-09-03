# graphql-usage

[![Version](https://img.shields.io/npm/v/graphql-usage.svg)](https://npmjs.org/package/graphql-usage)
[![CircleCI](https://circleci.com/gh/CDThomas/graphql-usage/tree/master.svg?style=shield)](https://circleci.com/gh/CDThomas/graphql-usage/tree/master)
[![License](https://img.shields.io/npm/l/graphql-usage.svg)](https://github.com/CDThomas/graphql-usage/blob/master/package.json)

🛠 A tool for refactoring GraphQL APIs.

![](/demo.gif)

# Installation

NPM:

```bash
$ npm install --save-dev graphql-usage
```

Yarn:

```bash
$ yarn add -D graphql-usage
```

# Usage

```bash
$ graphql-usage SCHEMA SOURCEDIR
```

## Arguments:

- SCHEMA: Path to the Graphql schema to report usage info for. Can be either a `.json` or `.graphql` file.
- SOURCEDIR: Path to the source directory to analyze.

## Options:

- `-h`, `--help`: show CLI help
- `-v`, `--version`: show CLI version

## Example:

```bash
$ graphql-usage ./schema.graphql ./src/
```

# TODO:

- [ ] Show usage info for input types
- [ ] Improve usage info for enum types
- [ ] Improve usage info for abstract types
- [ ] Improve usage info for object types (e.g. whether the type is used rather than individual fields)
- [ ] Better support for client-only fields and client-side schemas
- [ ] Windows support
