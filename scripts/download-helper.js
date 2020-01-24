const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const zlib = require('zlib');
const path = require('path');
const tar = require('tar');

const link = file => `https://raw.githubusercontent.com/GitSquared/node-geolite2-redist/master/redist/${file}`;

const editions = [
	{name: 'GeoLite2-ASN'},
	{name: 'GeoLite2-City'},
	{name: 'GeoLite2-Country'}
].map(edition => {
	edition.dbURL = link(edition.name + '.tar.gz');
	edition.checksumURL = link(edition.name + '.mmdb.sha384');
	return edition;
});

function fetchChecksums() {
	const newChecksums = [];

	const downloads = editions.map(edition => {
		return new Promise((resolve, reject) => {
			https.get(edition.checksumURL, res => {
				let checksum = '';
				res.on('error', error => {
					reject(error);
				});
				res.on('data', chunk => {
					checksum += chunk.toString();
				});
				res.on('end', () => {
					checksum = checksum.trim();
					if (!res.complete || checksum.length !== 96) {
						throw new Error(`Could not fetch checksum for ${edition.name}\n\nReceived:\n${checksum}`);
					}

					newChecksums.push({
						name: edition.name,
						checksum
					});
					resolve();
				});
			});
		});
	});

	return new Promise((resolve, reject) => {
		Promise.all(downloads).then(() => {
			if (newChecksums.length === editions.length) {
				newChecksums.forEach(sum => {
					editions[editions.findIndex(e => e.name === sum.name)].checksum = sum.checksum;
				});
				resolve();
			} else {
				reject();
			}
		}).catch(error => {
			reject(error);
		});
	});
}

function fetchDatabases(outPath) {
	const fetch = url => new Promise(resolve => {
		https.get(url, res => {
			try {
				resolve(res.pipe(zlib.createGunzip({})).pipe(tar.t()));
			} catch (error) {
				throw new Error(`Could not fetch ${url}\n\nError:\n${error}`);
			}
		});
	});

	const downloads = editions.map(edition => {
		return new Promise((resolve, reject) => {
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
	const promises = editions.map(edition => {
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(downloadPath, edition.name + '.mmdb'), (err, buffer) => {
				if (err) {
					reject(err);
				}

				const checksum = crypto.createHash('sha384').update(buffer, 'binary', 'hex').digest('hex');
				if (checksum === edition.checksum) {
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
