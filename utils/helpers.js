const Airtable = require('airtable')
const bases = {}
bases.operations = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
  process.env.AIRTABLE_BASE_ID
)
const airPatch = (baseName, recordID, values, options = {}) =>
      new Promise((resolve, reject) => {
        const timestamp = Date.now()
        console.log(
          `I'm asking Airtable to patch ${recordID} record in ${baseName} base at ${timestamp} with the new values: ${JSON.stringify(
            values
          )}`
        )
        const base = bases[options.base || 'operations']
        base(baseName).update(recordID, values, (err, record) => {
          if (err) {
            console.error(err)
            reject(err)
          }
          console.log(
            `Airtable updated my ${baseName} record from ${timestamp} in ${Date.now() -
              timestamp}ms`
          )
          resolve(record)
        })
      })

const airCreate = (baseName, fields, options = {}) =>
      new Promise((resolve, reject) => {
        const timestamp = Date.now()
        console.log(
          `I'm asking Airtable to create a new record in the ${baseName} base at ${timestamp}`
        )
        const base = bases[options.base || 'operations']
        base(baseName).create(fields, (err, record) => {
          if (err) {
            console.error(err)
            reject(err)
          }
          if (!record) {
            reject(new Error('Record not created'))
          }
          console.log(
            `Airtable saved my ${baseName} record from ${timestamp} in ${Date.now() -
              timestamp}ms`
          )
          resolve(record)
        })
      })

const airFind = async (baseName, fieldName, value, options = {}) => {
  // see airGet() for usage

  // note: we're not using a rate-limiter here b/c it's just a wrapper
  // function for airGet, which is already rate-limited
  const records = await airGet(baseName, fieldName, value, {
    ...options,
    selectBy: { ...options.selectBy, maxRecords: 1 },
  })
  return (records || [])[0]
}

const airGet = (
  baseName,
  searchArg = null,
  tertiaryArg = null,
  options = {}
) => new Promise((resolve, reject) => {
        // usage:
        // for key/value lookup: `airGet('Clubs', 'Slack Channel ID', slackChannelID)`
        // for formula lookup: `airGet('Clubs', '{Slack Channel ID} = BLANK()')`
        // for all records: `airGet('People')`

        const timestamp = Date.now()

        const selectBy = options.selectBy || {}
        if (searchArg === null) {
          console.log(
            `I'm asking AirTable to send me ALL records in the "${baseName}" base. The timestamp is ${timestamp}`
          )
        } else {
          if (tertiaryArg) {
            // this is a key/value lookup
            selectBy.filterByFormula = `{${searchArg}} = "${tertiaryArg}"`
          } else {
            // this is a formula lookup
            selectBy.filterByFormula = searchArg
          }

          console.log(
            `I wrote a query & sent it to AirTable with a timestamp of ${timestamp}: BASE=\`${baseName}\` FILTER=\`${selectBy.filterByFormula}\``
          )
        }

        const base = bases[options.base || 'operations']
        base(baseName)
          .select(selectBy)
          .all((err, data) => {
            if (err) {
              console.error(err)
              reject(err)
            }
            console.log(
              `AirTable got back to me from my question at ${timestamp} with ${
                data.length
              } records. The query took ${Date.now() - timestamp}ms`
            )
            resolve(data)
          })
      })
 
module.exports = {
  airPatch, airCreate, airFind, airGet
}