const resolveStorageData = require('./resolveStorageData')
const path = require('path')
const attachmentManagement = require('./attachmentManagement')
const { findStorage } = require('browser/lib/findStorage')
const fileSystem = require('./adapter')

function deleteNote (storageKey, noteKey) {
  let targetStorage
  try {
    targetStorage = findStorage(storageKey)
  } catch (e) {
    return Promise.reject(e)
  }

  const fs = fileSystem.getStorageAdapter(targetStorage)

  return resolveStorageData(targetStorage)
    .then(function deleteNoteFile (storage) {
      const notePath = path.join(storage.path || '', 'notes', noteKey + '.cson')

      return fs.unlinkSync(notePath)
        .catch(err => console.warn('Failed to delete note cson', err))
        .then(() => ({ noteKey, storageKey }))
    })
    .then(function deleteAttachments (storageInfo) {
      attachmentManagement.deleteAttachmentFolder(storageInfo.storageKey, storageInfo.noteKey)
      return storageInfo
    })
}

module.exports = deleteNote
