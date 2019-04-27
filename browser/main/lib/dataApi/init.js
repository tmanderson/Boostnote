'use strict'
const _ = require('lodash')
const resolveStorageData = require('./resolveStorageData')
const resolveStorageNotes = require('./resolveStorageNotes')
const consts = require('browser/lib/consts')
const path = require('path')

const fileSystem = require('./adapter')
/**
 * @return {Object} all storages and notes
 * ```
 * {
 *   storages: [...],
 *   notes: [...]
 * }
 * ```
 *
 * This method deals with 3 patterns.
 * 1. v1
 * 2. legacy
 * 3. empty directory
 */

function init () {
  const fetchStorages = function () {
    let rawStorages

    try {
      rawStorages = JSON.parse(window.localStorage.getItem('storages'))
      // Remove storages who's location is inaccesible.
      rawStorages = rawStorages.filter(storage => {
        const fs = fileSystem.getStorageAdapter(storage)
        return fs.existsSync(storage.path)
      })
      if (!_.isArray(rawStorages)) throw new Error('Cached data is not valid.')
    } catch (e) {
      console.warn('Failed to parse cached data from localStorage', e)
      rawStorages = []
      window.localStorage.setItem('storages', JSON.stringify(rawStorages))
    }

    return Promise.all(rawStorages.map(resolveStorageData))
  }

  const storageExists = function (storage) {
    const fs = fileSystem.getStorageAdapter(storage)
    return fs.existsSync(storage.path).then(exists => exists ? storage : null)
  }

  const fetchNotes = function (storages) {
    return Promise.all(storages.map(storageExists))
      .then(existingStorages => existingStorages.filter(storage => !!storage))
      .then(storages => Promise.all(
        storages.map((storage) => {
          const fs = fileSystem.getStorageAdapter(storage)

          return resolveStorageNotes(storage)
            .then((notes) => {
              let unknownCount = 0

              notes.forEach((note) => {
                if (note && !storage.folders.some((folder) => note.folder === folder.key)) {
                  unknownCount++
                  storage.folders.push({
                    key: note.folder,
                    color: consts.FOLDER_COLORS[(unknownCount - 1) % 7],
                    name: 'Unknown ' + unknownCount
                  })
                }
              })

              if (unknownCount > 0) {
                return fs.writeCSONSync(
                  path.join(storage.path, 'boostnote.json'),
                  _.pick(storage, ['folders', 'version'])
                ).then(() => notes)
              }

              return notes
            })
        })
      )).then(function concatNoteGroup (noteGroups) {
        return noteGroups.reduce(function (sum, group) {
          return sum.concat(group)
        }, [])
      })
      .then(function returnData (notes) {
        return {
          storages,
          notes
        }
      })
  }

  return fetchStorages()
    .then((storages) => {
      return storages
        .filter((storage) => {
          if (!_.isObject(storage)) return false
          return true
        })
    })
    .then(fetchNotes)
}
module.exports = init
