const transcript = require('../utils/transcript')
const { airFind, airPatch } = require('../utils/helpers')

module.exports = function(controller) {
  async function react(addOrRemove, channel, timestamp, reaction) {
    try {
      let bot = await controller.spawn({token: process.env.BOT_TOKEN})
      return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
    } catch (e) {
      // TODO...
    }
  }

  controller.hears(['request'], ['mention','bot_message','direct_message','direct_mention'], async(bot, message) => {
    if (message.channel != 'GNTFDNEF8' || !message.thread_ts) {
      // just ignore it
      return
    }

    try {
      const results = {}
      await Promise.all([
        react('add', message.channel, message.ts, 'beachball'),
        airFind('Mail Missions', 'Mail Team Thread Timestamp', message.thread_ts).then(mission => (
          results.mission = mission
        )),
        airFind('Mail Senders', 'Slack ID', message.user).then(
          sender => (results.sender = sender)
        ),
      ])

      if (!results.sender) {
        await Promise.all([
          bot.replyInThread(message, transcript('request.noSender')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (!results.mission) {
        await Promise.all([
          bot.replyInThread(message, transcript('request.missionNotFound')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }


      if (results.sender.fields['Permissions'].indexOf('Address') == -1) {
        await Promise.all([
          bot.replyInThread(message, transcript('request.missingPermission')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      // hit the zap endpoint for updating addresses
      const fetch = require('node-fetch')
      const response = await fetch('https://hooks.zapier.com/hooks/catch/507705/oue2tbi/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressRecordID: results.mission.fields['Receiver Address'],
          message: `${results.mission.fields['Sender Name'] || results.sender.fields['Name']}(<@${results.mission.fields['Sender Slack ID'] || results.sender.fields['Slack ID']}>) needs to send you something.`,
        })
      })

      await Promise.all([
        // bot.replyInThread(message, transcript('request.success', {recipient: results.mission.fields['Receiver Public Slack Message Tag']})),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'white_check_mark'),
      ])
    } catch (err) {
      bot.replyInThread(message, transcript('errors.generalFormat', {err}))

      react('remove', message.channel, message.ts, 'beachball')
      react('add', message.channel, message.ts, 'warning')
    }
  })
}