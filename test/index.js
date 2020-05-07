const assert = require('assert');
const fs = require('fs');
const geolite2 = require('../');
const rimraf = require('rimraf');
const maxmind = require('maxmind');

describe('geolite2', function() {
  it('should contain a valid ASN db', function() {
    let stat = fs.statSync(geolite2.paths['GeoLite2-ASN']);
    assert(stat.size > 1e6);
    assert(stat.ctime);
  });

  it('should contain a valid country db', function() {
    let stat = fs.statSync(geolite2.paths['GeoLite2-Country']);
    assert(stat.size > 1e6);
    assert(stat.ctime);
  });

  it('should contain a valid city db', function() {
    let stat = fs.statSync(geolite2.paths['GeoLite2-City']);
    assert(stat.size > 1e6);
    assert(stat.ctime);
  });
});

describe('geolite2.UpdateSubscriber', function() {
  let updateSubscriber = null;
  this.timeout(10000);

  describe('#constructor()', function() {
    it('should check updates on init', function() {
      return new Promise((resolve, reject) => {
        updateSubscriber = new geolite2.UpdateSubscriber();
        updateSubscriber.once('checking', () => {
          resolve();
        });
      });
    });
  });

  describe('#checkUpdates()', function() {
    it('should be able to check updates again', function() {
      return new Promise((resolve, reject) => {
        updateSubscriber.once('done checking', () => {
          updateSubscriber.checkUpdates();
          updateSubscriber.once('checking', () => {
            resolve();
          });
        });
      });
    });
  });

  describe('#update()', function() {
    it('should be able to download new databases', function() {
      this.timeout(5 * 60 * 1000); // 5 minutes timeout for download
      return new Promise((resolve, reject) => {
        if (updateSubscriber.downloading) {
          // Previous tests have already started a download, mirror has available updates
          updateSubscriber.once('update', () => {
            resolve();
          });
        } else {
          // Trigger download
          updateSubscriber.once('done checking', () => {
            rimraf(require('path').resolve(__dirname, '../dbs'), e => {
              if (e) throw(e);
              updateSubscriber.checkUpdates();
              updateSubscriber.once('downloading', () => {
                updateSubscriber.once('update', () => {
                  resolve();
                });
              });
            });
          });
        }
      });
    });

    it('should retrieve a valid ASN db', function() {
      updateSubscriber.close();

      let stat = fs.statSync(geolite2.paths['GeoLite2-ASN']);
      assert(stat.size > 1e6);
      assert(stat.ctime);
    });

    it('should retrieve a valid country db', function() {
      let stat = fs.statSync(geolite2.paths['GeoLite2-Country']);
      assert(stat.size > 1e6);
      assert(stat.ctime);
    });

    it('should retrieve a valid city db', function() {
      let stat = fs.statSync(geolite2.paths['GeoLite2-City']);
      assert(stat.size > 1e6);
      assert(stat.ctime);
    });
  });
});

describe('geolite2.open', function() {
  describe('Async', function() {
    let lookup = null;

    it('should open a database asynchronously', async function() {
      lookup = await geolite2.open('GeoLite2-ASN', path => {
        return maxmind.open(path);
      });

      assert(typeof lookup === 'object');
    });

    it('should proxy getters to a valid db reader', function() {
      assert(typeof lookup.get('8.8.8.8') === 'object');
    });

    it('should pass queries to a subscriber instance', function() {
      this.timeout(10000);
      return new Promise((resolve, reject) => {
        assert(lookup._geolite2_triggerUpdateCheck === 'OK');
        lookup._geolite2_subscriber.once('checking', () => {
          resolve();
        });
      });
    });

    it('should replace the db reader on updates', function() {
      this.timeout(5 * 60 * 1000);

      lookup._test_reader_replacement = 'control';

      return new Promise((resolve, reject) => {
        rimraf(require('path').resolve(__dirname, '../dbs'), e => {
          if (e) throw(e);
          assert(lookup._geolite2_triggerUpdateCheck === 'OK');
          lookup._geolite2_subscriber.once('update', () => {
            setTimeout(() => {
              if (lookup._test_reader_replacement === 'control') {
                reject(new Error('Reader instance wasn\'t updated'));
              } else {
                resolve();
              }
            }, 500);
          });
        });
      });
    });

    it('should close gracefully', function() {
      assert(lookup.close() === true);
      assert(!lookup.get);
    });
  });

  describe('Sync', function() {
    let lookup = null;

    it('should open a database synchronously', function() {
      lookup = geolite2.open('GeoLite2-ASN', path => {
        let buf = fs.readFileSync(path);
        return new maxmind.Reader(buf);
      });

      assert(typeof lookup === 'object');
    });

    it('should proxy getters to a valid db reader', function() {
      assert(typeof lookup.get('8.8.8.8') === 'object');
    });

    it('should pass queries to a subscriber instance', function() {
      this.timeout(10000);
      return new Promise((resolve, reject) => {
        assert(lookup._geolite2_triggerUpdateCheck === 'OK');
        lookup._geolite2_subscriber.once('checking', () => {
          resolve();
        });
      });
    });

    it('should replace the db reader on updates', function() {
      this.timeout(5 * 60 * 1000);

      lookup._test_reader_replacement = 'control';

      return new Promise((resolve, reject) => {
        rimraf(require('path').resolve(__dirname, '../dbs'), e => {
          if (e) throw(e);
          assert(lookup._geolite2_triggerUpdateCheck === 'OK');
          lookup._geolite2_subscriber.once('update', () => {
            setTimeout(() => {
              if (lookup._test_reader_replacement === 'control') {
                reject(new Error('Reader instance wasn\'t updated'));
              } else {
                resolve();
              }
            }, 500);
          });
        });
      });
    });

    it('should close gracefully', function() {
      assert(lookup.close() === true);
      assert(!lookup.get);
    });
  });
});

