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

  controller.hears(['drop'], ['mention','bot_message','direct_message','direct_mention'], async(bot, message) => {
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
          bot.replyInThread(message, transcript('drop.noSender')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (!results.mission) {
        await Promise.all([
          bot.replyInThread(message, transcript('drop.missionNotFound')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (results.sender.fields['Permissions'].indexOf('Drop') == -1) {
        await Promise.all([
          bot.replyInThread(message, transcript('drop.missingPermission')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (results.mission.fields['Dropped']) {
        await Promise.all([
          bot.replyInThread(message, transcript('drop.alreadyDropped')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'white_check_mark'),
        ])
      } else {
        await Promise.all([
          bot.replyInThread(message, {
            blocks: [
              {
                "type": "image",
                "title": {
                  "type": "plain_text",
                  "text": "Dropped!",
                  "emoji": true
                },
                "image_url": transcript('drop.success'),
                "alt_text": "mission dropped"
              }
            ]
          }),
          airPatch('Mail Missions', results.mission.id, { 'Dropped': true }),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'white_check_mark'),
          react('add', message.channel, results.mission.fields['Mail Team Thread Timestamp'], 'skull')
        ])
      }
    } catch (err) {
      bot.replyInThread(message, transcript('errors.generalFormat', {err}))
    }
  })
}