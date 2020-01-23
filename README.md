# node-geolite2-redist

[![Build Status](https://travis-ci.com/GitSquared/node-geolite2-redist.svg?token=6oyzeLqWVCTbE2R5reLd&branch=master)](https://travis-ci.org/GitSquared/node-geolite2-redist) ![NPM published version](https://badgen.net/npm/v/geolite2-redist) ![Node version](https://badgen.net/npm/node/geolite2-redist) ![Types Status](https://badgen.net/npm/types/geolite2-redist) ![Install size](https://badgen.net/packagephobia/install/geolite2-redist)

---

MaxMind's GeoLite2 free databases as an npm library. **As this is a redistribution, you don't need a MaxMind license key.** However, additional restrictions apply, and while they should be transparent to most users, **you should read this README and the LICENSE file carefully before deciding to use this.**

You will need a database reader capable of reading `.mmdb` files, like [node-maxmind](https://www.npmjs.com/package/maxmind), if you wish to use the data.

This package contains the 3 GeoLite2 databases, namely:
 - `GeoLite2-ASN`
 - `GeoLite2-Country`
 - `GeoLite2-City`

For more info check out the [MaxMind website](https://maxmind.com).

Due to license requirements, **this package automatically updates the databases in the background** when it detects that a new version is available.

See [Warning](#warning) section for more info.

## Usage

### Using the geoip data

Example geoip lookup, using the `GeoLite2-City` database with `node-maxmind` as a db reader:

#### Async
```javascript
const geolite2 = require('geolite2-redist');

const maxmind = require('maxmind');

(async () => {
  let lookup = await geolite2.open('GeoLite2-City', path => {
    return maxmind.open(path);
  });

  let city = lookup.get('66.6.44.4');

  // Call this when done to empty node's event loop
  lookup.close();
})();
```

#### Sync

```javascript
const geolite2 = require('geolite2-redist');

const maxmind = require('maxmind');
const fs = require('fs');

let lookup = geolite2.open('GeoLite2-City', path => {
  let buf = fs.readFileSync(path);
  return new maxmind.Reader(buf);
});

let city = lookup.get('66.6.44.4');

lookup.close();
```

### Advanced usage

If you do not consume the databases directly, or need more flexible methods, the internal `geolite2.UpdateSubscriber` class is exposed so you can directly listen to database update events.

Example usage:
```javascript
const geolite2 = require('geolite2-redist');

function useGeolite() {
  // You can retrieve the path to `.mmdb` files
  let cityPath = geolite2.paths['GeoLite2-City'];
}

const dbWatcher = new geolite2.UpdateSubscriber();
dbWatcher.on('update', () => {
  useGeolite();
});

// Empty event loop when shutting down
dbWatcher.close();
```

### Usage with TypeScript

This package includes its own types and you can pass the response type in `open`:

```ts
import geolite2 from 'geolite2-redist';
import maxmind, { CityResponse } from 'maxmind';

(async () => {
  let lookup = await geolite2.open<CityResponse>('GeoLite2-City', path => {
    return maxmind.open(path);
  });

  let city = lookup.get('66.6.44.4');

  // Call this when done to empty node's event loop
  lookup.close();
})();
```

## API

### Methods

*geolite2.open(database, databaseReader)*

 - `database`: `<string>` One of `GeoLite2-ASN`, `GeoLite2-Country`, `GeoLite2-City`.
 - `databaseReader`: `<function>` a function that will build a database reader object (`lookup`). Must return a `Promise` or an `<object>`. Called with two arguments:
   - `path`: `<string>` The filesystem path to the database `.mmdb` file.
   - `update`: `<boolean>` Will be set to `true` if this is a rebuild following a database update. `false` on first run.

### Properties

*geolite2.paths* `<object>`

Full fs paths for each database. **Warning:** you need to let the library update the databases automatically, see Usage section.
 - `GeoLite2-ASN`: `<string>`
 - `GeoLite2-Country`: `<string>`
 - `GeoLite2-City`: `<string>`

### Classes

*geolite2.UpdateSubscriber*

Internal class used to automatically update databases, exposed to allow advanced usage without the `geolite2.open()` method - see Usage.
 - **Constructor**
   - *new UpdateSubscriber()* Returns `EventEmitter` instance
 - **Events**
   - `checking` Emitted when automatically checking for database updates.
   - `downloading` Emitted when an update has been found and the new databases are being downloaded in the background.
   - `update` Emitted when new databases have been written to the filesystem.
 - **Methods**
   - *checkUpdates()* Checks for new database updates and downloads them.
   - *triggerUpdate()* Replaces the current databases with fresh copies from the mirror.
   - *close()* Shuts down the updater.
 - **Props**
   - `downloading`: `<boolean>` Whether databases are being downloaded in the background right now - see `downloading` event.

## Warning

Please carefully read the LICENSE and EULA files. This package comes with certain restrictions and obligations, most notably:
 - You cannot prevent the library from updating the databases.
 - You cannot use the GeoLite2 data:
   - for FCRA purposes,
   - to identify specific households or individuals.

**This library's licensing is not suitable for commercial projects distribution.**

If you plan on using `node-geolite2` behind a firewall, you need to whitelist the `raw.githubusercontent.com` IP range for the database updates.

## License

See [LICENSE](https://github.com/GitSquared/node-geolite2-redist/blob/master/LICENSE).

---

**This product includes GeoLite2 data created by MaxMind, available from [https://www.maxmind.com](https://www.maxmind.com).**
