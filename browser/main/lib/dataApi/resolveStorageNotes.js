const path = require('path')

const fileSystem = require('./adapter')

function resolveStorageNotes (storage) {
  const notesDirPath = path.join(storage.path, 'notes')

  const fs = fileSystem.getStorageAdapter(storage)

  return fs.readdirSync(notesDirPath)
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
        notes
          .map(([notePath, data]) => Object.assign(data, {
            key: path.basename(notePath, '.cson'),
            storage: storage.key
          }))
          .filter(function filterOnlyNoteObject (noteObj) {
            return typeof noteObj === 'object'
          })
        ),
      err => {
        if (err.code === 'ENOENT') {
          return fs.mkdirSync(notesDirPath).then(() => [])
        }

        throw new Error('File storage could not be resolved')
      }
    )
}

module.exports = resolveStorageNotes
