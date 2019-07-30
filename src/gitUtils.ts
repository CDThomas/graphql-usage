import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

async function getGitHubBaseURL(sourceDir: string): Promise<string> {
  const branchName = await execCommand(
    "git rev-parse --abbrev-ref HEAD",
    sourceDir
  );

  if (!branchName) {
    throw new Error("Error getting current Git branch name");
  }

  const remoteURL = await execCommand(
    "git config --get remote.origin.url",
    sourceDir
  );
  const repoBasePathRegEx = /^git@github\.com:(.*)\.git$/;
  const matches = remoteURL.match(repoBasePathRegEx);

  if (!matches || !matches[1]) {
    throw new Error(
      "Error getting remote URL. GraphQL Usage requires SOURCE_DIR to be in a Git repository " +
        "that has been pushed to GitHub."
    );
  }

  const repoBasePath = matches[1];

  return `https://github.com/${repoBasePath}/tree/${branchName}`;
}

async function getGitProjectRoot(sourceDir: string): Promise<string> {
  const projectRoot = execCommand("git rev-parse --show-toplevel", sourceDir);

  if (!projectRoot) {
    throw new Error("Error getting Git project root");
  }

  return projectRoot;
}

function execCommand(command: string, sourceDir: string): Promise<string> {
  const message =
    "GraphQL Usage requires git to be available in your PATH " +
    "and for SOURCE_DIR to be in a Git repository that has been pushed to GitHub.";

  return promisify(exec)(command, { cwd: path.resolve(sourceDir) })
    .then(({ stdout }) => {
      return stdout.trim();
    })
    .catch(error => {
      if (error.code === 127) {
        throw new Error(`Command not found: git. ${message}`);
      }

      if (error.code === 128) {
        throw new Error(
          `SOURCE_DIRECTORY is not in a Git repository or Git has encountered a fatal error. ${message}`
        );
      }

      throw error;
    });
}

export { getGitHubBaseURL, getGitProjectRoot };
