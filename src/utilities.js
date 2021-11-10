const Utilities = {
  readInputParams(input) {
    const params = {};
    input.forEach((element) => {
      const param = element.split('=');
      // eslint-disable-next-line prefer-destructuring
      params[param[0].replace('--', '')] = param[1];
    });
    return params;
  },

  validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },

  validateInputParams(params) {
    // validate input params
    if (!params.ghuser) {
      console.log('--ghuser is required. try <node automator.js --help> for complete required parameters!');
      process.exit(1);
    }
    if (!params.slackemail) {
      console.log('--slackemail is required. try <node automator.js --help> for complete required parameters!');
      process.exit(1);
    }
    // validate valid email
    if (!this.validateEmail(params.slackemail)) {
      console.log('--slackemail is not valid email');
      process.exit(1);
    }
  },

  displayHelpMessage() {
    // display help message
    console.log('This is the list of possible command line script parameters:');
    console.log('  --ghuser=<github username> : requried');
    console.log('  --slackemail=<slack email> : required');
    console.log('  --help');
    console.log('You need to have a valid <./configuration/config.json> that has same structure  as ./config.json.template.');
    console.log('You also need to have <.env> file at the root of the project that has required <GH_TOKEN> and <SLACK_TOKEN> API keys.');
  },

  validateConfigJsonParamsAndAPITokens(json, environementVariables) {
    const keys = ['githubOrganization', 'githubTemplateName', 'slackTeam', 'slackTeam'];
    for (let i = 0; i < keys.length; i += 1) {
      if (!json[keys[i]]) {
        console.log(`${keys[i]} is required`);
        process.exit(1);
      }
    }
    if(!environementVariables.GH_TOKEN) {
      console.log('EIther .env file is not present at the root of your project folder or GH_TOKEN is missing!');
      process.exit(1);
    }
    if(!environementVariables.SLACK_TOKEN) {
      console.log('Either .env file is not present at the root of your project folder or SLACK_TOKEN is missing!');
      process.exit(1);
    }
  },

  handleError(err) {
    console.log(err);
    process.exit(1);
  },

  handleSuccess(data) {
    console.log(data);
    process.exit(0);
  },
};
exports.Utilities = Utilities;
