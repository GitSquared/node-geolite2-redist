const fs = require("fs");
const https = require("https");
const zlib = require("zlib");
const path = require("path");
const tar = require("tar");

const licenseKey = process.env.MAXMIND_LICENSE_KEY;
if (!licenseKey) {
  console.error(`Error: License key is not configured.\n
  You need to signup for a _free_ Maxmind account to get a license key.
  Go to https://www.maxmind.com/en/geolite2/signup, obtain your key and
  put it in the MAXMIND_LICENSE_KEY environment variable\n`);
  process.exit(1);
}

const link = edition =>
  `https://download.maxmind.com/app/geoip_download?edition_id=${edition}&license_key=${licenseKey}&suffix=tar.gz`;

const links = [
  link('GeoLite2-City'),
  link('GeoLite2-Country'),
  link('GeoLite2-ASN'),
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
