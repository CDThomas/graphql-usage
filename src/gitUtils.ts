import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

async function getGitHubBaseURL(sourceDir: string): Promise<string> {
  // TODO: improve error handling
  // TODO: check it branch exists in remote and default link to master if not

  const branchOutput = await promisify(exec)(
    "git rev-parse --abbrev-ref HEAD",
    {
      cwd: path.resolve(sourceDir)
    }
  );
  const branchName = branchOutput.stdout.toString().trim();

  if (!branchName) {
    throw new Error("Error getting current branch name");
  }

  const remoteURLOutput = await promisify(exec)(
    "git config --get remote.origin.url",
    { cwd: path.resolve(sourceDir) }
  );
  const repoBasePathRegEx = /^git@github\.com:(.*)\.git$/;
  const matches = remoteURLOutput.stdout
    .toString()
    .trim()
    .match(repoBasePathRegEx);

  if (!matches || !matches[1]) {
    throw new Error("Error getting remote URL");
  }

  const repoBasePath = matches[1];

  return `https://github.com/${repoBasePath}/tree/${branchName}`;
}

async function getGitProjectRoot(sourceDir: string): Promise<string> {
  const projectRootOutput = await promisify(exec)(
    "git rev-parse --show-toplevel",
    { cwd: path.resolve(sourceDir) }
  );

  const projectRoot = projectRootOutput.stdout.toString().trim();

  if (!projectRoot) {
    throw new Error("Error getting Git project root");
  }

  return projectRoot;
}

export { getGitHubBaseURL, getGitProjectRoot };
