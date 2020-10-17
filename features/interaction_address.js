const transcript = require('../utils/transcript')
const { airFind } = require('../utils/helpers')

module.exports = function(controller) {
  async function react(addOrRemove, channel, timestamp, reaction) {
    try {
      let bot = await controller.spawn({token: process.env.BOT_TOKEN})
      return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
    } catch (e) {
      // TODO...
    }
  }

  controller.hears(['address'], ['direct_mention'], async (bot, message) => {
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
          bot.replyInThread(message, transcript('address.noSender')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (!results.mission) {
        await Promise.all([
          bot.replyInThread(message, transcript('address.missionNotFound')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      await Promise.all([
        airFind('Addresses', `RECORD_ID() = "${results.mission.fields['Receiver Address']}"`).then(address => {
          results.address = address
        })
      ])

      if (results.sender.fields['Permissions'].indexOf('Address') == -1) {
        await Promise.all([
          bot.replyInThread(message, transcript('address.missingPermission')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      const updateLink = results.address.fields['Sender Update Form URL']
      const senderID = message.user
      await Promise.all([
        bot.replyInThread(message, transcript('address.postUpdateLink', { updateLink, senderID })),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'white_check_mark'),
      ])

    } catch {
      bot.replyInThread(message, transcript('errors.generalFormat', {err}))

      react('remove', message.channel, message.ts, 'beachball')
      react('add', message.channel, message.ts, 'warning')
    }
  })
}