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

  // TODO: consider returning the adapter as a property on the storage
  const fs = fileSystem.getStorageAdapter(storage)

  return fs.readCSONSync(boostnoteJSONPath)
    .catch(err => {
      console.error(err)
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
      const updatedStorage = Object.assign(storage, jsonData)
      const version = parseInt(updatedStorage.version, 10)

      if (version >= 1) {
        return Promise.resolve(updatedStorage)
      }

      return migrateFromV6Storage(updatedStorage.path).then(() => updatedStorage)
    })
}

module.exports = resolveStorageData
