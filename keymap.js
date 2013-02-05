var fs = require('fs');

var lines = fs.readFileSync('keymap.txt', 'utf-8').split('\n');


var keymap = [];

var mods = ['shift', 'altgr', 'control', 'alt', 'shiftl', 'shiftr', 'ctrll', 'ctrlr', 'capsshift']

function key_mapper (list) {
  return list.reduce(
      function (o, v) {
        return o |  ((~mods.indexOf(v)) ? (1 << mods.indexOf(v)) : 0);
      }
    , 0
  )
}

lines.forEach(function (line) {
  if (/^\s+/.test(line))
    return;
  line = line.match(/^\s*((?:\s*?(?:\w+))*)\s*keycode\s+(\d+)\s+=\s+((?:(?:[\w+_\-]+)+\s*?)+)\s*$/);
  if (!line)
    return;
  var mods = line[1].replace(/\s+/g, ' ').split(' ')
    , code = line[2] * 1
    , maps = line[3].replace(/\s+/g, ' ').split(' ');

  var mapped = keymap[code] = keymap[code] || {};

  mapped[key_mapper(mods)] = maps[0];
  if (maps[1])
    mapped[key_mapper(mods.concat('shift'))] = maps[1];
  if (maps[2])
    mapped[key_mapper(mods.concat('altgr'))] = maps[2];
  if (maps[3])
    mapped[key_mapper(mods.concat('control'))] = maps[3];

});
console.log(JSON.stringify(keymap, null, 2));
//console.log(keymap);
