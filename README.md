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

# Support and Requirements

- Source files using JS, FLow, or TypeScript
- Projects using Relay, Apollo, or graphql-tag
- Source files must be in a Git project and the branch that's being analyzed must be pushed to GitHub

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
- `--exclude`: Directories to ignore under src
- `--quiet`: No output to stdout

## Example:

```bash
$ graphql-usage ./schema.graphql ./src/
```
