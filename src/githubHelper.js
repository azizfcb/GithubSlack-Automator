const originalFetch = require('node-fetch');
const fetch = require('fetch-retry')(originalFetch);

const GithubHelper = {
  // eslint-disable-next-line max-len
  async createPrivateRepositoryAndAddCollaborator(githubUsername, githubOrganization, githubTemplate, githubAPiToken) {
    await this.checkTemplateRepositoryExist(githubTemplate, githubOrganization, githubAPiToken);
    await this.checkGithubAccount(githubUsername, githubAPiToken);
    await this.createRepository(githubUsername, githubOrganization, githubTemplate, githubAPiToken);
    await this.addCollaboratorToRepo(githubUsername, githubOrganization, githubAPiToken);
  },
  // async function to check if there is github account using async/await
  async checkGithubAccount(githubUsername, githubAPiToken) {
    console.log('Initialization: Checking if github account ['+githubUsername+'] exists');
    const url = `https://api.github.com/users/${githubUsername}`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `token ${githubAPiToken}`,
      },
    };
    try {
      const response = await fetch(url, options);
      const json = await response.json();
      if(json.message === 'Not Found' || json.login !== githubUsername) {
        console.log(json)
        throw new Error('[KO] Either Github account ['+ githubUsername +'] does not exist!');
      }
      console.log('[OK] Github account ['+githubUsername+'] exists');
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  // async function to check if the template repository exist
  async checkTemplateRepositoryExist(githubTemplate, githubOrganization, githubAPiToken) {
    console.log(`Initialization: Checking if template repository [${githubTemplate}] exists on organization [${githubOrganization}]`);
    const url = `https://api.github.com/repos/${githubOrganization}/${githubTemplate}`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `token ${githubAPiToken}`,
      },
    };
    try {
      const response = await fetch(url, options);
      const json = await response.json();
      if (json.is_template === undefined || !json.is_template) {
        throw new Error(`[KO] Either Template repository [${githubTemplate}] doesn't exist on organization [${githubOrganization}] or is not template is not defined as a template`);
      }
      console.log(`[OK] Template repository [${githubTemplate}] exists on organization [${githubOrganization}]`);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  // async function to create github repository in organisation based on template
  // use fetch without callback
  async createRepository(githubUsername, githubOrganization, githubTemplate, githubAPiToken) {
    console.log(`1/5 : Creating repository [${githubUsername}] on organization [${githubOrganization}] using template [${githubTemplate}]`);
    const url = `https://api.github.com/repos/${githubOrganization}/${githubTemplate}/generate`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${githubAPiToken}`,
      },
      body: JSON.stringify({
        name: githubUsername,
        owner: githubOrganization,
        private: true,
      }),
    };
    try {
      const response = await fetch(url, options);
      const json = await response.json();
      if (json.id) {
        console.log(`1/5 [OK] : Repository [${githubUsername}] successfully created on [${githubOrganization}]`);
        return;
      }
      if (json.errors && json.errors.length) {
        if (json.errors[0].includes('already exists')) {
          console.log(`1/5 [OK] : Repository [${githubUsername}] already exists on organization [${githubOrganization}] => continuing`);
          return;
        }
        throw json.error.reduce((acc, cur) => `${acc}\n${cur}`, '');
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  // async function to add a github username as colaborator to a github repository
  async addCollaboratorToRepo(githubUsername, githubOrganization, githubAPiToken) {
    const repoName = githubUsername;
    console.log(`2/5 : Adding collaborator [${githubUsername}] to repository [${repoName}] on organization [${githubOrganization}]`);
    const url = `https://api.github.com/repos/${githubOrganization}/${repoName}/collaborators/${githubUsername}`;
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${githubAPiToken}`,
      },
    };
    try {
      const response = await fetch(url, options);
      if (response.status === 201) {
        console.log(`2/5 [OK] : Collaborator [${githubUsername}] successfully invited to repository [${repoName}] on organization [${githubOrganization}]`);
        return;
      }
      if (response.status === 204) {
        console.log(`2/5 [OK] : Collaborator [${githubUsername}] is already a collaborator on repository [${repoName}] on organization [${githubOrganization}] => continuing`);
        return;
      }
      const json = await response.json();
      throw json.message;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
exports.GithubHelper = GithubHelper;
