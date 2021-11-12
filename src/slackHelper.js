const originalFetch = require('node-fetch');
const fetch = require('fetch-retry')(originalFetch);

const SlackHelper = {
    // eslint-disable-next-line max-len
    async createPrivateConversationAndInviteGUestUSer(channelName, slackEmail, slackTeam, slackUsersList, slackAPiToken) {
        const slackTeamId = await this.slackAuthTest(slackAPiToken, slackTeam)
        const channelId = await this.createSlackConversation(channelName, slackAPiToken);
        // eslint-disable-next-line max-len
        const users = await this.searchSlackUsersIds(slackUsersList, slackAPiToken);
        if (users.userIds.length === 0) {
            console.log('No users found from the provided ' + slackUsersList + ' list');
        } else {
            await this.addSlackUsersToConversation(channelId, channelName, users.foundEmails, users.userIds, slackAPiToken);
        }
        await this.inviteGuestUserToSlackConversation(channelName, slackTeamId, channelId, slackEmail, slackAPiToken);
    },
    // slack auth test
    async slackAuthTest(token, teamName) {
        try {
            const response = await fetch(`https://slack.com/api/auth.test`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                },
            });
            const json = await response.json();
            if (!json.ok) {
                return JSON.stringify(json);
            }
            if (json.ok && json.team === teamName) {
                return json.team_id;
            }
            throw new Error('Providd team name is invalid!');
        } catch (error) {
            console.log(error);
            throw error
        }
    },
    // create slack conversation using fetch async/await
    async createSlackConversation(channelName, slackAPiToken) {
        console.log(`3/6 : Creating private slack conversation [${channelName}]`);
        const options = {
            url: 'https://slack.com/api/conversations.create',
            headers: {
                'User-Agent': 'request',
                Authorization: `Bearer ${slackAPiToken}`,
                'Content-type': 'application/json; charset=UTF-8',
            },
            json: {
                token: slackAPiToken,
                name: channelName,
                is_private: true,
            },
        };
        const response = await fetch(options.url, {
            method: 'POST',
            headers: options.headers,
            body: JSON.stringify(options.json),
        });
        try {
            const json = await response.json();
            if (json.error && json.error.includes('name_taken')) {
                console.log('  Channel [' + channelName + '] already exists');
                let channelId = await this.getSlackConversationId(channelName, slackAPiToken);
                if (!channelId) {
                    throw 'Slack channel ' + channelName + ' not found!';
                }
                return channelId;
            }
            if (!json.ok) {
                throw JSON.stringify(json);
            }
            console.log(`   ===> Created Channel ${channelName} ID: ${channelId}`);
            return json.channel.id;
        } catch (e) {
            throw 'Slack: ' + e;
        }
    },
    //async function get slack conversation id base on its name
    async getSlackConversationId(slackChannelName, slackAPiToken) {
        console.log(`   ===> Fetching its ID ...`);
        const options = {
            url: 'https://slack.com/api/conversations.list',
            headers: {
                'User-Agent': 'request',
                Authorization: `Bearer ${slackAPiToken}`,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: new URLSearchParams({
                types: 'private_channel',
            })
        };
        const response = await fetch(options.url, {
            method: 'POST',
            headers: options.headers,
            body: options.body,
        });
        try {
            const json = await response.json();
            if (!json.ok) {
                throw JSON.stringify(json);
            }
            const channelId = json.channels.find(channel => channel.name === slackChannelName).id;
            console.log(`   ===> Channel [${slackChannelName}] ID: ${channelId}`);
            return channelId;
        } catch (e) {
            throw 'Slack: ' + e;
        }
    },

    // function to add a collaborator to a slack conversation fetch async/await
    async inviteGuestUserToSlackConversation(channelName, teamId, channelId, slackEmail, slackAPiToken) {
        console.log(`6/6 : Inviting guest user [${slackEmail}] to slack conversation [${channelName}]`);
        const options = {
            url: 'https://slack.com/api/admin.users.invite',
            headers: {
                'User-Agent': 'request',
                Authorization: `Bearer ${slackAPiToken}`,
                'Content-type': 'application/json; charset=UTF-8',
            },
            json: {
                token: slackAPiToken,
                channel_ids: channelId,
                email: [slackEmail],
                team_id: teamId,
                is_restricted: false,
                is_ultra_restricted: true
            },
        };
        const response = await fetch(options.url, {
            method: 'POST',
            headers: options.headers,
            body: JSON.stringify(options.json),
        });
        // todo // missing scope: admin.user.invite ===> https://api.slack.com/methods/admin.users.invite // entreprise slack
        const json = await response.json();
        if(json.error && json.error.includes('already_in_team')) {
            console.log('  User [' + slackEmail + '] already in team');
            return;
        }
        if(json.error && json.error.includes('already_invited')) {
            console.log('  User [' + slackEmail + '] already invited');
            return;
        }
        if (!json.ok) {
            throw JSON.stringify(json);
        }
        console.log(`   ===> Invited guest user [${slackEmail}] to slack conversation [${channelName}]`);
    },
    // function to search for user slack email and returns array of ids
    async searchSlackUsersIds(slackEmails, slackAPiToken) {
        console.log(`4/6 : Fetching users ids from emails [${slackEmails}] ...`);
        const options = {
            url: 'https://slack.com/api/users.list',
            headers: {
                'User-Agent': 'request',
                Authorization: `Bearer ${slackAPiToken}`,
                'Content-type': 'application/json; charset=UTF-8',
            },
            json: {
                token: slackAPiToken,
            },
        };
        try {
            const response = await fetch(options.url, {
                method: 'POST',
                headers: options.headers,
                body: JSON.stringify(options.json),
            });
            const json = await response.json();
            if (!json.ok) {
                throw JSON.stringify(json);
            }
            const users = json.members;
            const userIds = [];
            const foundEmails = [];
            users.forEach((user) => {
                if (slackEmails.includes(user.profile.email)) {
                    userIds.push(user.id);
                    foundEmails.push(user.profile.email);
                }
            });
            if (foundEmails.length !== slackEmails.length) {
                console.log(`   ===> Not found ${slackEmails.length - foundEmails.length} user(s) in slack: [${slackEmails.filter(email => !foundEmails.includes(email))}]`);
            }
            if (foundEmails.length) {
                console.log(`   ===> Found ${foundEmails.length} user(s) in slack: [${foundEmails}]`);
            }
            return {userIds, foundEmails};
        } catch (e) {
            throw 'Slack: ' + e;
        }
    },

    async addSlackUsersToConversation(channelId, channelName, foundEmails, slackUsersIds, slackAPiToken) {
        console.log(`5/6 : Adding slack users [${foundEmails}] to slack conversation [${channelName}]`);
        const options = {
            url: 'https://slack.com/api/conversations.invite',
            headers: {
                'User-Agent': 'request',
                Authorization: `Bearer ${slackAPiToken}`,
                'Content-type': 'application/json; charset=UTF-8',
            },
            json: {
                token: slackAPiToken,
                channel: channelId,
                users: slackUsersIds.join(','),
            },
        };
        try {
            const response = await fetch(options.url, {
                method: 'POST',
                headers: options.headers,
                body: JSON.stringify(options.json),
            });
            const json = await response.json();
            if (json.error && json.error.includes('already_in_channel')) {
                console.log(`   ===> Users already in channel [${channelName}]`);
                return;
            } else if (!json.ok) {
                throw JSON.stringify(json);
            }
            console.log(`   ===> Users ${foundEmails} added to channel [${channelName}]`);
            return json;
        } catch (e) {
            throw 'Slack: ' + e;
        }
    },
};
exports.SlackHelper = SlackHelper;
