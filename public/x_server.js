define(['util', 'fs', 'endianbuffer', 'x_types', 'x_client', 'keymap'], function (util, fs, EndianBuffer, x_types, XServerClient, keymap) {
  var module = { exports: {} };

  var default_atoms = [
      'PRIMARY'
    , 'SECONDARY'
    , 'ARC'
    , 'ATOM'
    , 'BITMAP'
    , 'CARDINAL'
    , 'COLORMAP'
    , 'CURSOR'
    , 'CUT_BUFFER0'
    , 'CUT_BUFFER1'
    , 'CUT_BUFFER2'
    , 'CUT_BUFFER3'
    , 'CUT_BUFFER4'
    , 'CUT_BUFFER5'
    , 'CUT_BUFFER6'
    , 'CUT_BUFFER7'
    , 'DRAWABLE'
    , 'FONT'
    , 'INTEGER'
    , 'PIXMAP'
    , 'POINT'
    , 'RECTANGLE'
    , 'RESOURCE_MANAGER'
    , 'RGB_COLOR_MAP'
    , 'RGB_BEST_MAP'
    , 'RGB_BLUE_MAP'
    , 'RGB_DEFAULT_MAP'
    , 'RGB_GRAY_MAP'
    , 'RGB_GREEN_MAP'
    , 'RGB_RED_MAP'
    , 'STRING'
    , 'VISUALID'
    , 'WINDOW'
    , 'WM_COMMAND'
    , 'WM_HINTS'
    , 'WM_CLIENT_MACHINE'
    , 'WM_ICON_NAME'
    , 'WM_ICON_SIZE'
    , 'WM_NAME'
    , 'WM_NORMAL_HINTS'
    , 'WM_SIZE_HINTS'
    , 'WM_ZOOM_HINTS'
    , 'MIN_SPACE'
    , 'NORM_SPACE'
    , 'MAX_SPACE'
    , 'END_SPACE'
    , 'SUPERSCRIPT_X'
    , 'SUPERSCRIPT_Y'
    , 'SUBSCRIPT_X'
    , 'SUBSCRIPT_Y'
    , 'UNDERLINE_POSITION'
    , 'UNDERLINE_THICKNESS'
    , 'STRIKEOUT_ASCENT'
    , 'STRIKEOUT_DESCENT'
    , 'ITALIC_ANGLE'
    , 'X_HEIGHT'
    , 'QUAD_WIDTH'
    , 'WEIGHT'
    , 'POINT_SIZE'
    , 'RESOLUTION'
    , 'COPYRIGHT'
    , 'NOTICE'
    , 'FONT_NAME'
    , 'FAMILY_NAME'
    , 'FULL_NAME'
    , 'CAP_HEIGHT'
    , 'WM_CLASS'
    , 'WM_TRANSIENT_FOR'
  ]

  function XServer (id, socket, screen) {
    Object.defineProperty(this, 'server', {
        enumerable: false
      , value: this
    });
    this.id = id;
    this.socket = socket;
    this.screen = screen;
    this.protocol_major = 11;
    this.protocol_minor = 0;
    this.release = 11300000;
    this.vendor = 'JavaScript X';
    this.event_cache = [];
    this.grabbed = null;
    this.grab_buffer = [];
    this.input_focus = null;
    this.input_focus_revert = 0;
    this.keymap = keymap.maps.gb.clone();
    this.formats = [
        new x_types.Format(0x01, 0x01, 0x20)
      , new x_types.Format(0x04, 0x08, 0x20)
      , new x_types.Format(0x08, 0x08, 0x20)
      , new x_types.Format(0x0f, 0x10, 0x20)
      , new x_types.Format(0x10, 0x10, 0x20)
      , new x_types.Format(0x18, 0x20, 0x20)
      , new x_types.Format(0x20, 0x20, 0x20)
    ];
    this.screens = [
        new x_types.Screen(
            0x00000026 // root
          , 0x00000022 // def colormap
          , 0x00ffffff // white
          , 0x00000000 // black
          , 0x00000000 // current input masks
          , $('.screen').width() // width px
          , $('.screen').height() // height px
          , Math.round($('.screen').width() / (96 / 25.4)) // width mm
          , Math.round($('.screen').height() / (96 / 25.4)) // height mm
          , 0x0001 // min maps
          , 0x0001 // max maps
          , 0x20 // root visual
          , 2 // backing stores 0 Never, 1 WhenMapped, 2 Always
          , 1 // save unders
          , 0x18 //24 default depth
          , [ // depths
                new x_types.Depth(
                    0x01 // depth 1
                )
              , new x_types.Depth(
                    0x18 // depth 24
                  , [ // visualtypes
                        new x_types.VisualType(
                            0x00000020 // id
                          , 0x04 // class
                          , 0x08 // bits per rgb
                          , 0x0100 // colormap entries
                          , 0x00ff0000 // red mask
                          , 0x0000ff00 // green mask
                          , 0x000000ff // blue mask
                        )
                      , new x_types.VisualType(
                            0x00000021 // id
                          , 0x05 // class
                          , 0x08 // bits per rgb
                          , 0x0100 // colormap entries
                          , 0x00ff0000 // red mask
                          , 0x0000ff00 // green mask
                          , 0x000000ff // blue mask
                        )
                    ]
                )
            ]
        )
    ];
    this.atoms = default_atoms.slice();
    this.atom_owners = [];
    this.resources = {}
    this.resources[0x00000022] = new x_types.ColorMap(
        0x00000022
      , function (rgb, type) {
          rgb = [
              (rgb & 0x000000ff)
            , (rgb & 0x0000ff00) >> 8
            , (rgb & 0x00ff0000) >> 16
          ];
          switch (type) {
            case 'hex':
              return rgb.reduce(function (str, v) { v = v.toString(16); return str + (v.length < 2 ? '0' : '') + v }, '');
            default:
              return rgb;
          }
        }
    );
    this.resources[0x00000026] = this.root = new x_types.Window(
        this
      , 0x00000026
      , 0x18 // depth 24
      , { id: 0, element: this.screen, children: [] } // parent 0
      , 0, 0
      , this.screen.width(), this.screen.height()
      , 0, 1, 0, 0, 0
    );
    this.font_path = 'fonts';
    this.fonts_dir = {};
    this.fonts_scale = {};
    this.fonts_cache = {};

    fs.readFile(this.font_path + '/fonts.dir', 'utf8', function (err, file) {
      if (err)
        throw new Error('No fonts.dir');
      file = file.split('\n');
      file.pop();
      var count = file.shift() ^ 0;
      if (count !== file.length)
        throw new Error('Invalid length of fonts.dir');
      file.forEach(function (line) {
        var match = line.match(/^(".*"|[^ ]*) (.*)$/);
        this.fonts_dir[match[2]] = match [1];
      }.bind(this));
    }.bind(this));

    this.clients = {};
    var c = this.resources[0x00000026].canvas[0].getContext('2d')
      , img = new Image;
    img.onload = function () {
      c.rect(0, 0, $('.screen').width(), $('.screen').height());
      c.fillStyle = c.createPattern(img, 'repeat');
      c.fill();
    }
    img.src = "/check.png";

    this.resources[0x00000026].map();

    this.mouseX = this.mouseY = 0;
    var self = this;
    this.screen.on('mousemove.xy', function (event) {
      self.mouseX = event.offsetX;
      self.mouseY = event.offsetY;
    }.bind(this));
  }

  XServer.prototype.getFormatByDepth = function (depth) {
    return this.formats.filter(function (format) {
      return format.depth === depth;
    })[0];
  }

  XServer.prototype.newClient = function (id) {
    return this.clients[id] = new XServerClient(this, id);
  }

  XServer.prototype.disconnect = function (id) {
    if (!id) {
      this.screen.off('');
      return Object.keys(this.clients).forEach(function (cid) {
        this.clients[cid].disconnect();
      }.bind(this));
    } // Disconnect whole server
    if (!this.clients[id])
      throw new Error('Invalid client! Disconnected?');

    if (this.grabbed && this.grabbed.id !== id) {
      return this.grab_buffer.push([this, 'disconnect', id]);
    }

    this.clients[id].disconnect();
  }

  XServer.prototype.write = function (client, data) {
    if (! this.clients[client.id])
      throw new Error('Invalid client! Disconnected?');
    if (! (data instanceof EndianBuffer))
      throw new Error('Not a buffer!');
    var buffer = new EndianBuffer(data.length + 2);
    buffer.endian = true; // Client id is always Little Endian
    data.copy(buffer, 2);
    buffer.writeUInt16(client.id, 0);
    this.socket.send(buffer.buffer);
  }

  XServer.prototype.processData = function (buffer) {
    var id = buffer.readUInt16(0)
      , data = buffer.slice(2);

    if (! this.clients[id])
      throw new Error('Invalid client! Disconnected?');
    this.clients[id].processData(data);
  }

  XServer.prototype.flushGrabBuffer = function() {
    var item = null;
    while (item = this.grab_buffer.shift())
      item[0][item[1]].apply(item[0], item.slice(2));
    Object.keys(this.clients).forEach(function (id) {
      this.clients[id].reqs_processing = false;
      this.clients[id].processReqs();
    }.bind(this));
  }

  XServer.prototype.listFonts = function (pattern) {
    var re = new RegExp('^' + pattern.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1").replace(/\\([*?])/g, '.$1') + '$', 'i');
    return Object.keys(this.fonts_dir).filter(function(name) { return re.test(name) });
  }

  XServer.prototype.resolveFont = function (name) {
    var resolved_name;
    if (! (name in this.fonts_dir)) {
      if (/[*?]/.test(name)) {
        var names = this.listFonts(name);
        if (names && names.length)
          resolved_name = [names[0], this.fonts_dir[names[0]]];
      }
    }
    return resolved_name || [name, this.fonts_dir[name]];
  }

  XServer.prototype.loadFont = function (resolved_name, server_name, callback) {
    if (resolved_name in this.fonts_cache)
      return this.fonts_cache[resolved_name];
    this.grabbed = 'loadFont';
    var font = this.fonts_cache[resolved_name] =
      new x_types.Font(0, resolved_name, server_name, function (err) {
        if (err)
          font.error = true;
        if (font.font && font.font.properties)
          Object.keys(font.font.properties).forEach(function (prop_name) {
            var value = font.font.properties[prop_name];
            if (!~this.atoms.indexOf(prop_name))
              this.atoms.push(prop_name);
            if (typeof value === 'string') {
              if (~this.atoms.indexOf(value))
                font.font.properties[prop_name] = this.atoms.indexOf(value) + 1;
              else
                font.font.properties[prop_name] = this.atoms.push(value);
            }
            callback && callback(err, font);
          }.bind(this))
        this.flushGrabBuffer();
      }.bind(this));
    return font;
  }

  XServer.prototype.openFont = function (fid, name) {
    var resolved_name = this.resolveFont(name);
    if (resolved_name[1]) {
      var font = this.loadFont(resolved_name[1], resolved_name[0], function () {
        setTimeout(function () {
          this.grabbed = false;
          this.flushGrabBuffer();
        }.bind(this), 250);
      }.bind(this));
      if (!font.loading)
        this.grabbed = false;
      font.id = fid;
      return font;
    }
    console.log('Name not resolved', name);
    this.grabbed = false;
    this.flushGrabBuffer();

  }

  XServer.prototype.encodeString = function (str) {
    var out_str = '';
    if (typeof str !== 'string')
      return str;
    for (var i = 0; i < str.length; i ++) {
      var v = str.charCodeAt(i);
      if (v < 0x21) {
        out_str += String.fromCharCode(0x2400 + v);
        continue;
      }
      if (v > 0x7e && v < 0xa1) {
        out_str += String.fromCharCode(0xf800 - 0x7e + v);
        continue;
      }
      out_str += str.charAt(i);
    }
    return out_str;
  }

  return XServer;
});
