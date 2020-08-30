// Load process.env values from .env file
require('dotenv').config()

// Import Botkit's core features
const { Botkit } = require('botkit')
const { BotkitCMSHelper } = require('botkit-plugin-cms')

const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack')

const adapter = new SlackAdapter({
  // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
  enable_incomplete: true,

  // parameters used to secure webhook endpoint
  verificationToken: process.env.VERIFICATION_TOKEN,
  clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,  

  // auth token for a single-team app
  // botToken: process.env.BOT_TOKEN,

  // credentials used to set up oauth for multi-team apps
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  scopes: ['bot'], 
  redirectUri: process.env.REDIRECT_URI,

  // functions required for retrieving team-specific info
  // for use in multi-team apps
  getTokenForTeam: getTokenForTeam,
  getBotUserByTeam: getBotUserByTeam,
})

async function getTokenForTeam(teamId) {
  if (tokenCache[teamId]) {
    return tokenCache[teamId]
  }
  console.error('Team not found in tokenCache: ', teamId)
}

async function getBotUserByTeam(teamId) {
  if (userCache[teamId]) {
    return userCache[teamId]
  }
  console.error('Team not found in userCache: ', teamId)
}

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware())

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware())

const controller = new Botkit({
  webhook_uri: '/api/messages',
  adapter: adapter,
  // storage
})

if (process.env.CMS_URI) {
  controller.usePlugin(new BotkitCMSHelper({
    uri: process.env.CMS_URI,
    token: process.env.CMS_TOKEN,
  }))
}

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {
  // load traditional developer-created local custom feature modules
  controller.loadModules(__dirname + '/features')

  /* catch-all that uses the CMS to trigger dialogs */
  if (controller.plugins.cms) {
    controller.on('message,direct_message', async (bot, message) => {
      let results = false
      results = await controller.plugins.cms.testTrigger(bot, message)

      if (results !== false) {
        // do not continue middleware!
        return false
      }
    })
  }
})
