# node-geolite2-redist

[![Automatic Redistribution Updates](https://github.com/GitSquared/node-geolite2-redist/workflows/Databases%20Updater/badge.svg?branch=master&event=schedule)](https://github.com/GitSquared/node-geolite2-redist/actions?query=workflow%3A%22Databases+Updater%22) ![NPM published version](https://badgen.net/npm/v/geolite2-redist) ![Node version](https://badgen.net/npm/node/geolite2-redist) ![Types Status](https://badgen.net/npm/types/geolite2-redist)

---

MaxMind's GeoLite2 free databases as an npm library. **As this is a redistribution, you don't need a MaxMind license key.** However, some additional legal restrictions apply, make sure to read this README and the [Legal Warning](#legal-warning) carefully before deciding to use this.

You will need a database reader capable of reading `.mmdb` files, like [node-maxmind](https://www.npmjs.com/package/maxmind), if you wish to use the data.

This package is compatible with the 3 GeoLite2 databases, namely:
 - `GeoLite2-ASN`
 - `GeoLite2-Country`
 - `GeoLite2-City`

For more info check out the [MaxMind website](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data).

Due to license requirements, **this package automatically updates the databases in the background** when it detects that a new version is available. This should be transparent for most usecases, if you're experiencing any problem with it, please file an issue.

See [Legal Warning](#legal-warning) section for more info on licensing and limitations.

## Usage

### Using the geoip data

Example geoip lookup in a Node environment, using the `GeoLite2-City` database with `node-maxmind` as a db reader:

```javascript
const maxmind = require('maxmind');

// This module is distributed as en ESM module (import...from... syntax), but you can
// use an import() promise to make it work without switching to ESM!
import('geolite2-redist').then((geolite2) => {
 return geolite2.open(
  'GeoLite2-City',                 // database name
  (dbPath) => maxmind.open(dbPath) // function that builds a useful db reader
  )
}).then((reader) => {
  const lookup = reader.get('185.194.81.29')

  console.log(lookup.country.iso_code) // FR 🥖🇫

  // Calling close() here shuts everything down nicely and clears up Node's event loop.
  reader.close()
})
```

TODO: Typescript example

## API

You can find a more detailed documentation [on the Typedoc-generated website](https://gitsquared.github.io/node-geolite2-redist/).

## Legal Warning

Privacy regulations (CCPA in California, GDPR in Europe) that implement the right-to-forget have affected MaxMind's EULA & licenses.
In a nutshell, you should always make sure your GeoIP databases are up to date, which this library conveniently does for you ;)

That said, please carefully read the LICENSE and EULA files. The databases are provided under certain restrictions and obligations, most notably:
 - You cannot prevent the library from updating the databases.
 - You cannot use the GeoLite2 data:
   - for [FCRA](https://www.ftc.gov/enforcement/statutes/fair-credit-reporting-act) purposes in the USA,
   - to identify specific households or individuals, worldwide.

If you plan on using `node-geolite2` behind a firewall, you need to whitelist the [GitHub IP range](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-githubs-ip-addresses) so that the package can reach the databases mirror.

## Compatibility

We follow the OpenJS Foundation's [deprecation schedule](https://nodejs.org/en/about/releases/) and support all maintained Node versions.

## License

The databases themselves are provided by MaxMind under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

For the library, see [LICENSE](https://github.com/GitSquared/node-geolite2-redist/blob/master/LICENSE).

---

**This software package includes GeoLite2 data created by MaxMind, available from [https://www.maxmind.com](https://www.maxmind.com).**
