node-geolite2 [![Build Status](https://travis-ci.org/runk/node-geolite2.png)](https://travis-ci.org/runk/node-geolite2)
========

MaxMind's GeoLite2 Free Databases redistribution as an NPM library.

You need a database reader library capable of reading `.mmdb` files, like [node-maxmind](https://www.npmjs.com/package/maxmind).

This package contains the 3 GeoLite2 databases offered by MaxMind, namely:
 - `GeoLite2-ASN`
 - `GeoLite2-Country`
 - `GeoLite2-City`
For more info check out the [MaxMind website](https://maxmind.com).

Due to license requirements, this package automatically updates the databases in the background when it detects that a new version is available.

See Warning section for more info.

## Usage

Example usage, using the `GeoLite2-City` database with `node-maxmind` as a reader:

### Async
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

### Sync

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

## API

*geolite2.open(database, databaseReader)*
 - `database`: `<string>` One of `GeoLite2-ASN`, `GeoLite2-Country`, `GeoLite2-City`.
 - `databaseReader`: `<function>` a function that will build a database reader object (`lookup`). Must return a `Promise` or an `<object>`. Called with two arguments:
  - `path`: `<string>` The filesystem path to the database `.mmdb` file.
  - `update`: `<boolean>` Will be set to `true` if this is a rebuild following a database update. `false` on first run.

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
