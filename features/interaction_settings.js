const transcript = require('../utils/transcript')
module.exports = function(controller) {
  controller.hears('settings', 'direct_mention,direct_message', async(bot, message) => {
    console.log('I heard master ask for my settings link!')
    await bot.reply(message, transcript('settingsLink'))
  })
}