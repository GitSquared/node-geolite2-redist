const path = require('path');
const fs = require('fs');
const {EventEmitter} = require('events');
const rimraf = require('rimraf');

const downloadHelper = require('./scripts/download-helper.js');
let downloadPath = path.resolve(__dirname, 'dbs');

const updateTimer = 2 * 24 * 60 * 60 * 1000; // 48 hours in ms

let paths = {
	'GeoLite2-ASN': path.join(downloadPath, 'GeoLite2-ASN.mmdb'),
	'GeoLite2-City': path.join(downloadPath, 'GeoLite2-City.mmdb'),
	'GeoLite2-Country': path.join(downloadPath, 'GeoLite2-Country.mmdb')
};

class UpdateSubscriber extends EventEmitter {
	constructor() {
		super();

		this.downloading = false;
		this.checking = false;

		this._checker = setInterval(() => {
			this.checkUpdates();
		}, updateTimer);
		this.checkUpdates();

		// Clean up failed download files
		rimraf(downloadPath+'-tmp', _ => {
			// folder did not exist
		});

		return this;
	}

	async checkUpdates() {
		if (this.checking) {
			return;
		}

		this.checking = true;

		try {
			// Leave time for listeners to be up
			await this._wait(200);

			this.emit('checking');
			try {
				await downloadHelper.fetchChecksums();
				await downloadHelper.verifyAllChecksums(downloadPath);
				this.emit('up-to-date');
			} catch (ex) {
				await this.update();
			};
		}
		finally {
			this.checking = false;
			this.emit('done checking');
		}
	}

	// Backward compat
	triggerUpdate() {
		console.warn('geolite2-redist: triggerUpdate() is deprecated');
		return Promise.resolve();
	}

	update() {
		return new Promise(resolve => {
			if (this.downloading) {
				resolve(false);
			}

			this.downloading = true;
			this.emit('downloading');

			fs.mkdir(downloadPath+'-tmp', () => {
				downloadHelper.fetchDatabases(downloadPath+'-tmp').then(() => {
					return downloadHelper.verifyAllChecksums(downloadPath+'-tmp');
				}).then(() => {
					rimraf(downloadPath, e => {
						if (e) throw(e);
						fs.rename(downloadPath+'-tmp', downloadPath, e => {
							if (e) throw(e);
							this.emit('update', downloadHelper.getEditions());
						});
					});
				}).catch(error => {
					console.warn('geolite2 self-update error:', error);
					rimraf(downloadPath+'-tmp', _ => {
						// no junk to clean up
					});
				}).finally(() => {
					this.downloading = false;
					resolve()
				});
			});
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
	const subscriber = new UpdateSubscriber();
	subscriber.on('update', async () => {
		reader = await readerBuilder(paths[db]);
	});

	return new Proxy({}, {
		get: (_, prop) => {
			switch (prop) {
				case '_geolite2_triggerUpdateCheck':
					subscriber.checkUpdates();
					return 'OK';

				case '_geolite2_triggerUpdate':
					// Keep this in for backward compat
					return 'OK';

				case '_geolite2_subscriber':
					return subscriber;

				case 'close':
					return () => {
						subscriber.close();
						reader = {};
						return true;
					};

				default:
					return reader[prop];
			}
		},
		set: (_, prop, value) => {
			switch (prop) {
				case '_geolite2_triggerUpdateCheck':
				case '_geolite2_triggerUpdate':
				case '_geolite2_subscriber':
				case 'close':
					throw new Error('Invalid property setter');

				default:
					reader[prop] = value;
					break;
			}
		}
	});
}

function open(database, readerBuilder) {
	if (!downloadHelper.getEditions().find(e => e.name === database)) {
		throw new Error(`No database named ${database}`);
	}

	if (typeof readerBuilder !== 'function') {
		throw new TypeError('No database reader provided');
	}

	const reader = readerBuilder(paths[database]);

	if (typeof reader.then === 'function') {
		return new Promise(resolve => {
			reader.then(r => {
				resolve(wrapReader(r, readerBuilder, database));
			}).catch(error => {
				throw error;
			});
		});
	}

	return wrapReader(reader, readerBuilder, database);
}

function downloadDbs(newpath) {
	downloadPath = path.resolve(__dirname, 'dbs')
	if (newpath) downloadPath = path.resolve(newpath);
	if (!fs.existsSync(downloadPath)) {
		fs.mkdirSync(downloadPath, { resursive: true })
	}
	paths = {
		'GeoLite2-ASN': path.join(downloadPath, 'GeoLite2-ASN.mmdb'),
		'GeoLite2-City': path.join(downloadPath, 'GeoLite2-City.mmdb'),
		'GeoLite2-Country': path.join(downloadPath, 'GeoLite2-Country.mmdb')
	};

	return new Promise(resolve => {
		const us = new UpdateSubscriber()
		us.once('up-to-date', () => {
			// Databases are already good
			us.close()
			resolve()
		})
		us.once('update', () => {
			us.close()
			resolve()
		})
		us.checkUpdates()
	})
}

module.exports = {
	open,
	downloadDbs,
	UpdateSubscriber,
	databases: [
		'GeoLite2-ASN',
		'GeoLite2-City',
		'GeoLite2-Country'
	],
	downloadPath
};
