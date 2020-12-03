const fs = require('fs');
const path = require('path');

const downloadHelper = require('./download-helper.js');

const downloadPath = path.join(__dirname, '..', 'dbs');
if (!fs.existsSync(downloadPath)) {
	fs.mkdirSync(downloadPath);
}

console.log('Downloading MaxMind databases from mirror...');
downloadHelper.fetchChecksums().then(() => {
	return downloadHelper.fetchDatabases(downloadPath);
}).then(() => {
	return downloadHelper.verifyAllChecksums(downloadPath);
}).catch(error => {
	throw error;
});
