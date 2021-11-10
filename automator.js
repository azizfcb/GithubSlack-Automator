require('dotenv').config();
const config = require('./configuration/config.json');
/* ========================== Helpers and requirements ============================== */
const utilities = require('./src/utilities').Utilities;
const githubHelper = require('./src/githubHelper').GithubHelper;
//const slackHelper = require('./src/slackHelper').SlackHelper;
/* ========================== Helpers ============================== */

// main function script
async function main() {
  // read input params
  const input = process.argv.slice(2);
  const params = utilities.readInputParams(input);
  if (Object.keys(params).includes('help')) {
    utilities.displayHelpMessage(params);
    process.exit();
  }
  utilities.validateInputParams(params);
  utilities.validateConfigJsonParamsAndAPITokens(config, process.env);
  const githubUsername = params.ghuser;
  const slackEmail = params.slackemail;
  const { githubOrganization } = config;
  const githubTemplate = config.githubTemplateName;
  const slackTeamId = config.slackTeam;
  const { slackUsersList } = config;
  const githubAPiToken = process.env.GH_TOKEN;
  const slackAPiToken = process.env.SLACK_TOKEN;
  try {
    console.log('Process Started ...')
    // eslint-disable-next-line max-len
    await githubHelper.createPrivateRepositoryAndAddCollaborator(githubUsername, githubOrganization, githubTemplate, githubAPiToken);
    // eslint-disable-next-line max-len
    // temporary
    process.exit(0);
    // await slackHelper.createPrivateConversationAndInviteGUestUSer(githubUsername, slackEmail, slackTeamId, slackUsersList, slackAPiToken);
    console.log('Process Finished.')
  } catch (err) {
    console.log('Error: ' + err);
    process.exit();
  }
}

main().then((data) => utilities.handleSuccess(data)).catch((e) => utilities.handleError(e));
