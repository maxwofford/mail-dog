const transcript = require('../utils/transcript')
module.exports = function(controller) {
  controller.hears(['speak', 'say', 'talk'], 'mention,message,direct_message,direct_mention', async(bot, message) => {
    console.log('I heard master say something!')
    await bot.reply(message, transcript('barkBark!'))
  })
}