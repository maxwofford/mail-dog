const transcript = require('../utils/transcript')

module.exports = function(controller) {
  async function replyWithFlavor(message, text) {
    const bot = await controller.spawn({token: process.env.BOT_TOKEN})
    // const wordsArr = text.split(' ')
    // console.log(wordsArr)

    // const sent = await bot.reply(message, wordsArr[0])
    // await bot.updateMessage({text, ...sent})
    let sent = await bot.reply(message,'this is my original reply...');

    // update the sent message using the sent.id field
    await bot.updateMessage({
        text: 'this is an update!',
        ...sent
    })
  }
  controller.hears(/(?:\W|^)(?:speak|say|talk|walk|food|treat|björk|woof|bark)/, ['mention','bot_message','direct_message','direct_mention'], async(bot, message) => {
    console.log('I heard master say something!')
    // await bot.reply(message, transcript('barkBark!'))

    const text = transcript('barkBark!')

    const wordsArray = text.split(' ')
    let sent
    for (let i=0; i<=wordsArray.length; i++) {
      let word = wordsArray[i]
      let previousWords = wordsArray.slice(0,i).join(' ')
      let currentText = previousWords
      if (word) {
        currentText+= ' _*' + word.toUpperCase() + '*_'
      }
      if (!sent) {
        sent = await bot.reply(message, currentText);
      } else if (word) {
        sent = {...(await bot.updateMessage({ text: currentText, ...sent })), ...sent}
      } else {
        sent = {...(await bot.updateMessage({ text: currentText, ...sent })), ...sent}
      }
    }

    await bot.updateMessage({
      text,
      ...sent
    })

    // update the sent message using the sent.id field
    await bot.updateMessage({
      text,
      ...sent
    })
  })
}
