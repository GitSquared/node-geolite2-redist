node-geolite2 [![Build Status](https://travis-ci.org/runk/node-geolite2.png)](https://travis-ci.org/runk/node-geolite2)
========

Maxmind's GeoLite2 Free Databases

This product includes GeoLite2 data created by MaxMind, available from [http://www.maxmind.com](http://www.maxmind.com).


## Usage

```javascript
var geolite2 = require('geolite2');
var maxmind = require('maxmind');

var lookup = maxmind.open(geolite2.paths.city); // or geolite2.paths.country
var city = lookup.get('66.6.44.4');
```

## License

MIT
