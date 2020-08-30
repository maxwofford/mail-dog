const transcript = require('../utils/transcript')
const { air }= require('../utils/hackclub')

module.exports = function(controller) {
  controller.hears(['send', 'test'], 'direct_mention,direct_message', async(bot, message) => {
    console.log('Someone wants to send something!')

    const { text, user } = message

    const [sendOrTest, taggedScenario, recipientLookup, ...memoArray] = text.split(' ')
    const memo = memoArray.join(' ')

    try {
      const startTime = Date.now()
      const person = (await air.read({
            filterByFormula: `{Slack ID} = '${user}'`,
            maxRecords: 1
          }, { tableName: 'People', }))[0]

      const senderRecordID = (person.fields['Mail Sender'] || [])[0]
      if (!senderRecordID) throw transcript('mailMission.noSender')
      
      const sender = await air.find(senderRecordID, {tableName: 'Mail Senders'})

      if (sendOrTest === 'send') {
        const senderCanDispatch = sender.fields['Permissions'].includes('Dispatch')
        if (!senderCanDispatch) throw transcript('mailMission.senderCannotDispatch')
      } else {
        const senderCanTest = sender.fields['Permissions'].includes('Test')
        if (!senderCanTest) throw transcript('mailMission.senderCannotDispatch')
      }

      const scenarios = await air.read('Mail Scenarios')
      const selectedScenario = scenarios.find(scenario => scenario.fields['ID'] === taggedScenario)
      const scenarioList = scenarios.map(scenario => scenario.fields['ID'])
      if (!selectedScenario) throw transcript('mailMission.scenarioNotFound', { scenarioList, taggedScenario })

      if (sendOrTest === 'test') {
        await bot.reply(message, transcript('mailMission.test'))
      }
      const channel = 'GNTFDNEF8'
      await bot.say({channel, text: transcript('mailMission.dispatch', {sendOrTest, taggedScenario, recipientLookup, memo})})
      await bot.reply(message, transcript('mailMission.confirm', {taggedScenario, memo, recipientLookup}))
    } catch (err) {
      console.error(err)
      await bot.reply(message, transcript('errors.generalFormat', {err}))
    }
  })
}