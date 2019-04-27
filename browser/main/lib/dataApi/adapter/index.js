const fileSystem = require('./fileSystem')
const s3 = require('./s3')

module.exports.getStorageAdapter = function getAdapterForType (storage) {
  switch (storage.type) {
    case fileSystem.type:
      return fileSystem.init(storage)
    case s3.type:
      return s3.init(storage)
    default: return fileSystem.init(storage)
  }
}

module.exports.adapters = {
  [fileSystem.type]: fileSystem,
  [s3.type]: s3
}
