const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const downloadHelper = require('./scripts/download-helper.js');
const downloadPath = path.resolve(__dirname, 'dbs');

const updateTimer = 2 * 24 * 60 * 60 * 1000; // 48 hours in ms

const paths = {
    'GeoLite2-ASN': path.join(downloadPath, 'GeoLite2-ASN.mmdb'),
    'GeoLite2-City': path.join(downloadPath, 'GeoLite2-City.mmdb'),
    'GeoLite2-Country': path.join(downloadPath, 'GeoLite2-Country.mmdb')
};

function wrapReader(reader, readerBuilder) {
  reader.lastUpdateCheck = 0;
  reader.downloading = false;

  return new Proxy(reader, {
    get: (reader, prop) => {
      if (Date.now() - reader.lastUpdateCheck > updateTimer || prop === 'triggerUpdate') {
        reader.lastUpdateCheck = Date.now();
        downloadHelper.fetchChecksums().then(() => {
          return downloadHelper.verifyAllChecksums(downloadPath);
        }).then(() => {
          // All checksums match
        }).catch(() => {
          reader.downloading = true;
          downloadHelper.fetchDatabases(downloadPath).then(() => {
            return downloadHelper.verifyAllChecksums(downloadPath);
          }).then(async () => {
            reader = await readerBuilder(paths[reader.metadata.databaseType]);
          }).catch(e => {
            console.warn('geolite2 self-update error: ', e);
          }).finally(() => {
            reader.downloading = false;
          });
        });
      }
      return reader[prop];
    }
  });
}

function open(database, readerBuilder) {
  if (!downloadHelper.getEditions().find(e => e.name === database)) throw new Error(`No database named ${database}`);
  if (typeof readerBuilder !== 'function') throw new Error('No database reader provided');

  let reader = readerBuilder(paths[database]);

  if (typeof reader.then === 'function') {
    return new Promise((resolve, reject) => {
      reader.then(r => {
        resolve(wrapReader(r, readerBuilder));
      }).catch(e => {
        throw e;
      });
    });
  } else {
    return wrapReader(reader, readerBuilder);
  }
}

module.exports = {
  open
};
