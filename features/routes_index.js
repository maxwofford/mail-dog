const transcript = require('../utils/transcript')

module.exports = function(controller) {
  controller.webserver.get('/', async(req, res) => {
    let dogImg = ''
    await fetch('https://dog.ceo/api/breeds/image/random')
      .then(function(dogRes) {
        return dogRes.json()
      }).then(function(json) {
        dogImg = json.message
      })
    res.send(`
      <h1>${transcript('barkBark!')}</h1>
      This ${transcript('dog')} is ${transcript('running')} on Botkit ${ controller.version }.
      <br />
      <a href=${require('../package.json').repository.url}>Fetch the source</a>
      <br />
      <img src=${dogImg} style="max-width:50%;max-height:50%;" />
    `)
  })
}