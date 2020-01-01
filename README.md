node-geolite2 [![Build Status](https://travis-ci.org/runk/node-geolite2.png)](https://travis-ci.org/runk/node-geolite2)
========

Maxmind's GeoLite2 Free Databases download helper.

## Usage

**IMPORTANT** You must setup `MAXMIND_LICENSE_KEY` environment variable be able to download databases. To do so, go to the https://www.maxmind.com/en/geolite2/signup, create a free account and generate new license key.

```javascript
var geolite2 = require('geolite2');
var maxmind = require('maxmind');

var lookup = maxmind.openSync(geolite2.paths.city); // or geolite2.paths.country or geolite2.paths.asn
var city = lookup.get('66.6.44.4');
```

## License

Creative Commons Attribution-ShareAlike 4.0 International License
