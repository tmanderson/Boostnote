const _ = require('lodash')
const keygen = require('browser/lib/keygen')
const path = require('path')
const resolveStorageData = require('./resolveStorageData')
const { findStorage } = require('browser/lib/findStorage')
const fileSystem = require('./adapter')

/**
 * @param {String} storageKey
 * @param {Object} input
 * ```
 * {
 *   color: String,
 *   name: String
 * }
 * ```
 *
 * @return {Object}
 * ```
 * {
 *   storage: Object
 * }
 * ```
 */
function createFolder (storageKey, input) {
  let targetStorage

  try {
    if (input == null) throw new Error('No input found.')
    if (!_.isString(input.name)) throw new Error('Name must be a string.')
    if (!_.isString(input.color)) throw new Error('Color must be a string.')

    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  const fs = fileSystem.getStorageAdapter(targetStorage)

  return resolveStorageData(targetStorage)
    .then(function createFolder (storage) {
      let key = keygen()

      while (storage.folders.some((folder) => folder.key === key)) {
        key = keygen()
      }

      const newFolder = {
        key,
        color: input.color,
        name: input.name
      }

      storage.folders.push(newFolder)

      return fs.writeCSONSync(
        path.join(storage.path, 'boostnote.json'),
        _.pick(storage, ['folders', 'version'])
      ).then(() => ({
        storage
      }))
    })
}

module.exports = createFolder
