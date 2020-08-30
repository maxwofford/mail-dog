async function react(bot, addOrRemove, channel, timestamp, reaction) {
  return await bot.api.reactions[addOrRemove]({timestamp, channel, name: reaction})
}
module.exports = function(controller) {
  controller.hears(['test'], 'mention,direct_mention,direct_message', async(bot, message) => {
    react(bot, 'add', message.channel, message.ts, 'beachball')
    bot.reply(message, transcript('barkBark!'))
  })
}