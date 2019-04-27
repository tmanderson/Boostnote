const _ = require('lodash')
const AWS = require('aws-sdk')

const TYPE = 'S3'

function promiseHandler (method, args) {
  return new Promise(function (resolve, reject) {
    method(args, function (err, data) {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

module.exports = {
  init: function initializeS3 (storage) {
    if (!_.has(storage.settings, 'accessKeyId')) {
      return console.error('An access key is required')
    }

    if (!_.has(storage.settings, 'secretAccessKey')) {
      return console.error('A secret access key is required')
    }

    AWS.config.credentials = new AWS.Credentials({
      accessKeyId: storage.settings.accessKeyId,
      secretAccessKey: storage.settings.secretAccessKey
    })

    const S3 = new AWS.S3({
      apiVersion: '2016-03-01'
    })

    S3.listObjectsV2({
      Bucket: storage.settings.bucketName
    }, function (err, data) {
      if (err) {
        console.error('S3 credentials incorrect')
        console.log(err)
      }
    })

    function readCSONSync (path) {
      console.log(`[S3]: Getting data at ${path}`)

      return promiseHandler(
        S3.getObject.bind(S3),
        {
          Bucket: storage.settings.bucketName,
          Key: path
        }
      ).then(res => {
        console.log(`[S3]: Got data at ${path}`)
        return JSON.parse(res.Body.toString('utf8'))
      })
    }

    function writeCSONSync (path, data) {
      console.log(`[S3]: Writing data to ${path}`)
      return promiseHandler(
        S3.putObject.bind(S3),
        {
          Bucket: storage.settings.bucketName,
          Key: path,
          Body: JSON.stringify(data)
        }
      ).then(() => {
        console.log(`[S3]: Saved data to ${path}`)
        console.log(data)
        return data
      })
    }

    function readdirSync (path) {
      console.log(`[S3]: Reading ${path}`)
      return promiseHandler(
        S3.listObjects.bind(S3),
        {
          Bucket: storage.settings.bucketName,
          Prefix: path
        }
      ).then(res => {
        console.log(`[S3]: Got directory with prefix ${path}`)
        console.log(res)
        return res.Contents.map(obj => obj.Key.replace(path, ''))
      })
    }

    function mkdirSync (path) {
      console.log(`[S3]: Making directory at ${path}`)
      return promiseHandler(
        S3.putObject.bind(S3),
        {
          Bucket: storage.settings.bucketName,
          Key: path
        }
      ).then(() => console.log(`[S3]: Saved data to ${path}`))
    }

    function statSync (path) {
      return promiseHandler(
        S3.getObject.bind(S3),
        {
          Bucket: storage.settings.bucketName,
          Key: path
        }
      )
    }

    function unlinkSync (path) {
      console.log(`Deleting files at ${path}`);

      return promiseHandler(
        S3.listObjects.bind(S3),
        {
          Bucket: storage.settings.bucketName,
          Prefix: path
        }
      ).then(res =>
        promiseHandler(
          S3.deleteObjects.bind(S3),
          {
            Bucket: storage.settings.bucketName,
            Delete: {
              Objects: res.Contents.filter(obj => ({ Key: obj.Key }))
                .concat([{ Key: path }])
            }
          }
        )
      ).then(res => {
        console.log('Delete files')
        console.log(res)
        return res
      })
    }

    return {
      readCSONSync,
      writeCSONSync,
      readdirSync,
      mkdirSync,
      statSync,
      unlinkSync
    }
  },
  label: 'Amazon S3',
  path: '',
  settings: {
    bucketName: {
      label: 'Bucket Name',
      description: 'The name of your AWS S3 bucket',
      required: true,
      type: 'text'
    },
    accessKeyId: {
      label: 'Access Key',
      description: 'Your AWS IAM access key',
      required: true,
      type: 'text'
    },
    secretAccessKey: {
      label: 'Secret Access Key',
      description: 'Your AWS IAM secret access key',
      required: true,
      type: 'text'
    }
  },
  type: TYPE
}
