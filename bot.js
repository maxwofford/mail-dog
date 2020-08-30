// Import Botkit's core features
const { Botkit } = require('botkit')
const { BotkitCMSHelper } = require('botkit-plugin-cms')

const { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } = require('botbuilder-adapter-slack')

// Load process.env values from .env file
require('dotenv').config()

const transcript = require('./utils/transcript')

let storage = null
if (process.env.MONGO_URI) {
  const { MongoDbStorage } = require('botbuilder-storage-mongodb')
  storage = mongoStorage = new MongoDbStorage({
    url : process.env.MONGO_URI,
  })
} else if (process.env.REDIS_URL) {
  const redis = require('redis')
  const { RedisDbStorage } = require('botbuilder-storage-redis')
  const redisClient = redis.createClient(process.env.REDIS_URL, { prefix: 'bot-storage:' })
  storage = redisStorage = new RedisDbStorage(redisClient)
}

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

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware())

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware())

const controller = new Botkit({
  webhook_uri: '/api/messages',
  adapter: adapter,
  storage
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

controller.webserver.get('/', async(req, res) => {
  let dogImg = ''
  await fetch('https://dog.ceo/api/breeds/image/random')
    .then(function(dogRes) {
      return dogRes.json()
    }).then(function(json) {
      dogImg = json.message
    })
  res.send(`
    <h1>${transcript('barkBark!')}</h1>
    This ${transcript('dog')} is ${transcript('running')} on Botkit ${ controller.version }.
    <br />
    <a href=${require('./package.json').repository.url}>Fetch the source</a>
    <br />
    <img src=${dogImg} style="max-width:50%;max-height:50%;" />
  `)
})

controller.webserver.get('/install', (req, res) => {
  // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
  res.redirect(controller.adapter.getInstallLink())
})

controller.webserver.get('/install/auth', async (req, res) => {
  try {
    const results = await controller.adapter.validateOauthCode(req.query.code)

    console.log('FULL OAUTH DETAILS', results)

    // Store token by team in bot state.
    tokenCache[results.team_id] = results.bot.bot_access_token

    // Capture team to bot id
    userCache[results.team_id] =  results.bot.bot_user_id

    res.json('Success! Bot installed.')
  } catch (err) {
    console.error('OAUTH ERROR:', err)
    res.status(401)
    res.send(err.message)
  }
})

let tokenCache = {}
let userCache = {}

if (process.env.TOKENS) {
  tokenCache = JSON.parse(process.env.TOKENS)
} 

if (process.env.USERS) {
  userCache = JSON.parse(process.env.USERS)
} 

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