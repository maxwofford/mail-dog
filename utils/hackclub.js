const AirtablePlus = require('airtable-plus')

class Info {
  constructor(config = {}) {
    // const auth = {
    //   airtableApiKey: config.airtableApiKey || process.env.AIRTABLE_API_KEY,
    //   baseID: config.baseID || process.env.AIRTABLE_BASE_ID
    // }
    // this.auth = config.auth || auth
    this.tableName = config.searchTerms
    this.searchTerms = config.searchTerms
    this.airtable = new AirtablePlus({
      apiKey: process.env.AIRTABLE_API_KEY,
      baseID: process.env.AIRTABLE_BASE_ID,
      tableName: this.tableName,
      camelCase: false,
      complex: false,
      transform: undefined // optional function to modify records on read
     })
  }

  async find() {
  }

  chainedSelf() {
    return new Info({
      auth: this.auth,
      chained: true
    })
  }
}

async function airFind({tableName, ...searchTerms}) {
  const info = new Info({
    tableName,
    searchTerms
  })

  return info.find()
}

module.exports = {
  air: new AirtablePlus({
    apiKey: process.env.AIRTABLE_API_KEY,
    baseID: process.env.AIRTABLE_BASE_ID,
    complex: false
  })
}