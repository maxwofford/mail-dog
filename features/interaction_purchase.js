const transcript = require('../utils/transcript')
const { airFind } = require('../utils/helpers')

/* This is kinda weird. Postmaster has a huge complex flow for purchasing that I
 really don't want to interfere with. For now, I'm going to build @maildog
 ontop of it– purchasing through maildog...
 1. accepts the package if it's unassigned
 2. purchases the package through postmaster
 */
module.exports = function(controller) {
  async function react(addOrRemove, channel, timestamp, reaction) {
    try {
      let bot = await controller.spawn({token: process.env.BOT_TOKEN})
      return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
    } catch (e) {
      // TODO...
    }
  }

  controller.hears(['purchase'], ['mention','bot_message','direct_message','direct_mention'], async(bot, message) => {
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
          bot.replyInThread(message, transcript('purchase.noSender')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (!results.mission) {
        await Promise.all([
          bot.replyInThread(message, transcript('purchase.missionNotFound')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (results.sender.fields['Permissions'].indexOf('Purchase') == -1) {
        await Promise.all([
          bot.replyInThread(message, transcript('purchase.missingPermission')),
          react('remove', message.channel, message.ts, 'beachball'),
          react('add', message.channel, message.ts, 'warning'),
        ])
        return
      }

      if (!results.mission.fields['Sender Slack ID']) {
        await airPatch('Mail Missions', results.mission.id, {
          'Sender': [results.sender.id],
          'Assignment Time': Date.now(),
        })
      }

      await bot.replyInThread(message, ('<@UNRAW3K7F> purchase'))
      // hit the endpoint for purchasing addresses
      // const fetch = require('node-fetch')
      // const response = await fetch('https://mail-dog.hackclub.com/api/purchase', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     addressRecordID: results.mission.fields['Receiver Address'],
      //     missionRecordID: results.mission.id,
      //   })
      // })

      await Promise.all([
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