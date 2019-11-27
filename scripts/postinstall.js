const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
var path = require("path");
var tar = require("tar");

const files = [
  "https://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz",
  "https://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.tar.gz",
  "https://geolite.maxmind.com/download/geoip/database/GeoLite2-ASN.tar.gz",
];

/**
 * 
 * @param {string} url - Url
 * @returns {stream} - uncompressed result stream
 */
const readGzFile = url => new Promise(resolve => {
  https.get(url, function(response) {
    resolve(response.pipe(zlib.createGunzip({})));
  });
});

files.map(fileSrc => readGzFile(fileSrc)
    .then((result) => result.pipe(tar.t())
      .on('entry', entry => {
        if(entry.path.endsWith('.mmdb')) {
          const dstFilename = `./dbs/${path.basename(entry.path)}`;
          entry.pipe(fs.createWriteStream(dstFilename));
        }
      })
    )
  );


