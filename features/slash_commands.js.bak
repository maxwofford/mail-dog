const transcript = require('../utils/transcript')
const { airFind, airGet } = require('../utils/helpers')

module.exports = function(controller) {
  controller.on('slash_command', async(bot, message) => {
    const { command, text: parameters, user } = message

    bot.httpStatus(200)

    await bot.replyPrivate(message, {
      blocks: [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${command} ${parameters}`
            }
          ]
        }
      ]
    })

    switch (command) {
      case '/missions':
        const missions = await airGet('Mail Missions', 'Sender Slack ID', message.user)
        if (!missions) {
          console.log(transcript('errors.permissions'))
          return await bot.replyPrivate(message, transcript('missions.noMissions'))
        }
        console.log(missions.length.toString())
        await bot.replyPrivate(message, missions.length.toString())
        return
        // let unfinished, unassigned
        // await Promise.all([
        //   unfinished = await airFind('Person', user)
        //     .find('Mail Sender')
        //     .get('Missions', {'Status': '3 Purchased'}, {'Status': '2 Assigned'}),
        //   unassigned = await airFind('Mail Missions', {'Status': '1 Unassigned'})
        // ])
        // await bot.replyPrivate(message, transcript('missions.unfinished', { unfinished }))
        // await bot.replyPrivate(message, transcript('missions.unassigned', { unassigned }))
      default:
        console.log('slash command not found')
        return await slashCommandNotFound(bot, message)
    }
  })
}

async function slashCommandNotFound(bot, message) {
  const script = transcript('slashCommandNotFound')
  const content = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: script.message
        }
      },
      {
        type: "image",
        title: {
          type: "plain_text",
          text: "looking for missing command",
          emoji: true
        },
        image_url: script.imageUri,
        alt_text: "looking for missing command"
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: script.attribution,
          },
        ],
      }
    ]
  }
  return await bot.replyPublic(message, content)
}