window.loaders.push(function () {
  var module = { exports: window }

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
          , 800 // width px
          , 400 // height px
          , Math.round(800 / (96 / 25.4)) // width mm
          , Math.round(400 / (96 / 25.4)) // height mm
          , 0x0001 // min maps
          , 0x0001 // max maps
          , 0x20 // root visual
          , 0 // backing stores
          , 0 // save unders
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
      , 800, 400
      , 0, 0, 0, 0, 0
    );
    this.font_path = 'fonts';
    this.fonts_dir = {};
    this.fonts_scale = {};
    this.fonts_cache = {};

    getTextFile(this.font_path + '/fonts.dir', function (err, file) {
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
      c.rect(0, 0, 800, 400);
      c.fillStyle = c.createPattern(img, 'repeat');
      c.fill();
    }
    img.src = "/check.png";

    this.resources[0x00000026].map();

    this.mouseX = this.mouseY = 0;
    this.screen.on('mousemove', function (event) {
      this.mouseX = event.offsetX;
      this.mouseY = event.offsetY;
    }.bind(this));
  }

  module.exports.XServer = XServer;

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
      console.log('put in grab_buffer')
      return this.grab_buffer.push([this, 'disconnect', id]);
    }

    this.clients[id].disconnect();
  }

  XServer.prototype.write = function (client, data) {
    if (! this.clients[client.id])
      throw new Error('Invalid client! Disconnected?');
    if (! (data instanceof Buffer))
      throw new Error('Not a buffer!');
    var buffer = new Buffer(data.length + 2);
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
            if (!~this.atoms.indexOf(prop_name))
              this.atoms.push(prop_name);
            callback && callback(err, font);
          }.bind(this))
        this.flushGrabBuffer();
      }.bind(this));
    return font;
  }

  XServer.prototype.openFont = function (fid, name) {
    var resolved_name = this.resolveFont(name);
    console.log('openFont', fid, name, resolved_name);
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
    for (var i = 0; i < str.length; i ++)
      out_str += str.charCodeAt(i) < 0x21 ? '&#' + (0x2400 + str.charCodeAt(i))+ ';' : str.charAt(i);
    return out_str;
  }

  function XServerClient (server, id) {
    this.server = server;
    this.id = id;
    this.state = 0;
    this.endian = null;
    this.release = 11300000;
    this.resource_id_mask = 0x001fffff;
    this.resource_id_base = 0x00200000;
    this.vendor = 'JavaScript X';
    this.motion_buffer_size = 0xff;
    this.maximum_request_length = 0xffff;
    this.sequence = 1;
    this.resources = this.server.resources;
    this.reqs = [];
    this.reps = [];
  }

  module.exports.XServerClient = XServerClient;

  XServerClient.prototype.write = function (data) {
    return this.server.write(this, data);
  }

  XServerClient.prototype.processData = function (data) {
    data.endian = this.endian;
    switch (this.state) {
      case 0:
        return this.setup(data);
      case 1:
        var req = { length: 0 };
        while (data.length > 0) {
          req = new x_types.Request(data, this.sequence ++);
          this.reqs.unshift(req);
          if (data.length > 0) {
            data = data.slice(req.length);
            data.endian = this.endian;
          }
        }
        this.reqs.unshift(null); // Force a processReps after this batch!
        if (!this.server.grabbed)
          this.processReqs();
    }
  }

  XServerClient.prototype.processReqs = function () {
    var self = this;
    if (self.server.grabbed)
      return self.reqs_processing = false;
    if (self.reqs_processing)
      return;
    clearTimeout(self.reqs_timeout);
    if (self.reqs.length) {
      self.reqs_processing = true;
      self.reqs_timeout = setTimeout(function () {
        var req = self.reqs.pop();
        if (req) {
          var func = self[XServerClient.opcodes[req.opcode]];
          if (func) {
            func && func.call(self, req, function (err, rep) {
              if (rep) {
                if (Array.isArray(rep))
                  self.reps = self.reps.concat(rep)
                else
                  self.reps.push(rep);
              }
              self.reqs_processing = false;
              self.processReqs()
            });
          } else {
            console.log('################### UNKNOWN OPCODE', req.opcode);
            self.reqs_processing = false;
            self.processReqs()
          }
        } else {
          self.processReps();
          self.reqs_processing = false;
          self.processReqs()
        }
      }, 1);
    } else
      self.processReps();
  }

  XServerClient.prototype.processReps = function () {
    if (! this.reps.length)
      return;
    var reps = this.reps.splice(0, this.reps.length)
      , res = new Buffer(
          reps.reduce(function (o, rep) { return o + rep.length }, 0)
        );

    res.endian = this.endian;
    reps.reduce(function (o, rep) {
      return rep.writeBuffer(res, o);
    }, 0);
    this.write(res);
  }

  XServerClient.prototype.disconnect = function () {
    console.log('Disconnect', this.id);
    delete this.server.clients[this.id];
    Object.keys(this.server.resources)
      .forEach(function (resource) {
        if (! (resource = this.server.resources[resource]))
          return;
        if ((resource.id & ~ this.resource_id_mask) === this.resource_id_base) {
          $(resource.canvas).add(resource.element).remove();
          delete this.server.resources[resource.id];
        }
      }.bind(this));
  }

  XServerClient.prototype.setup = function (data) {
    data.endian = this.endian = data.readUInt8(0) !== 66; // TODO: Investigate endianness issues here (swapped?)... (true === LE, arrghhhhhhh!)
    this.protocol_major = data.readUInt16(2);
    this.protocol_minor = data.readUInt16(4);

    this.auth_name = data.toString(
        'ascii'
      , 12
      , 12 + data.readUInt16(6, data.endian)
    );

    this.auth_data = data.toString(
        'ascii'
      , 12 + data.readUInt16(6, data.endian) + 2
      , 12 + data.readUInt16(6, data.endian) + 2 + data.readUInt16(8, data.endian)
    );

    /* Deny connection
    var reason = 'No Way'
      , pad = 4 - ((reason.length % 4) || 4);

    var res = new Buffer(8 + reason.length + pad);
    res.fill(0);
    res.writeUInt8(reason.length, 1); // 2 (0: 0, 1: reason.length)
    this.writeUInt16(res, this.protocol_major, 2); // 2
    this.writeUInt16(res, this.protocol_minor, 4); // 2
    this.writeUInt16(res, (reason.length + pad) / 4, 6);
    res.write(reason, 8, reason.length, 'ascii');
    this.socket.write(res);
    */
    // Allow connection

    var res = new Buffer(500);
    res.endian = this.endian;
    res.writeUInt8(1, 0);
    res.writeUInt16(this.server.protocol_major, 2);
    res.writeUInt16(this.server.protocol_minor, 4);
    res.writeUInt16((32 + (this.server.formats.byteLength()) + stringPad(this.server.vendor) + this.server.screens.byteLength()) / 4, 6);
    res.writeUInt32(this.server.release, 8);
    res.writeUInt32(this.resource_id_base, 12);
    res.writeUInt32(this.resource_id_mask, 16);
    res.writeUInt32(this.motion_buffer_size, 20);
    res.writeUInt16(this.server.vendor.length, 24);
    res.writeUInt16(this.maximum_request_length, 26);
    res.writeUInt8(this.server.screens.length, 28); // Number screens
    res.writeUInt8(this.server.formats.length, 29); // Number formats
    res.writeUInt8(0, 30); // image lsb first
    res.writeUInt8(0, 31); // pixmap lsb first
    res.writeUInt8(32, 32); // pixmap scanline unit
    res.writeUInt8(32, 33); // pixmap scanline pad
    res.writeUInt8(8, 34); // min keycode
    res.writeUInt8(255, 35); // max keycode
    // 4 unused
    res.write(this.server.vendor, 40, this.server.vendor.length, 'ascii');
    var base = 40 + stringPad(this.server.vendor);
    base = this.server.formats.writeBuffer(res, base);
    base = this.server.screens.writeBuffer(res, base);
    var rep = new Buffer(base);
    rep.fill(0);
    res.copy(rep, 0, 0, base);
    this.write(rep);
    this.state = 1;
  }

  XServerClient.opcodes = {
      1: 'CreateWindow'
    , 2: 'ChangeWindowAttributes'
    , 3: 'GetWindowAttributes'
    , 8: 'MapWindow'
    , 9: 'MapSubwindows'
    , 10: 'UnmapWindow'
    , 11: 'UnmapSubwindows'
    , 12: 'ConfigureWindow'
    , 14: 'GetGeometry'
    , 16: 'InternAtom'
    , 18: 'ChangeProperty'
    , 19: 'DeleteProperty'
    , 20: 'GetProperty'
    , 23: 'GetSelectionOwner'
    , 36: 'GrabServer'
    , 37: 'UngrabServer'
    , 38: 'QueryPointer'
    , 42: 'SetInputFocus'
    , 43: 'GetInputFocus'
    , 45: 'OpenFont'
    , 47: 'QueryFont'
    , 49: 'ListFonts'
    , 50: 'ListFontsWithInfo'
    , 53: 'CreatePixmap'
    , 54: 'FreePixmap'
    , 55: 'CreateGC'
    , 56: 'ChangeGC'
    , 60: 'FreeGC'
    , 61: 'ClearArea'
    , 66: 'PolySegment'
    , 67: 'PolyRectangle'
    , 69: 'FillPoly'
    , 70: 'PolyFillRectangle'
    , 71: 'PolyFillArc'
    , 72: 'PutImage'
    , 74: 'PolyText8'
    , 75: 'PolyText16'
    , 91: 'QueryColors'
    , 94: 'CreateGlyphCursor'
    , 97: 'QueryBestSize'
    , 98: 'QueryExtension'
    , 99: 'ListExtensions'
  }; // 34 or 127
  (function () {
    var opcodes = Object.keys(XServerClient.opcodes).length;
    console.log('Implemented', opcodes, 'opcodes of 127, that\'s', opcodes / 127 * 100, '%');
  })();

  XServerClient.prototype.CreateWindow = function (req, callback) {
    var depth = req.data_byte
      , id = req.data.readUInt32(0)
      , parent = this.server.resources[req.data.readUInt32(4)]
      , x = req.data.readInt16(8)
      , y = req.data.readInt16(10)
      , width = req.data.readUInt16(12)
      , height = req.data.readUInt16(14)
      , border_width = req.data.readUInt16(16)
      , _class = req.data.readUInt16(18)
      , visual = req.data.readUInt32(20)
      , vmask = req.data.readUInt32(24)
      , vdata = req.data.slice(28);
    vdata.endian = this.endian;
    this.resources[id] = new x_types.Window(this, id, depth, parent, x, y, width, height, border_width, _class, visual, vmask, vdata);
    callback();
  }

  XServerClient.prototype.ChangeWindowAttributes = function (req, callback) {
    var window = this.resources[req.data.readUInt32(0)]
      , rep = new x_types.Reply(req)
      , vmask = req.data.readUInt32(4)
      , vdata = req.data.slice(4);
    vdata.endian = this.endian;
    window.changeData(vmask, vdata);
    callback();
  }

  XServerClient.prototype.GetWindowAttributes = function (req, callback) {
    var window = this.resources[req.data.readUInt32(0)]
      , rep = new x_types.Reply(req);
    rep.data_byte = 0; // Backing store (0 NotUseful, 1 WhenMapper, 2 Always)
    rep.data.writeUInt32(window.id, 0); // Visual id
    rep.data.writeUInt16(1, 4); // Class (1 InputOutput, 2 InputOnly)
    rep.data.writeUInt8(0, 6); // Bit gravity
    rep.data.writeUInt8(0, 7); // Win gravity
    rep.data.writeUInt32(0, 8); // Backing planes
    rep.data.writeUInt32(0, 12); // Backing pixel
    rep.data.writeUInt8(0, 16); // Save under
    rep.data.writeUInt8(window.isMapped() ? 1 : 0, 17); // Map is installed
    rep.data.writeUInt8(window.isMapped() ? 2 : 0, 18); // Map state (0 Unmapped, 1 Unviewable, 2 Viewable)
    rep.data.writeUInt8(0, 19); // Override redirect
    rep.data.writeUInt32(0, 20); // Colormap
    rep.data_extra.push(new x_types.UInt32(window.event_mask)); // All event masks
    rep.data_extra.push(new x_types.UInt32(window.event_mask)); // Your event mask
    rep.data_extra.push(new x_types.UInt16(0)); // Do not propagate mask
    rep.data_extra.push(new x_types.UInt16(0)); // Unused
    callback(null, rep);
  }

  XServerClient.prototype.MapWindow = function (req, callback) {
    var window = this.server.resources[req.data.readUInt32(0)];
    console.log('MapWindow', window.id);
    reps = [];
    if (window.map()) {
      reps.push(new x_types.EventMapNotify(req, window, window));
      if (~window.events.indexOf('Exposure'))
        reps.push(new x_types.EventExpose(req, window, 0));
    }
    callback(null, reps);
  }

  XServerClient.prototype.MapSubwindows = function (req, callback) {
    var window = this.server.resources[req.data.readUInt32(0)];
    console.log('MapSubwindows', window.id);
    var reps = [];
    function run (parent_children) {
      var children_children = [];
      parent_children.forEach(function (child_window, i) {
        if (child_window.map()) {
          reps.push(new x_types.Event(req, 19, child_window, child_window));
          if (~child_window.events.indexOf('Exposure'))
            reps.push(new x_types.EventExpose(req, child_window, 0));
        }
        children_children.splice.apply(children_children, [0, 0].concat(child_window.children));
      });
      if (children_children.length)
        run(children_children);
    }
    run(window.children);
    callback(null, reps);
  }

  XServerClient.prototype.UnmapWindow = function (req, callback) {
    var window = this.server.resources[req.data.readUInt32(0)];
    console.log('UnmapWindow');
    if (window.unmap())
      console.log('Success - events go here!');
    callback();
  }

  var _win_configure_vfields = [
    'x', 'y', 'width', 'height', 'border_width', 'sibling', 'stack_mode'
  ]
  XServerClient.prototype.ConfigureWindow = function (req, callback) {
    var window = this.resources[req.data.readUInt32(0)]
      , vmask = req.data.readUInt16(4)
      , vdata = req.data.slice(8);
    vdata.endian = this.endian;
    var offset = 0;
    for (var i = 0; i < _win_configure_vfields.length; i++)
      if (vmask & Math.pow(2, i))
        window[_win_configure_vfields[i]] = vdata.readUInt32((offset ++) * 4);
    console.log('ConfigureWindow FIXME: Incomplete');
    callback();
  }

  XServerClient.prototype.GetGeometry = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , rep = new x_types.Reply(req);
    rep.data_byte = drawable.depth;

    rep.data.writeUInt32(drawable.getRoot().id, 0);
    rep.data.writeInt16(drawable.x, 4);
    rep.data.writeInt16(drawable.y, 6);
    rep.data.writeInt16(drawable.width, 8);
    rep.data.writeInt16(drawable.height, 10);
    // TODO: 2 byte border-geom
    callback(null, rep);
  }

  XServerClient.prototype.InternAtom = function (req, callback) {
    var only_if_exists = req.data_byte
      , length = req.data.readUInt16(0)
      , name = req.data.toString('ascii', 4, 4 + length)
      , index = this.server.atoms.indexOf(name) + 1;
    if ((!index) && ! only_if_exists)
      index = this.server.atoms.push(name);
    var rep = new x_types.Reply(req)
    rep.data.writeUInt32(index, 0);
    console.log('InternAtom')
    callback(null, rep);
  }

  XServerClient.prototype.ChangeProperty = function (req, callback) {
    var mode = req.data_byte
      , window = this.server.resources[req.data.readUInt32(0)]
      , atom = req.data.readUInt32(4)
      , property = this.server.atoms[atom - 1]
      , type = req.data.readUInt32(8)
      , format = req.data.readUInt8(12)
      , length = req.data.readUInt32(16) * (format === 8 ? 1 : (format === 16 ? 2 : (format === 32) ? 4 : 0))
      , data = req.data.slice(20, length + 20);
    data.endian = this.endian;

    window.changeProperty(property, format, data, mode);

    if (~window.events.indexOf('PropertyChange')) {
      var rep = new x_types.EventPropertyNotify(req, window, atom);
      callback(null, rep);
    }
    callback();
  }

  XServerClient.prototype.DeleteProperty = function (req, callback) {
    var window = this.server.resources[req.data.readUInt32(0)]
      , atom = req.data.readUInt32(4)
      , property = this.server.atoms[atom - 1];

    window.deleteProperty(property);

    if (~window.events.indexOf('PropertyChange')) {
      var rep = new x_types.EventPropertyNotify(req, window, atom, true);
      callback(null, rep);
    }
    callback();
  }


  XServerClient.prototype.GetProperty = function (req, callback) {
    var window = req.data.readUInt32(0)
      , property = req.data.readUInt32(4)
      , type = req.data.readUInt32(8)
      , long_off = req.data.readUInt32(12)
      , long_len = req.data.readUInt32(16);
    console.log('Get Property', window, property);
    var rep = new x_types.Reply(req)
    callback(null, rep);
  }

  XServerClient.prototype.GetSelectionOwner = function (req, callback) {
    var atom_id = req.data.readUInt32(0)
      , atom = this.server.atoms[atom_id]
      , owner = this.server.atom_owners[atom_id]
      , rep = new x_types.Reply(req);
    rep.data.writeUInt32((owner && this.server.resources[owner] && owner) || 0)
    callback(null, rep);
  }

  XServerClient.prototype.GrabServer = function (req, callback) {
    this.server.grabbed = this;
    this.server.grabbed_reason = 'GrabServer';
  }

  XServerClient.prototype.UngrabServer = function (req, callback) {
    this.server.grabbed = null;
    this.server.flushGrabBuffer();
  }

  XServerClient.prototype.QueryPointer = function (req, callback) {
    var window = this.resources[req.data.readUInt32(0)]
      , rep = new x_types.Reply(req);
    rep.data.writeUInt32(0x26, 0);
    rep.data.writeUInt32(0, 4);
    rep.data.writeUInt16(this.server.mouseX, 8);
    rep.data.writeUInt16(this.server.mouseY, 10);
    rep.data.writeUInt16(this.server.mouseX - window.x, 12);
    rep.data.writeUInt16(this.server.mouseY - window.y, 14);
    callback(null, rep);
  }

  XServerClient.prototype.SetInputFocus = function (req, callback) {
    var revert = req.data_byte
      , wid = req.data.readUInt32(0)
      , window = this.server.resources[wid]
      , time = req.data.readUInt32(4) || ~~(Date.now() / 1000);
    if (time < this.server.input_focus_time)
      return;
    switch (wid) {
      case 0:
        this.server.input_focus = null;
      break;
      case 1:
        this.server.input_focus = this.server.root;
      break;
      default:
        this.server.input_focus = window;
    }
    this.server.input_focus_time = time;
    this.server.input_focus_revert = revert;
  }

  XServerClient.prototype.GetInputFocus = function (req, callback) {
    var rep = new x_types.Reply(req);
    rep.data_byte = this.server.input_focus_revert;
    rep.data.writeUInt32((this.server.input_focus === this.server.root ? 1 : this.server.input_focus) || 0, 0);
    callback(null, rep);
  }

  XServerClient.prototype.OpenFont = function (req, callback) {
    var fid = req.data.readUInt32(0)
      , length = req.data.readUInt16(4)
      , name = req.data.toString('ascii', 8, length + 8);
    this.server.grabbed = this;
    this.server.grabbed_reason = 'OpenFont';
    var font = this.server.openFont(fid, name);
    if (font)
      this.server.resources[fid] = font;
    callback();
  }

  XServerClient.prototype.QueryFont = function (req, callback) {
    var fid = req.data.readUInt32(0)
      , font = this.server.resources[fid];
    if (font && !(font instanceof x_types.Font))
      font = font.font;
    if (!font)
      throw new Error('FIXME: Error handling!');
    var rep = new x_types.Reply(req);
    rep.data = new Buffer(32);
    rep.data.endian = req.data.endian;
    font.font.getChar(-1).toCharInfo().writeBuffer(rep.data,  0); // Write min bounds
    font.font.getChar(-2).toCharInfo().writeBuffer(rep.data, 16); // Write max bounds
    // Extra data
    rep.data_extra.push(font.font.toFontInfo());
    rep.data_extra.push(new x_types.UInt32(font.font.characters.length));
    for (var i in font.font.properties)
      rep.data_extra.push(new x_types.FontProp(
          this.server.atoms.indexOf(i)
        , font.font.properties[i]
      ));
    for (var i = 0; i < font.font.characters.length; i++)
      rep.data_extra.push(font.font.getChar(i).toCharInfo());
    callback(null, rep);
  }

  XServerClient.prototype.ListFonts = function (req, callback) {
    var max_names = req.data.readUInt16(0)
      , pattern_length = req.data.readUInt16(2)
      , pattern = req.data.toString('ascii', 4, 4 + pattern_length)
      , fonts = this.server.listFonts(pattern).slice(0, max_names);

    var rep = new x_types.Reply(req);
    rep.data.writeUInt16(fonts.length);
    fonts.forEach(function (font) {
      rep.data_extra.push(new x_types.XString(font));
    });
    callback(null, rep);
  }

  XServerClient.prototype.ListFontsWithInfo = function (req, callback) {
    var max_names = req.data.readUInt16(0)
      , pattern_length = req.data.readUInt16(2)
      , pattern = req.data.toString('ascii', 4, 4 + pattern_length)
      , fonts = this.server.listFonts(pattern).slice(0, max_names);
    console.log('ListFontsWithInfo', pattern);
    if (!fonts.length) {
      var rep = new x_types.Reply(req);
      rep.data_extra.push(new x_types.Nulls(7 * 4));
      return callback(null, rep);
    }
    async.map(
        fonts
      , function (font_name, callback) {
          var resolved_name = this.server.resolveFont(font_name);
          if (resolved_name[1]) {
            var font = this.server.loadFont(resolved_name[1], resolved_name[0], callback);
            if (!font.loading)
              callback(null, font);
            return;
          }
          console.log('Not loading invalid name');
          callback('Not resolved');
        }
      , function (err, fonts) {
          fonts = fonts.filter(function (font) { return font && !font.error });
          this.server.grabbed = false;
          this.server.flushGrabBuffer();
          var reps = fonts.map(function (font) {
            var rep = new x_types.Reply(req);
            rep.data = new Buffer(32);
            rep.data.endian = req.data.endian;
            rep.data_byte = font.name.length;
            font.font.getChar(-1).toCharInfo().writeBuffer(rep.data, 0);
            font.font.getChar(-2).toCharInfo().writeBuffer(rep.data, 16);
            // Extra data
            rep.data_extra.push(font.font.toFontInfo());
            rep.data_extra.push(new x_types.UInt32(fonts.length));
            for (var i in font.font.properties)
              rep.data_extra.push(new x_types.FontProp(
                  this.server.atoms.indexOf(i)
                , font.font.properties[i]
              ));
            rep.data_extra.push(new x_types.String(font.name));
            return rep;
          }.bind(this));
          var rep = new x_types.Reply(req);
          rep.data_extra.push(new x_types.Nulls(7 * 4));
          reps.push(rep);
          callback(null, reps);
        }.bind(this)
    );
  }

  XServerClient.prototype.CreatePixmap = function (req, callback) {
    var depth = req.data_byte
      , pid = req.data.readUInt32(0)
      , drawable = req.data.readUInt32(4)
      , width = req.data.readUInt16(8)
      , height = req.data.readUInt16(10);
    if (this.resources[pid])
      console.log('TODO: Throw error?');
    if (!(drawable = this.resources[drawable]))
      console.log('TODO: Throw error! (No drawable)');
    console.log(drawable.depth, depth);
    if (drawable.depth !== depth && depth !== 1) {
      var rep = new x_types.Error(req, 4, depth);
      console.log('Depth Error');
      callback(null, rep);
    }

    this.resources[pid] = new x_types.Pixmap(pid, depth, drawable, width, height);
    callback();
  }

  XServerClient.prototype.FreePixmap = function (req, callback) {
    var pid = req.data.readUInt32(0);
    if (! (this.resources[pid] instanceof x_types.Pixmap)) {
      var rep = new x_types.Error(req, 2, pid);
      console.log('Error');
      callback(null, rep);
    }
    delete this.resources[pid];
    callback();
  }

  XServerClient.prototype.CreateGC = function (req, callback) {
    var cid = req.data.readUInt32(0)
      , drawable = req.data.readUInt32(4)
      , vmask = req.data.readUInt32(8)
      , vdata = req.data.slice(12);
    vdata.endian = this.endian;
    if (this.resources[cid])
      console.log('TODO: Throw error?');
    if (! this.resources[drawable])
      console.log('TODO: Throw error?', cid, drawable);
    this.resources[cid] = new x_types.GraphicsContext(this, cid, this.resources[drawable], vmask, vdata);
    callback();
  }

  XServerClient.prototype.ChangeGC = function (req, callback) {
    var gc = this.server.resources[req.data.readUInt32(0)]
      , vmask = req.data.readUInt32(4)
      , vdata = req.data.slice(8);
    vdata.endian = this.endian;

    gc.changeData(vmask, vdata);
    callback();
  }

  XServerClient.prototype.ClearArea = function (req, callback) {
    var window = this.resources[req.data.readUInt32(0)]
      , x = req.data.readUInt16(4)
      , y = req.data.readUInt16(6)
      , w = req.data.readUInt16(8) || (window.width - y)
      , h = req.data.readUInt16(10) || (window.height - x);
    var context = window.canvas[0].getContext('2d');
    context.fillStyle = '#fff';
    context.beginPath();
    context.rect(x, y, w, h);
    context.fill();
    callback();
  }

  XServerClient.prototype.FreeGC = function (req, callback) {
    var cid = req.data.readUInt32(0);
    delete this.resources[cid];
    callback();
  }

  XServerClient.prototype.PolySegment = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , gc = this.resources[req.data.readUInt32(4)]
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 2;
    for (var i = 8; i < ((count + 1) * 8); i += 8) {
      var x1 = req.data.readInt16(i)
        , y1 = req.data.readInt16(i + 2)
        , x2 = req.data.readUInt16(i + 4)
        , y2 = req.data.readUInt16(i + 6);
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }
    callback();
  }

  XServerClient.prototype.PolyRectangle = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , gc = this.resources[req.data.readUInt32(4)]
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 2;
    // x, y, width, height
    for (var i = 8; i < ((count + 1) * 8); i += 8) {
      var x = req.data.readInt16(i)
        , y = req.data.readInt16(i + 2)
        , w = req.data.readUInt16(i + 4)
        , h = req.data.readUInt16(i + 6);
      context.beginPath();
      context.rect(x, y, w, h);
      context.stroke();
    }
    callback();
  }

  XServerClient.prototype.FillPoly = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , gc = this.resources[req.data.readUInt32(4)]
      , context = gc.getContext(drawable)
      , shape = req.data.readUInt8(8)
      , coordinate_mode = req.data.readUInt8(9)
      , length = (req.length_quad - 4) * 4
      , coordinates = [];
    // Unused 2
    // 12
    if (coordinate_mode != 0)
      throw new Error('Previous coordinate mode not implemented');
    for (var i = 12; i < length + 12; i += 4)
      coordinates.push([req.data.readUInt16(i), req.data.readUInt16(i + 2)]);

    context.beginPath();
    coordinates.forEach(function (coord, i) {
      if (i == 0 && coordinate_mode == 0) {
        context.moveTo(coord[0], coord[1]);
      } else {
        context.lineTo(coord[0], coord[1]);
      }
    });
//    context.closePath()
    context.fill();

    console.log('FillPoly', drawable, context, coordinates);
    callback();
  }

  XServerClient.prototype.PolyFillRectangle = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , gc = this.resources[req.data.readUInt32(4)]
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 2;
    // x, y, width, height
    for (var i = 8; i < ((count + 1) * 8); i += 8) {
      var x = req.data.readInt16(i)
        , y = req.data.readInt16(i + 2)
        , w = req.data.readUInt16(i + 4)
        , h = req.data.readUInt16(i + 6);
      context.beginPath();
      context.rect(x, y, w, h);
      context.fill();
    }
    callback();
  }

  XServerClient.prototype.PolyFillArc = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , d_w = drawable.canvas[0].width
      , d_h = drawable.canvas[0].height
      , gc = this.resources[req.data.readUInt32(4)]
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 3
      , end = (count * 12) + 8;
    for (var i = 8; i < end; i += 12) {
      var x = req.data.readInt16 (i)
        , y = req.data.readInt16 (i + 2)
        , w = req.data.readUInt16(i + 4)
        , h = req.data.readUInt16(i + 6)
        , aspect = w / h
        , s = (req.data.readInt16 (i + 8) / 64) + 90 // Arc starts at 3 o'clock and each degree is expressed as 64
        , sr = (s * Math.PI) / 180
        , e = (req.data.readInt16 (i + 10) / 64) + s // This is the arc extent, not finishing point
        , er = (e * Math.PI) / 180;

      context.save();
      context.scale(aspect, 1);
      context.beginPath();
      context.arc((x + (w / 2)) / aspect, y + (h / 2), h / 2, sr, er);
      context.restore();
      context.fill();
    }
    callback();
  }

  var _image_formats = ['Bitmap', 'XYPixmap', 'ZPixmap'];
  XServerClient.prototype.PutImage = function (req, callback) {
    var format = _image_formats[req.data_byte]
      , drawable = this.resources[req.data.readUInt32(0)]
      , context = this.resources[req.data.readUInt32(4)]
      , width = req.data.readUInt16(8)
      , height = req.data.readUInt16(10)
      , x = req.data.readInt16(12)
      , y = req.data.readInt16(14)
      , pad = req.data.readUInt8(16)
      , depth = req.data.readUInt8(17)
      , data = req.data.slice(20);
    data.endian = this.endian;
    context['putImage' + format](drawable, data, width, height, x, y, pad, depth);
    console.log('PutImage', req.data.readUInt32(0), req.data.readUInt32(4));
    console.log(format, width, height, x, y, pad, depth);
    callback();
  }

  XServerClient.prototype.PolyText8 = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , gc = this.resources[req.data.readUInt32(4)]
      , count = (req.length_quad / 4) - 1
      , x = req.data.readInt16(8)
      , y = req.data.readInt16(10) - gc.font.font.getChar(-1).ascent
      , textitems = []
      , req_offset = 12;
    for (var i = 0; i < count; i ++) {
      var len = req.data.readUInt8(req_offset);
      if (len === 0)
        break;
      if (len === 255)
        throw new Error('Type 255');
      else {
        var delta = req.data.readInt8(req_offset + 1)
          , start = req_offset + 2
          , end = req_offset + 2 + len
          , str = req.data.toString('ascii', start, end);
        var elem = $('<div />').text(str).css({ top: y, left: x + delta }).addClass('font_' + gc.font.name);
        drawable.element.children().append(elem);
        x += elem.width()
//        x += gc.font.font.drawTo(str, gc.getContext(drawable), x + delta, y, 255, 255, 255);
        req_offset = end + ((end % 4) ? (4 - (end % 4)) : 0);
        if (req_offset + 4 >= req.data.length)
          break;
      }
    }
    callback();
  }

  XServerClient.prototype.PolyText16 = function (req, callback) {
    var drawable = this.resources[req.data.readUInt32(0)]
      , gc = this.resources[req.data.readUInt32(4)]
      , count = (req.length_quad / 4) - 1
      , x = req.data.readInt16(8)
      , y = req.data.readInt16(10) - gc.font.font.getChar(-1).ascent
      , textitems = []
      , req_offset = 12;
    for (var i = 0; i < count; i ++) {
      var len = req.data.readUInt8(req_offset);
      if (len === 0)
        break;
      if (len === 255)
        throw new Error('Type 255');
      else {
        var delta = req.data.readInt8(req_offset + 1)
          , start = req_offset + 2
          , end = req_offset + 2 + (len * 2)
          , str = this.server.encodeString(req.data.toString('2charb', start, end));
        var elem = $('<div />').html(str).css({ top: y, left: x + delta }).addClass('font_' + gc.font.name);
        drawable.element.children().append(elem);
        x += elem.width()
//        x += gc.font.font.drawTo(str, gc.getContext(drawable), x + delta, y, 255, 255, 255);
        req_offset = end + ((end % 4) ? (4 - (end % 4)) : 0);
        if (req_offset + 4 >= req.data.length)
          break;
      }
    }
    callback();
  }

  XServerClient.prototype.QueryColors = function (req, callback) {
    console.log('QueryColors');
    var count = req.length_quad - 2
      , length = count * 4
      , colormap = this.resources[req.data.readUInt32(0)]
      , rep = new x_types.Reply(req);
    rep.data.writeUInt16(count);
    for (var i = 4; i < length + 4; i += 4) {
      var rgb = colormap.getRGB(req.data.readUInt32(i));
      rep.data_extra.push(new x_types.UInt16(rgb[0] * 0x101));
      rep.data_extra.push(new x_types.UInt16(rgb[1] * 0x101));
      rep.data_extra.push(new x_types.UInt16(rgb[2] * 0x101));
      rep.data_extra.push(new x_types.UInt16(0));
    }
    callback(null, rep);
  }

  XServerClient.prototype.CreateGlyphCursor = function (req, callback) {
    var cursor_id = req.data.readUInt32(0)
      , source_font = this.resources[req.data.readUInt32(4)]
      , mask_font = this.resources[req.data.readUInt32(8)]
      , source_char = req.data.readUInt16(12)
      , mask_char = req.data.readUInt16(14)
      , source_char_meta = source_font && source_char && source_font.font.characters[source_char]
      , mask_char_meta = mask_font && mask_char && mask_font.font.characters[mask_char]
      , fore_r = req.data.readUInt16(16)
      , fore_g = req.data.readUInt16(18)
      , fore_b = req.data.readUInt16(20)
      , back_r = req.data.readUInt16(22)
      , back_g = req.data.readUInt16(24)
      , back_b = req.data.readUInt16(26)
      , width = Math.max(
            source_font && source_char_meta.width
          , mask_font && mask_char_meta.width
        )
      , height = Math.max(
            source_font && source_char_meta.height
          , mask_font && mask_char_meta.height
        )
      , x = Math.max(
            source_font && (0 - source_char_meta.left)
          , mask_font   && (0 - mask_char_meta.left)
        )
      , y = Math.max(
            source_font && (source_char_meta.ascent)
          , mask_font   && (mask_char_meta.ascent)
        );
    var canvas = $('<canvas />').attr('width', width).attr('height', height)[0]
      , context = canvas.getContext('2d');
    $('.buffers').append(canvas);
    context.save();
    if (mask_char) {
      var color = (
          ((~~(back_r / 0x100)) << 16) +
          ((~~(back_g / 0x100)) << 8 ) +
          ((~~(back_b / 0x100)) << 0 )
        ).toString(16)
      color = (new Array(7 - color.length)).join(0) + color;
      context.fillStyle = '#' + color;
      context.font = '30px "' + mask_font.file_name + '"';
      context.fillText(
          String.fromCharCode(mask_char)
        , x
        , y
      );
    }
//      mask_char.drawTo(context, x, y, back_r, back_g, back_b);
    var color = (
        ((~~(fore_r / 0x100)) << 16) +
        ((~~(fore_g / 0x100)) << 8 ) +
        ((~~(fore_b / 0x100)) << 0 )
      ).toString(16)
    color = (new Array(7 - color.length)).join(0) + color;
    context.fillStyle = '#' + color;
    if (source_font !== mask_font)
      context.font = '30px "' + source_font.file_name + '"';
    context.fillText(
        String.fromCharCode(source_char)
      , x
      , y
    );
//    source_char.drawTo(context, x, y, fore_r, fore_g, fore_b);
    canvas.id = cursor_id;
    context.restore();
    $('style#cursors')[0].innerText += '\n' + 
      '.cursor_' + cursor_id + ' { ' +
        'cursor: url(' + canvas.toDataURL() + ') ' + x + ' ' + y + ';' +
      '}'
    setTimeout(function () {
      callback();
    }, 20);
  }

  XServerClient.prototype.QueryBestSize = function (req, callback) {
    console.log('QueryBestSize');
    var _class = req.data_byte
      , drawable = this.resources[req.data.readUInt32(0)]
      , width = req.data.readUInt16(4)
      , height = req.data.readUInt16(6);
    var rep = new x_types.Reply(req);
    switch (_class) {
      case 0: // Cursor
        rep.data.writeUInt16(64, 0); // Cursors are always 64x64
        rep.data.writeUInt16(64, 2);
      break;
      default:
        throw new Error('Class not implemented');
    }
    callback(null, rep);
  }

  XServerClient.prototype.QueryExtension = function (req, callback) {
    console.log('QueryExtension - Incomplete');
    var rep = new x_types.Reply(req);
    rep.data.writeUInt8(0, 0);
    rep.data.writeUInt8(req.opcode, 1);
    rep.data.writeUInt8(0, 2);
    rep.data.writeUInt8(0, 3);
    callback(null, rep);
  }

  XServerClient.prototype.ListExtensions = function (req, callback) {
    console.log('ListExtensions');
    var rep = new x_types.Reply(req);
    callback(null, rep);
  }

  function stringPad (string) {
    return string.length + (4 - ((string.length % 4) || 4));
  }

});
