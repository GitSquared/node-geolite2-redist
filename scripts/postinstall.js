const fs = require("fs");
const https = require("https");
const zlib = require("zlib");
const path = require("path");
const tar = require("tar");

const links = [
  "https://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz",
  "https://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.tar.gz",
  "https://geolite.maxmind.com/download/geoip/database/GeoLite2-ASN.tar.gz"
];

const downloadPath = path.join(__dirname, "..", "dbs");

if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

const download = url =>
  new Promise(resolve => {
    https.get(url, function(response) {
      resolve(response.pipe(zlib.createGunzip({})));
    });
  });

console.log("Downloading maxmind databases...");
links.forEach(url =>
  download(url).then(result =>
    result.pipe(tar.t()).on("entry", entry => {
      if (entry.path.endsWith(".mmdb")) {
        const dstFilename = path.join(downloadPath, path.basename(entry.path));
        entry.pipe(fs.createWriteStream(dstFilename));
      }
    })
  )
);
