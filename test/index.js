const assert = require('assert');
const fs = require('fs');
const geolite2 = require('../');

describe('geolite2', () => {
  it('should return a valid city db path', () => {
    var stat = fs.statSync(geolite2.paths.city);
    assert(stat.size > 1e6);
    assert(stat.ctime);
  });

  it('should return a valid country db path', () => {
    var stat = fs.statSync(geolite2.paths.country);
    assert(stat.size > 1e6);
    assert(stat.ctime);
  });
});
