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

class UpdateSubscriber extends EventEmitter {
  constructor() {
    super();

    this.downloading = false;

    this._checker = setInterval(() => {
      this.checkUpdates();
    }, updateTimer);
    this.checkUpdates();

    return this;
  }

  async checkUpdates() {
    // leave time for listeners to be up
    await this._wait(200);

    this.emit('checking');
    downloadHelper.fetchChecksums().then(() => {
      return downloadHelper.verifyAllChecksums(downloadPath);
    }).then(() => {
      // All checksums match, no update
    }).catch(() => {
      this.update();
    });
  }

  update() {
    if (this.downloading) return false;
    this.downloading = true;
    this.emit('downloading');

    downloadHelper.fetchDatabases(downloadPath).then(() => {
      return downloadHelper.verifyAllChecksums(downloadPath);
    }).then(() => {
      this.emit('update', downloadHelper.getEditions());
    }).catch(e => {
      console.warn('geolite2 self-update error: ', e);
    }).finally(() => {
      this.downloading = false;
    });
  }

  async triggerUpdate() {
    await this._wait(100);

    downloadHelper.fetchChecksums().then(() => {
      return downloadHelper.verifyAllChecksums(downloadPath);
    }).then(() => {
      this.update();
    }).catch(e => {
      console.warn('geolite2 self-update error: ', e);
    });
  }

  close() {
    clearInterval(this._checker);
  }

  _wait(x) {
    return new Promise(resolve => {
      setTimeout(resolve, x);
    });
  }
}

function wrapReader(reader, readerBuilder, db) {
  let proxyObject = {
    reader,
    database: db,
    lastUpdateCheck: 0,
    subscriber: null
  };

  return new Proxy(proxyObject, {
    get: (proxyObject, prop) => {
      if (!proxyObject.subscriber) {
        proxyObject.subscriber = new UpdateSubscriber();

        proxyObject.subscriber.on('update', async () => {
          proxyObject.reader = await readerBuilder(paths[proxyObject.database]);
        });

        proxyObject.subscriber.on('checking', () => {
          proxyObject.lastUpdateCheck = Date.now();
        });
      }

      if (Date.now() - proxyObject.lastUpdateCheck > updateTimer || prop === '_geolite2_triggerUpdateCheck') {
        proxyObject.subscriber.checkUpdates();
        if (prop === '_geolite2_triggerUpdateCheck') return 'OK';
      }

      if (prop === '_geolite2_triggerUpdate') {
        proxyObject.subscriber.triggerUpdate();
        return 'OK';
      }

      if (prop === '_geolite2_subscriber') {
        return proxyObject.subscriber;
      }

      if (prop === 'close') {
        proxyObject.subscriber.close();
        proxyObject.reader = {};
        return () => {
          return true;
        };
      }

      return proxyObject.reader[prop];
    },
    set: (proxyObject, prop, value) => {
      proxyObject.reader[prop] = value;
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
        resolve(wrapReader(r, readerBuilder, database));
      }).catch(e => {
        throw e;
      });
    });
  } else {
    return wrapReader(reader, readerBuilder, database);
  }
}

module.exports = {
  open,
  UpdateSubscriber,
  paths
};
