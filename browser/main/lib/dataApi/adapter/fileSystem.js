const path = require('path')
const sander = require('sander')
const CSON = require('@rokt33r/season')

const TYPE = 'FILESYSTEM'

function readCSONSync (path) {
  return new Promise((resolve) => resolve(CSON.readFileSync(path)))
}

function writeCSONSync (path, data) {
  return new Promise((resolve) => resolve(CSON.writeFileSync(path, data)))
    .then(() => data)
}

function readdirSync (path) {
  return new Promise((resolve) => resolve(sander.readdirSync(path)))
}

function mkdirSync (path) {
  return new Promise((resolve) => resolve(sander.mkdirSync(path)))
}

function statSync (path) {
  return new Promise((resolve) => resolve(sander.statSync(path)))
}

function unlinkSync (path) {
  return new Promise((resolve) => resolve(sander.unlinkSync(path)))
}

module.exports = {
  init: function initializeFileSystem () {
    return {
      readCSONSync,
      writeCSONSync,
      readdirSync,
      mkdirSync,
      statSync,
      unlinkSync
    }
  },
  label: 'File System',
  settings: {
    location: {
      label: 'Location',
      required: true,
      type: 'file'
    }
  },
  type: TYPE
}
