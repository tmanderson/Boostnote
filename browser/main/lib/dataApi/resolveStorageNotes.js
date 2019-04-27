const path = require('path')

const fileSystem = require('./adapter')

function resolveStorageNotes (storage) {
  const notesDirPath = path.join(storage.path || '', 'notes')

  const fs = fileSystem.getStorageAdapter(storage)

  return fs.readdirSync(notesDirPath)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return fs.mkdirSync(notesDirPath).then(() => [])
      }

      throw new Error('File storage could not be resolved')
    })
    .then(notePathList =>
      Promise.all(
        notePathList
          .filter(function filterOnlyCSONFile (notePath) {
            return /\.cson$/.test(notePath)
          })
          .map(function parseCSONFile (notePath) {
            return fs.readCSONSync(path.join(notesDirPath, notePath))
              .then((data) => [notePath, data])
          })
      ).then(notes =>
          notes.map(([notePath, data]) => {
            data.key = path.basename(notePath, '.cson')
            data.storage = storage.key
            return data
          })
          .filter(function filterOnlyNoteObject (noteObj) {
            return typeof noteObj === 'object'
          })
      )
    )
}

module.exports = resolveStorageNotes
