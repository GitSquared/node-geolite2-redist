var path = require('path');

module.exports = {
  paths: {
    city: path.resolve(__dirname, 'dbs/GeoLite2-City.mmdb'),
    country: path.resolve(__dirname, 'dbs/GeoLite2-Country.mmdb')
  }
};
