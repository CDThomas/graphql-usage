import NodeGit from "nodegit";

async function getGitHubBaseURL(gitDir: string): Promise<string> {
  const { refName, remoteURL } = await NodeGit.Repository.open(gitDir).then(
    async repo => {
      const refName = await repo.getCurrentBranch().then(ref => {
        return ref.name();
      });

      const remoteURL = await repo.getRemote("origin").then(remote => {
        return remote.url();
      });

      return { refName, remoteURL };
    }
  );

  const branchNameRegEx = /^refs\/heads\/(.*)/;
  const repoBasePathRegEx = /^git@github\.com:(.*)\.git$/;

  const branchName = refName.match(branchNameRegEx)[1];
  const repoBasePath = remoteURL.match(repoBasePathRegEx)[1];
  return `https://github.com/${repoBasePath}/tree/${branchName}`;
}

export default getGitHubBaseURL;
