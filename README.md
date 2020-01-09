node-geolite2 [![Build Status](https://travis-ci.org/runk/node-geolite2.png)](https://travis-ci.org/runk/node-geolite2)
========

MaxMind's GeoLite2 Free Databases redistribution as an NPM library.

You will need a database reader library capable of reading `.mmdb` files, like [node-maxmind](https://www.npmjs.com/package/maxmind), to use the databases.

This package contains the 3 GeoLite2 databases offered by MaxMind, namely:
 - `GeoLite2-ASN`
 - `GeoLite2-Country`
 - `GeoLite2-City`
For more info check out the [MaxMind website](https://maxmind.com).

Due to license requirements, this package automatically updates the databases in the background when it detects that a new version is available.

See [Warning](#warning) section for more info.

## Usage

### Consuming the databases

Example usage, using the `GeoLite2-City` database with `node-maxmind` as a database reader:

#### Async
```javascript
const geolite2 = require('geolite2');

const maxmind = require('maxmind');

(async () => {
  let lookup = await geolite2.open('GeoLite2-City', path => {
    return maxmind.open(path);
  });

  let city = lookup.get('66.6.44.4');
})();
```

#### Sync

```javascript
const geolite2 = require('geolite2');

const maxmind = require('maxmind');
const fs = require('fs');

let lookup = geolite2.open('GeoLite2-City', path => {
  let buf = fs.readFileSync(path);
  return new maxmind.Reader(buf);
});

let city = lookup.get('66.6.44.4');
```

### Advanced usage

If you do not consume the databases directly, or need more flexible methods, the internal `geolite2.UpdateSubscriber` class is exposed so you can directly listen to database update events.

Example usage:
```javascript
const geolite2 = require('geolite2');

function useGeolite() {
  // You can retrieve the path to `.mmdb` files
  let cityPath = geolite2.paths.GeoLite2-City;
}

const dbWatcher = new geolite2.UpdateSubscriber();
dbWatcher.on('update', () => {
  userGeolite();
});
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
 - **Props**
   - `downloading`: `<boolean>` Whether databases are being downloaded in the background right now - see `downloading` event.

## Warning

Please carefully read the LICENSE and EULA files. This package comes with certain restrictions and obligations, most notably:
 - You cannot prevent the library from updating the databases.
 - You cannot use the GeoLite2 data:
  - for FCRA purposes,
  - to identify specific households or individuals.

This library's licensing is not suitable for commercial projects.

If you plan on using `node-geolite2` behind a firewall, you need to whitelist the `raw.githubusercontent.com` IP range for the database updates.

## License

See [LICENSE](https://github.com/runk/node-geolite2/blob/master/LICENSE).

This product includes GeoLite2 data created by MaxMind, available from [https://www.maxmind.com](https://www.maxmind.com).
