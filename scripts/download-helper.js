const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
const path = require('path');
const tar = require('tar');
const sha384 = require('sha384');

// TODO: Change URL from fork to @runk's repo (and master branch)
const link = file => `https://raw.githubusercontent.com/GitSquared/node-geolite2/new-eula-redistribution/redist/${file}`;

const editions = [
  { name: 'GeoLite2-ASN' },
  { name: 'GeoLite2-City' },
  { name: 'GeoLite2-Country' }
].map(edition => {
  edition.dbURL = link(edition.name+'.tar.gz');
  edition.checksumURL = link(edition.name+'.mmdb.sha384');
  return edition;
});

function fetchChecksums() {
  let downloads = editions.map(edition => {
    return new Promise(resolve => {
      https.get(edition.checksumURL, res => {
        let checksum = '';
        res.on('data', chunk => {
          checksum = checksum+chunk.toString();
        });
        res.on('end', () => {
          checksum = checksum.trim();
          if (!res.complete || checksum.length !== 96) throw new Error(`Could not fetch checksum for ${edition.name}\n\nReceived:\n${checksum}`);
          edition.checksum = checksum;
          resolve();
        });
      });
    });
  });

  return Promise.all(downloads);
}

function fetchDatabases(outPath) {
  const fetch = url => new Promise(resolve => {
     https.get(url, res => {
        try {
          resolve(res.pipe(zlib.createGunzip({})).pipe(tar.t()));
        } catch(e) {
          throw new Error(`Could not fetch ${url}\n\nError:\n${e}`);
        }
      });
  });

  let downloads = editions.map(edition => {
    return new Promise(resolve => {
      fetch(edition.dbURL).then(res => {
        res.on('entry', entry => {
          if (entry.path.endsWith('.mmdb')) {
            const dstFilename = path.join(outPath, path.basename(entry.path));
            entry.pipe(fs.createWriteStream(dstFilename));
          }
        });
        res.on('error', e => {
          reject(e);
        });
        res.on('finish', () => {
          resolve();
        });
      });
    });
  });

  return Promise.all(downloads);
}

function verifyAllChecksums(downloadPath) {
  let promises = editions.map(edition => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(downloadPath, edition.name+'.mmdb'), (err, buffer) => {
        if (err) reject(err);
        if (sha384(buffer).toString('hex') === edition.checksum) {
          resolve();
        } else {
          reject(new Error(`Mismatched checksums for ${edition.name}`));
        }
      });
    });
  });

  return Promise.all(promises);
}

module.exports = {
  fetchChecksums,
  fetchDatabases,
  verifyAllChecksums,
  getEditions: () => {
    return editions;
  }
};
