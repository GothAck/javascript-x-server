var fs = require('fs');

var rgbs = fs.readFileSync('rgb.txt', 'ascii');
rgbs = rgbs.split('\n').reduce(function (obj, line) {
  if (/^[!#]/.test(line))
    return obj;
  var vals = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+([\w\s]+)$/);
  if (! vals)
    return obj;
  obj[vals[4]] = ((vals[1] ^ 0) << 16) | ((vals[2] ^ 0) << 8) | (vals[3] ^ 0);
  return obj;
}, {});

fs.writeFileSync(
    'public/rgb_colors.js'
  , '(function (module) {\n'
      + '  module.exports.rgb_colors = ' + JSON.stringify(rgbs, null, 2)
      + '})({ exports: window });'
);

console.log(rgbs);
