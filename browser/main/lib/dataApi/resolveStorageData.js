const _ = require('lodash')
const path = require('path')
const migrateFromV6Storage = require('./migrateFromV6Storage')

const fileSystem = require('./adapter')

function resolveStorageData (storageCache) {
  const storage = {
    key: storageCache.key,
    name: storageCache.name,
    type: storageCache.type,
    path: storageCache.path,
    isOpen: storageCache.isOpen,
    settings: storageCache.settings
  }

  const boostnoteJSONPath = storageCache.path
    ? path.join(storageCache.path, 'boostnote.json')
    : 'boostnote.json'

  const fs = fileSystem.getStorageAdapter(storage)

  return fs.readCSONSync(boostnoteJSONPath)
    .catch(() => {
      console.log('WHY DID WE FAIL??')
      return fs.writeCSONSync(boostnoteJSONPath, {folders: [], version: '1.0'})
    })
    .then(jsonData => console.log(jsonData) ||
      !_.isArray(jsonData.folders)
        ? fs.writeCSONSync(
            boostnoteJSONPath,
            Object.assign({}, jsonData, {
              folders: _.get(jsonData, 'folders', []),
              version: '1.0'
            })
          )
        : jsonData
    )
    .then(jsonData => {
      Object.assign(storage, jsonData)
      const version = parseInt(storage.version, 10)

      if (version >= 1) {
        return Promise.resolve(storage)
      }

      return migrateFromV6Storage(storage.path).then(() => storage)
    })
}

module.exports = resolveStorageData
