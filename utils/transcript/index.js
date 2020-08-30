const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { sample } = require('lodash')
const mapValuesDeep = require('map-values-deep') // https://github.com/lodash/lodash/issues/1244#issuecomment-498679388

function transcript(search, vars) {
  if (vars) {
    console.log(
      `I'm searching for words in my yaml file under "${search}". These variables are set: ${JSON.stringify(
        vars,
        replaceErrors
      )}`
    )
  } else {
    console.log(`I'm searching for words in my yaml file under "${search}"`)
  }
  const searchArr = search.split('.')
  const transcriptObj = loadTranscript()

  const rawScript = recurseTranscript(searchArr, transcriptObj)
  if (typeof rawScript === 'string' ) {
    return evalTranscript(rawScript, vars)
  } else {
    return mapValuesDeep(rawScript, function(value) {
      return evalTranscript(value, vars)
    })
  }
}

function loadTranscript() {
  const file = fs.readFileSync(path.resolve(__dirname, './transcript.yml'), 'utf8')
  const doc = yaml.safeLoad(
  )
  return yaml.safeLoad(file)
}
function recurseTranscript(searchArr, transcriptObj) {
  const searchCursor = searchArr.shift()
  const targetObj = transcriptObj[searchCursor]

  if (!targetObj) {
    return new Error(transcript('errors.transcript'))
  }
  if (searchArr.length > 0) {
    return recurseTranscript(searchArr, targetObj)
  } else {
    if (Array.isArray(targetObj)) {
      return sample(targetObj)
    } else {
      return targetObj
    }
  }
}
function replaceErrors(key, value) {
  // from https://stackoverflow.com/a/18391400
  if (value instanceof Error) {
    const error = {}
    Object.getOwnPropertyNames(value).forEach(key => {
      error[key] = value[key]
    })
    return error
  }
  return value
}

function evalTranscript(target, vars = {}) {
  return function() {
    return eval('`' + target + '`')
  }.call({
    ...vars,
    t: transcript,
  })
}

module.exports = transcript