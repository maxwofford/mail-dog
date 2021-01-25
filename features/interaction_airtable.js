module.exports = function(controller) {
  async function react(addOrRemove, channel, timestamp, reaction) {
    try {
      let bot = await controller.spawn({token: process.env.BOT_TOKEN})
      return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
    } catch (e) {
      // TODO...
    }
  }

  controller.hears(/^airtable/, ['direct_mention','bot_message'], async(bot, message) => {
    if (message.channel != 'GNTFDNEF8' || !message.thread_ts) {
      // just ignore it
      return
    }
    if (message.type == 'bot_message') {
      message.user = message['incoming_message']['channelData']['user']
    }

    const results = {}

    await Promise.all([
      react('add', message.channel, message.ts, 'beachball'),
      airFind('Mail Missions', 'Mail Team Thread Timestamp', message.thread_ts).then(
        mission => (results.mission = mission)
      ),
    ])

    if (!results.mission) {
      await Promise.all([
        bot.replyInThread(message, transcript('errors.missionNotFound')),
        react('remove', message.channel, message.ts, 'beachball'),
        react('add', message.channel, message.ts, 'warning'),
      ])
      return
    }

    const url = `https://airtable.com/tbluxlM4neeXdddzj/viw1MQE8qhcLTOx1i/${results.mission.id}?blocks=hide`

    await Promise.all([
      react('remove', message.channel, message.ts, 'beachball'),
      react('add', message.channel, message.ts, 'white_check_mark'),
      bot.replyInThread(message, transcript('airtable', {url})),
    ])
  })
}