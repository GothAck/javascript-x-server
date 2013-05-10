define('keymap', function () {
  var module = { exports: {} };

  var keysyms = {
      'Backspace' : 0xff08
    , 'Tab'       : 0xff09
    , 'Linefeed'  : 0xff0a
    , 'Clear'     : 0xff0b
    , 'Return'    : 0xff0d
    , 'Pause'     : 0xff13
    , 'ScrollLock': 0xff14
    , 'SysReq'    : 0xff15
    , 'Escape'    : 0xff1b
    , 'Home'      : 0xff50
    , 'Left'      : 0xff51
    , 'Up'        : 0xff52
    , 'Right'     : 0xff53
    , 'Down'      : 0xff54
    , 'PgUp'      : 0xff55
    , 'PgDn'      : 0xff56
  }

  function charKeySym (char) {
    if (char.charCodeAt(0) < 0x100)
      return char.charCodeAt(0);
    return char.charCodeAt(0) + 0x01000100;
  }

  module.exports.getKeysym = function (string, shift) {
    switch (string.length) {
      case 1:
        return charKeySym(shift ? string.toUpperCase() : string.toLowerCase());
      case 2:
        if (string.charAt(0) === '+')
          return charKeySym(shift ? string.charAt(1).toUpperCase() : string.charAt(1).toLowerCase());
      default:
        if (string in keysyms)
          return keysyms[string];
        return 0;
    }
  }

  function KeyMap (map) {
    this._map = map;
  }
  KeyMap.prototype.__defineGetter__('map', function () { return [null].concat(this._map) });
  KeyMap.prototype.maxModifiers = 3;
  KeyMap.prototype.getKeysym = module.exports.getKeysym;
  KeyMap.prototype.find = function (name) {
    return this._map.reduce(function (array, value, index) { if (name.test ? name.test(value) : value === name) return array.concat([index + 1]); return array; }, []);
  }
  KeyMap.prototype.get = function (id) {
    return this._map[id - 1];
  }
  KeyMap.prototype.clone = function () {
    return new KeyMap(this.map.slice());
  }
  module.exports.maps = {
      gb: new KeyMap(
[
  null,
  {
    "0": "Escape"
  },
  {
    "0": "one",
    "1": "exclam"
  },
  {
    "0": "two",
    "1": "quotedbl"
  },
  {
    "0": "three"
  },
  {
    "0": "four",
    "1": "dollar"
  },
  {
    "0": "five",
    "1": "percent"
  },
  {
    "0": "six",
    "1": "asciicircum"
  },
  {
    "0": "seven",
    "1": "ampersand",
    "2": "braceleft"
  },
  {
    "0": "eight",
    "1": "asterisk",
    "2": "bracketleft"
  },
  {
    "0": "nine",
    "1": "parenleft",
    "2": "bracketright"
  },
  {
    "0": "zero",
    "1": "parenright",
    "2": "braceright"
  },
  {
    "0": "minus",
    "1": "underscore",
    "2": "backslash"
  },
  {
    "0": "equal"
  },
  {
    "0": "Delete"
  },
  {
    "0": "Tab"
  },
  {
    "0": "+q",
    "1": "+Q",
    "2": "at"
  },
  {
    "0": "+w",
    "1": "+W"
  },
  {
    "0": "+e"
  },
  {
    "0": "+r",
    "1": "+R"
  },
  {
    "0": "+t",
    "1": "+T"
  },
  {
    "0": "+y",
    "1": "+Y"
  },
  {
    "0": "+u",
    "1": "+U"
  },
  {
    "0": "+i",
    "1": "+I"
  },
  {
    "0": "+o"
  },
  {
    "0": "+p"
  },
  {
    "0": "bracketleft"
  },
  {
    "0": "bracketright"
  },
  {
    "0": "Return"
  },
  {
    "0": "Control"
  },
  {
    "0": "+a"
  },
  {
    "0": "+s",
    "1": "+S",
    "2": "+ssharp"
  },
  {
    "0": "+d"
  },
  {
    "0": "+f",
    "1": "+F"
  },
  {
    "0": "+g",
    "1": "+G"
  },
  {
    "0": "+h",
    "1": "+H"
  },
  {
    "0": "+j",
    "1": "+J"
  },
  {
    "0": "+k",
    "1": "+K"
  },
  {
    "0": "+l",
    "1": "+L"
  },
  {
    "0": "semicolon"
  },
  {
    "0": "apostrophe"
  },
  {
    "0": "grave"
  },
  {
    "0": "Shift"
  },
  {
    "0": "numbersign"
  },
  {
    "0": "+z",
    "1": "+Z"
  },
  {
    "0": "+x",
    "1": "+X"
  },
  {
    "0": "+c",
    "1": "+C"
  },
  {
    "0": "+v",
    "1": "+V"
  },
  {
    "0": "+b",
    "1": "+B"
  },
  {
    "0": "+n"
  },
  {
    "0": "+m"
  },
  {
    "0": "comma",
    "1": "less"
  },
  {
    "0": "period",
    "1": "greater"
  },
  {
    "0": "slash",
    "1": "question"
  },
  {
    "0": "Shift"
  },
  {
    "0": "KP_Multiply"
  },
  {
    "0": "Alt"
  },
  {
    "0": "space"
  },
  {
    "0": "CtrlL_Lock"
  },
  {
    "0": "F1"
  },
  {
    "0": "F2"
  },
  {
    "0": "F3"
  },
  {
    "0": "F4"
  },
  {
    "0": "F5"
  },
  {
    "0": "F6"
  },
  {
    "0": "F7"
  },
  {
    "0": "F8"
  },
  {
    "0": "F9"
  },
  {
    "0": "F10"
  },
  {
    "0": "Num_Lock"
  },
  {
    "0": "Scroll_Lock"
  },
  {
    "0": "KP_7"
  },
  {
    "0": "KP_8"
  },
  {
    "0": "KP_9"
  },
  {
    "0": "KP_Subtract"
  },
  {
    "0": "KP_4"
  },
  {
    "0": "KP_5"
  },
  {
    "0": "KP_6"
  },
  {
    "0": "KP_Add"
  },
  {
    "0": "KP_1"
  },
  {
    "0": "KP_2"
  },
  {
    "0": "KP_3"
  },
  {
    "0": "KP_0"
  },
  {
    "0": "KP_Period"
  },
  {
    "0": "Last_Console",
    "1": "Last_Console",
    "2": "Last_Console"
  },
  null,
  {
    "0": "backslash",
    "1": "bar",
    "2": "bar"
  },
  {
    "0": "F11"
  },
  {
    "0": "F12"
  },
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  {
    "0": "KP_Enter"
  },
  {
    "0": "Control"
  },
  {
    "0": "KP_Divide"
  },
  null,
  {
    "0": "AltGr"
  },
  {
    "0": "Break",
    "1": "Break",
    "2": "Break"
  },
  {
    "0": "Find"
  },
  {
    "0": "Up"
  },
  {
    "0": "Prior"
  },
  {
    "0": "Left"
  },
  {
    "0": "Right"
  },
  {
    "0": "Select"
  },
  {
    "0": "Down"
  },
  {
    "0": "Next"
  },
  {
    "0": "Insert"
  },
  {
    "0": "Remove"
  },
  {
    "0": "Macro",
    "1": "Macro",
    "2": "Macro"
  },
  {
    "0": "F13",
    "1": "F13",
    "2": "F13"
  },
  {
    "0": "F14",
    "1": "F14",
    "2": "F14"
  },
  {
    "0": "Help",
    "1": "Help",
    "2": "Help"
  },
  {
    "0": "Do",
    "1": "Do",
    "2": "Do"
  },
  {
    "0": "F17",
    "1": "F17",
    "2": "F17"
  },
  {
    "0": "KP_MinPlus",
    "1": "KP_MinPlus",
    "2": "KP_MinPlus"
  },
  {
    "0": "Pause"
  },
  null,
  {
    "0": "KP_Period"
  },
  null,
  null,
  null,
  {
    "0": "Alt"
  },
  {
    "0": "Alt"
  }
]
      )
  }
  return module.exports;
})
