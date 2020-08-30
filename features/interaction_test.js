const transcript = require('../utils/transcript')
const { airFind, airGet } = require('../utils/helpers')

module.exports = function(controller) {
  async function react(addOrRemove, channel, timestamp, reaction) {
    try {
      let bot = await controller.spawn({token: process.env.BOT_TOKEN})
      return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
    } catch (e) {
      // TODO...
    }
  }

  // @maildog test sticker_envelope @orpheus reward for being such a good dino
  controller.hears(['test', 'send'], ['mention','direct_message','direct_mention'], async(bot, message) => {
    console.log(message.text)
    const cleanText = message.text.replace(/ +/g, " ").trim()
    const verb = cleanText.split(' ')[0]
    const scenarioName = cleanText.split(' ')[1]
    const recipientID = cleanText.split(' ')[2].match(/[A-Z0-9]+/g)[0]
    const note = cleanText.split(' ').slice(3).join(' ')
    console.log(verb, scenarioName, recipientID, note)

    const results = {}
    await Promise.all([
      react('add', message.channel, message.ts, 'beachball'),
      airFind('Mail Senders', 'Slack ID', message.user).then(
        sender => (results.sender = sender)
      ),
      airFind('Mail Scenarios', 'ID', scenarioName).then(
        scenario => (results.scenario = scenario)
      ),
      airFind('People', 'Slack ID', recipientID).then(
        recipient => (results.recipient = recipient)
      ),
    ])

    if (!results.sender) {
      bot.replyInThread(message, transcript('test.noSender'))
      return
    }
    if (results.sender.fields['Permissions'].indexOf('Test') == -1) {
      bot.replyInThread(message, transcript('test.missingPermission'))
      return
    }
    if (!results.scenario) {
      await Promise.all([
        bot.replyInThread(message, transcript('test.invalidScenario', {scenarioName})).then(
          reply => results.reply = reply
        ),
        airGet('Mail Scenarios').then(
          scenarios => (
            results.scenarios = scenarios.map(s => s.fields['ID'])
          )
        ),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
      const Fuse = require('fuse.js')
      const fuse = new Fuse(results.scenarios, {threshold:0.2})
      const sorted = fuse.search(scenarioName).map(s => s.item)

      if (sorted.length > 0) {
        await bot.replyInThread(message, transcript('test.recommendedScenarios', {sorted}))
      }
      return
    }

    const fetch = require('node-fetch')
    const response = await fetch('https://hooks.zapier.com/hooks/catch/507705/o2dbufn/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test: verb == 'test',
        scenarioRecordID: results.scenario.id,
        receiverAddressRecordID: results.recipient.fields['Address'][0],
        missionNotes: note + ' mission created through maildog'
      })
    })
    if (response.statusText == 'OK') {
      await Promise.all([
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'white_check_mark'),
      ])
    } else {
      await Promise.all([
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
    }
  })
}