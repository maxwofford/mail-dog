module.exports = function(controller) {
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
      userCache[results.team_id] = results.bot.bot_user_id

      res.json('Success! Bot installed.')
    } catch (err) {
      console.error('OAUTH ERROR:', err)
      res.status(401)
      res.send(err.message)
    }
  })
}

