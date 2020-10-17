const { airFind, airPatch} = require("../utils/helpers")
const transcript = require("../utils/transcript")

module.exports = function(controller) {
  async function react(addOrRemove, channel, timestamp, reaction) {
    try {
      let bot = await controller.spawn({token: process.env.BOT_TOKEN})
      return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
    } catch (e) {
      // TODO...
    }
  }

  controller.hears(/unaccept/, ['direct_mention', 'bot_message'], async(bot, message) => {
    if (message.channel != 'GNTFDNEF8' || !message.thread_ts) {
      // just ignore it
      return
    }

    const results = {}

    await Promise.all([
      react('add', message.channel, message.ts, 'beachball'),
      airFind('Mail Senders', 'Slack ID', message.user).then(
        sender => (results.sender = sender)
      ),
      airFind('Mail Missions', 'Mail Team Thread Timestamp', message.thread_ts).then(
        mission => (results.mission = mission)
      ),
    ])


    if (!results.sender) {
      await Promise.all([
        bot.replyInThread(message, transcript('errors.notNodeMaster')),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
      return
    }

    if (!results.mission) {
      await Promise.all([
        bot.replyInThread(message, transcript('errors.missionNotFound')),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
      return
    }

    if (results.sender.fields['Permissions'].indexOf('Ship') == -1) {
      await Promise.all([
        bot.replyInThread(message, transcript('errors.missingPermission')),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
      return
    }

    if (results.mission.fields['Dropped']) {
      await Promise.all([
        bot.replyInThread(message, transcript('unaccept.dropped', {currentSender: results.mission.fields['Sender Slack ID']})),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
      return
    }

    await Promise.all([
      airPatch('Mail Missions', results.mission.id, {
        'Sender': [],
        'Assignment Time': null,
      }),
      react('remove', message.channel, message.ts, 'beachball'),
      react('add', message.channel, message.ts, 'white_check_mark'),
    ])
  })
}