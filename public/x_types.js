window.loaders.push(function () {
  var module = { exports: window.x_types = {} }

  Array.prototype.writeBuffer = function (buffer, offset) {
    this.forEach(function (item) {
      offset = item.writeBuffer(buffer, offset);
    });
    return offset;
  }

  Array.prototype.byteLength = function () {
    return this.reduce(function (p, c) { return p + c.length }, 0);
  }

  function UInt8 (value) {
    this.value = value;
  }
  module.exports.UInt8 = UInt8;
  UInt8.length = UInt8.prototype.length = 1;
  UInt8.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(this.value, offset);
    return offset + this.length;
  }

  function UInt16(value) {
    this.value = value;
  }
  module.exports.UInt16 = UInt16;
  UInt16.length = UInt16.prototype.length = 2;
  UInt16.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt16(this.value, offset);
    return offset + this.length;
  }

  function UInt32 (value) {
    this.value = value;
  }
  module.exports.UInt32 = UInt32;
  UInt32.length = UInt32.prototype.length = 4;
  UInt32.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt32(this.value, offset);
    return offset + this.length;
  }

  function CharInfo (char) {
    this.char = char;
  }
  module.exports.CharInfo = CharInfo;
  CharInfo.length = CharInfo.prototype.length = 12;
  CharInfo.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeInt16(this.char.left,            offset      );
    buffer.writeInt16(this.char.right,           offset  +  2);
    buffer.writeInt16(this.char.width,           offset  +  4);
    buffer.writeInt16(this.char.ascent,          offset  +  6);
    buffer.writeInt16(this.char.descent,         offset  +  8);
    buffer.writeUInt16(this.char.attribues || 0, offset  + 10);
    return offset + this.length;
  }

  function FontInfo (font) {
    this.font = font;
  }
  module.exports.FontInfo = FontInfo;
  FontInfo.length = FontInfo.prototype.length = 16;
  FontInfo.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt16(this.font.min_char_or_byte2   , offset     );
    buffer.writeUInt16(this.font.max_char_or_byte2   , offset + 2 );
    buffer.writeUInt16(this.font.default_char        , offset + 4 );
    var props = Object.keys(this.font.properties);
    buffer.writeUInt16(props.length                  , offset + 6 );
    buffer.writeUInt8 (this.font.draw_direction      , offset + 8 );
    buffer.writeUInt8 (this.font.min_byte1           , offset + 9 );
    buffer.writeUInt8 (this.font.max_byte1           , offset + 10 );
    buffer.writeUInt8 (true                          , offset + 11 );
    var accelerators = this.font.bdf_accelerators || this.font.accelerators;
    buffer.writeInt16 (accelerators.fontAscent       , offset + 12 );
    buffer.writeInt16 (accelerators.fontDescent      , offset + 14 );
    return offset + this.length;
  }

  function FontProp (atom, data) {
    this.atom = atom;
    this.data = typeof data === 'number' ? data : 0;
  }
  module.exports.FontProp = FontProp;
  FontProp.length = FontProp.prototype.length = 8;
  FontProp.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt32(this.atom, offset    );
    buffer.writeInt32 (this.data, offset + 4);
    return offset + this.length;
  }

  function Nulls (count) {
    this.length = count || 1;
  }
  module.exports.Nulls = Nulls;
  Nulls.prototype.writeBuffer = function (buffer, offset) {
    (new Buffer(this.length)).copy(buffer, offset);
    return offset + this.length;
  }

  function XString (string) {
    this.string = string;
  }
  module.exports.XString = XString;
  XString.length = -1;
  XString.prototype.__defineGetter__('length', function () { return this.string.length + 1 });
  XString.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(this.string.length, offset)
    buffer.write(this.string, offset + 1, this.string.length, 'ascii');
    return offset + this.string.length + 1;
  }

  function String (string) {
    this.string = string;
  }
  module.exports.String = String;
  String.length = -1;
  String.prototype.__defineGetter__('length', function () { return this.string.length });
  String.prototype.writeBuffer = function (buffer, offset) {
    buffer.write(this.string, offset, this.string.length, 'ascii');
    return offset + this.string.length;
  }

  function Format (depth, bpp, scanline_pad) {
    this.depth = depth || 0;
    this.bpp = bpp || 0;
    this.scanline_pad = scanline_pad || 0;
    this.length = 8;
  }

  module.exports.Format = Format;

  Format.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(this.depth        , offset);
    buffer.writeUInt8(this.bpp          , offset + 1);
    buffer.writeUInt8(this.scanline_pad , offset + 2);
    // 5 unused
    return offset + this.length;
  }

  function VisualType (visualid, _class, bits_per_rgb, colormap_entries, red_mask, green_mask, blue_mask) {
    this.visualid = visualid || 0;
    this.class = _class || 0;
    this.bits_per_rgb = bits_per_rgb || 0;
    this.colormap_entries = colormap_entries || 0;
    this.red_mask = red_mask || 0;
    this.green_mask = green_mask || 0;
    this.blue_mask = blue_mask || 0;
    this.length = 24;
  }

  module.exports.VisualType = VisualType;

  VisualType.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt32(this.visualid, offset); // 4
    buffer.writeUInt8(this.class, offset + 4); // 1
    buffer.writeUInt8(this.bits_per_rgb, offset + 5); // 1
    buffer.writeUInt16(this.colormap_entries, offset + 6); // 2
    buffer.writeUInt32(this.red_mask, offset + 8); // 4
    buffer.writeUInt32(this.green_mask, offset + 12); // 4
    buffer.writeUInt32(this.blue_mask, offset + 16); // 4
    // 4 unused
    return offset + this.length;
  }

  function Depth (depth, visual_types) {
    this.depth = depth || 0;
    this.visual_types = visual_types || [];
  }

  module.exports.Depth = Depth;

  Depth.prototype.__defineGetter__('length', function () {
    return 8 + this.visual_types.reduce(function (p, c) { return p + c.length }, 0);
  });

  Depth.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(this.depth, offset);
    // 1 unused
    buffer.writeUInt16(this.visual_types.length, offset + 2);
    // 4 unused
    offset += 8;
    offset = this.visual_types.writeBuffer(buffer, offset);
    return offset;
  }

  function Screen (window, colormap, white, black, current_input_masks, width_px, height_px, width_mm, height_mm, maps_min, maps_max, root_visual, backing_stores, save_unders, root_depth, depths) {
    this.window = window || 0;
    this.colormap = colormap || 0;
    this.white = white || 0;
    this.black = black || 0;
    this.current_input_masks = current_input_masks || 0;
    this.height_px = height_px || 0;
    this.width_px = width_px || 0;
    this.height_mm = height_mm || 0;
    this.width_mm = width_mm || 0;
    this.maps_min = maps_min || 0;
    this.maps_max = maps_max || 0;
    this.root_visual = root_visual || 0;
    this.backing_stores = backing_stores || 0;
    this.save_unders = save_unders || 0;
    this.root_depth = root_depth || 0;
    this.depths = depths || [];
  }

  module.exports.Screen = Screen;

  Screen.prototype.__defineGetter__('length', function () {
      return 40 + this.depths.reduce(function (p, c) { return p + c.length }, 0);
  });

  Screen.prototype.hasDepth = function (_depth) {
    return this.depths.map(function (depth) { return depth.depth == _depth }).length !== -1;
  }

  Screen.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt32(this.window, offset);
    buffer.writeUInt32(this.colormap, offset + 4);
    buffer.writeUInt32(this.white, offset + 8);
    buffer.writeUInt32(this.black, offset + 12);
    buffer.writeUInt32(this.current_input_masks, offset + 16);
    buffer.writeUInt16(this.height_px, offset + 20);
    buffer.writeUInt16(this.width_px, offset + 22);
    buffer.writeUInt16(this.height_mm, offset + 24);
    buffer.writeUInt16(this.width_mm, offset + 26);
    buffer.writeUInt16(this.maps_min, offset + 28);
    buffer.writeUInt16(this.maps_max, offset + 30);
    buffer.writeUInt32(this.root_visual, offset + 32);
    buffer.writeUInt8(this.backing_stores, offset + 36);
    buffer.writeUInt8(this.save_unders, offset + 37);
    buffer.writeUInt8(this.root_depth, offset + 38);
    buffer.writeUInt8(this.depths.length, offset + 39);
    return this.depths.writeBuffer(buffer, offset + 40);
  }

  function Request (data, sequence) {
    this.opcode = data.readUInt8(0);
    this.data_byte = data.readUInt8(1);
    this.length_quad = data.readUInt16(2);
    this.length = this.length_quad * 4;
    this.data = data.slice(4, this.length + 4);
    this.data.endian = data.endian;
    this.endian = data.endian;
    this.sequence = sequence;
  }

  Request.sequence = 1;

  module.exports.Request = Request;

  function Reply (request) {
    this.opcode = request.opcode;
    this.sequence = request.sequence;
    this.data_byte = 0;
    this.data = new Buffer(24);
    this.data.endian = request.endian;
    this.data.fill(0);
    this.data_extra = [];
  }

  module.exports.Reply = Reply;

  Reply.prototype.__defineGetter__('length', function () {
    var extra_len = this.data_extra.byteLength();
    return 8 + this.data.length + extra_len + ((extra_len % 4) ? 4 - (extra_len % 4) : 0);
  });

  Reply.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(1                                 , offset     );
    buffer.writeUInt8(this.data_byte                    , offset += 1);
    buffer.writeUInt16(this.sequence                    , offset += 1);
    // Auto pad to multiple of 4
    if ((this.data_extra.byteLength() % 4) !== 0)
      for (var i = 4 - (this.data_extra.byteLength() % 4); i > 0; i--)
        this.data_extra.push(new UInt8(0));
    buffer.writeUInt32((this.data_extra.byteLength() + this.data.length - 24)/ 4, offset += 2);
    this.data.copy(buffer                               , offset += 4);
    return this.data_extra.writeBuffer(buffer           , offset += this.data.length);
  }

  function _Error (req, code, value) {
    this.code = code || 1;
    this.opcode = req.opcode;
    this.opcode_minor = 0;
    this.sequence = req.sequence;
    this.value = value || 0;
    this.length = 32;
  }

  module.exports.Error = _Error;

  _Error.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(0, offset);
    buffer.writeUInt8(this.code, offset + 1);
    buffer.writeUInt16(this.sequence, offset + 2);
    buffer.writeUInt32(this.value, offset + 4);
    buffer.writeUInt16(this.opcode, offset + 8);
    buffer.writeUInt8(this.opcode_minor, offset + 10);
    buffer.fill(0, offset + 11, offset + 32);
    return offset + 32;
  }

  function Event (req, code, detail) {
    this.code = code || 1;
    this.detail = detail || 0;
    this.sequence = req.sequence;
    this.data = new Buffer(28);
    this.data.endian = req.endian;
    this.length = 32;
  }

  module.exports.Event = Event;

  Event.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(this.code, offset);
    buffer.writeUInt8(this.detail, offset + 1);
    buffer.writeUInt16(this.sequence, offset + 2);
    this.data.copy(buffer, offset + 4);
    return offset + 32;
  }

  function EventExpose (req, window, count) {
    Event.call(this, req, 12);
    this.window = window;
    this.x = window.x;
    this.y = window.y;
    this.width = window.width;
    this.height = window.height;
    this.count = count;
  }

  util.inherits(EventExpose, Event);

  module.exports.EventExpose = EventExpose;

  EventExpose.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt16(this.x, 4);
    this.data.writeUInt16(this.y, 6);
    this.data.writeUInt16(this.width, 8);
    this.data.writeUInt16(this.height, 10);
    this.data.writeUInt16(this.count, 12);
    return this.constructor.super_.prototype.writeBuffer.call(this, buffer, offset);
  }

  function EventMapNotify (req, event_window, window) {
    Event.call(this, req, 19);
    this.event_window = event_window;
    this.window = window || event_window;
  }

  util.inherits(EventMapNotify, Event);

  module.exports.EventMapNotify = EventMapNotify;

  EventMapNotify.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(this.event_window.id, 0);
    this.data.writeUInt32(this.window.id, 4);
    this.data.writeUInt8(this.window.override_redirect ? 1 : 0, 8);
    return this.constructor.super_.prototype.writeBuffer.call(this, buffer, offset);
  }

  function EventPropertyNotify (req, window, atom, deleted, timestamp) {
    Event.call(this, req, 28);
    this.window = window;
    this.atom = atom;
    this.timestamp = timestamp || 0; //~~(Date.now() / 1000);
    this.deleted = !!deleted;
  }

  util.inherits(EventPropertyNotify, Event);

  module.exports.EventPropertyNotify = EventPropertyNotify;

  EventPropertyNotify.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt32(this.atom, 4);
    this.data.writeUInt32(this.timestamp, 8);
    this.data.writeUInt8(~~this.deleted, 12);
    return this.constructor.super_.prototype.writeBuffer.call(this, buffer, offset);
  }


  var _gc_vfields = [
      'function' , 'plane_mask' , 'foreground' , 'background'
    , 'line_width' , 'line_style' , 'cap_style' , 'join_style' , 'fill_style' , 'fill_rule'
    , 'tile' , 'stipple', 'tile_stipple_x_origin', 'tile_stipple_y_origin'
    , 'font', 'subwindow_mode', 'graphics_exposures', 'clip_x_origin', 'clip_y_origin', 'clip_mask'
    , 'dash_offset', 'gc_dashes', 'arc_mode'
  ]

  function GraphicsContext (client, id, drawable, vmask, vdata) {
    this.client = client;
    this.id = id;
    this.drawable = drawable;
    this.context = drawable.canvas[0].getContext('2d');
    this.changeData(vmask, vdata);
  }

  module.exports.GraphicsContext = GraphicsContext;

  GraphicsContext.prototype.function = 0;
  GraphicsContext.prototype.plane_mask = 0xff;
  GraphicsContext.prototype.foreground = 0;
  GraphicsContext.prototype.background = 1;
  GraphicsContext.prototype.line_width = 0;
  GraphicsContext.prototype.line_style = 0;
  GraphicsContext.prototype.fill_style = 0;

  GraphicsContext.prototype.__defineSetter__('font', function (fid) {
    this._font = (typeof fid === 'number') ? this.client.server.resources[fid] : '';
  });
  GraphicsContext.prototype.__defineGetter__('font', function () {
    return this._font || null;
  });


  GraphicsContext.prototype.changeData = function (vmask, vdata) {
    var offset = 0;
    for (var i = 0; i < _gc_vfields.length; i++)
      if (vmask & Math.pow(2, i))
        this[_gc_vfields[i]] = vdata.readUInt32((offset ++) * 4);
  }

  GraphicsContext.prototype.getContext = function (drawable) {
    var context = drawable.canvas[0].getContext('2d')
      , rgb = (this.foreground || 0).toString(16);
    if (rgb.length < 8)
      rgb = (new Array(9 - rgb.length)).join('0') + rgb;
    context.fillStyle = '#' + rgb.slice(2);
//    context.webkitImageSmoothingEnabled = false;
    return context;
  }

  GraphicsContext.prototype.putImageBitmap = function (drawable, data, width, height, x, y, pad, depth) {
    var context = this.getContext(drawable)
      , rgba = context.createImageData(width, height);
    switch (this.drawable.depth) {
      case 1:
        for (var i = 0; i < data.length; i++) {
          var dt = data.readUInt8(i);
          for (var j = 0; j < 8; j++) {
            var offset = ((i * 8) + j) * 4;
            var mask = Math.pow(2, j);
            if (offset >= rgba.data.length)
              break;
            rgba.data[offset] = rgba.data[offset + 1] = rgba.data[offset + 2] = ((dt & mask) ? 0xff : 0x00);
            rgba.data[offset + 3] = 0xff;
          }
        }
      break;
    }
    context.putImageData(rgba, x, y);
  }

  GraphicsContext.prototype.putImageXYPixmap = function (drawable, data, width, height, x, y, pad, depth) {
    var scanline = width + (width % 32);
    width = scanline;
    var context = this.getContext(drawable)
      , rgba = context.createImageData(width, height);
    switch (depth) {
      case 1:
        var dt;
        for (var i = 0; i < data.length * 8; i++) {
          var j = i % 8
            , mask = Math.pow(2, j)
            , offset = i * 4;
          if (j == 0)
            dt = data.readUInt8(i / 8);
          if (offset >= rgba.data.length)
            break;
          rgba.data[offset] = rgba.data[offset + 1] = rgba.data[offset + 2] = ((dt & mask) ? 0xff : 0x00);
          rgba.data[offset + 3] = 0xff;
//          if ((i % scanline) >= width) {
//            console.log('skip', offset/4, ((offset / 4) % scanline), (scanline - ((offset / 4) % scanline)) )
//            i += (scanline - (i % scanline)) - 1;
//          }

        }
/*        for (var i = 0; i < data.length; i++) {
          var dt = data.readUInt8(i);
          for (var j = 0; j < 8; j++) {
            var offset = ((i * 8) + j) * 4
              , mask = Math.pow(2, j);
            if (offset >= rgba.data.lenght)
              break;
            rgba.data[offset] = rgba.data[offset + 1] = rgba.data[offset + 2] = ((dt & mask) ? 0xff : 0x00);
            rgba.data[offset + 3] = 0xff;
            if (((offset / 4) % scanline) > width - 1) {
              console.log('skip', offset/4, ((offset / 4) % scanline), (scanline - ((offset / 4) % scanline)) )
              offset += -1 +( (scanline - ((offset / 4) % scanline)) * 4 );
            }
          }
        }*/

      break;
      default:
        throw new Error('depth not implemented');
    }
    context.putImageData(rgba, x, y);
  }

  function Font (id, file_name, name, cb) {
    this.id = id;
    this.file_name = file_name;
    this.css_name = file_name.replace(/\./g, '_');
    this.name = name;
    this.type = file_name.match(/\.([^.]+)$/)[1];
    this.data = null;
    this.loading = true;
    this.loadMeta('fonts/' + file_name, cb);
  }

  module.exports.Font = Font;

  Font.prototype.loadMeta = function (path, cb) {
    getTextFile(path + '.meta.json', function (err, meta) {
      this.loading = false;
      if (err) {
        this.error = true;
        return cb(err);
      }
      try {
        this.font = new font_types.JSON(JSON.parse(meta));
      } catch (e) {
        this.error = true;
        console.error(e);
        return cb(e);
      }
      var height = this.font.getChar(-1);
      height = height.ascent + height.descent - 1;
      if (! $('style#' + this.css_name).length) {
        $('head').append('<style id=' + this.css_name + '>\n' +
          '@font-face { ' +
            'font-family: "' + this.file_name + '"; ' +
            'src: url(\'fonts/' + this.file_name + '.woff\') format(\'woff\'); ' +
          '}\n' +
          '.font_' + this.name + ' { ' +
            'font-family: "' + this.file_name + '"; ' +
            'font-size: ' + height + 'px; ' +
            'line-height: ' + height + 'px; ' +
          '}\n</style>'
        );
        $('.buffers').append($('<p />').addClass('font_' + this.name).addClass('hidden').text('rar'));
      }
      cb();
    }.bind(this));
  }
  Font.prototype.loadData = function (path, cb) {
    getFile(path, function (err, data) {
      this.loading = false;
      if (err) {
        this.error = true;
        return cb(err);
      }
      if (! font_types[this.type.toUpperCase()]) {
        this.error = true;
        return cb('Not valid format');
      }
      if (! data) {
        this.error = true;
        return cb('No data');
      }
      this.font = new font_types[this.type.toUpperCase()](new Buffer(data), 'pcf' );
      cb();
    }.bind(this));
  }

  function Pixmap (id, depth, drawable, width, height) {
    this.id = id;
    this.depth = depth;
    this.drawable = drawable;
    this.width = width;
    this.height = height;
    // FIXME: create correct buffer size for image!
    $('.buffers').append(this.canvas = $('<canvas></canvas>').attr('id', this.id).attr('width', width).attr('height', height));
  }

  module.exports.Pixmap = Pixmap;

  function ColorMap (id, lookup_func) {
    this.id = id;
    this.lookup_func = lookup_func;
  }

  module.exports.ColorMap = ColorMap;

  ColorMap.prototype.getRGB = function (pixel) {
    return this.lookup_func.call(this, pixel);
  }

  var _win_vfields = [
      'background_pixmap', 'background_pixel', 'border_pixmap', 'border_pixel'
    , 'bit_gravity', 'win_gravity'
    , 'backing_store', 'backing_planes', 'backing_pixel'
    , 'override_redirect', 'save_under', 'event_mask', 'do_not_propagate_mask'
    , 'colormap', 'cursor'
  ];
  var _win_vfield_types = [
      'UInt32', 'UInt32', 'UInt32', 'UInt32'
    , 'UInt8', 'UInt8'
    , 'UInt8', 'UInt32', 'UInt32'
    , 'UInt8', 'UInt8', 'UInt32', 'UInt32'
    , 'UInt32', 'UInt32'
  ];

  function Window (owner, id, depth, parent, x, y, width, height, border_width, _class, visual, vmask, vdata) {
    this.owner = owner;
    this.id = id;
    this.depth = depth;
    this.children = [];
    this.parent = parent;
    this.parent.children.push(this);

    this.border_width = border_width;
    this.class = _class;
    this.visual = visual;
    this.events = [];
    this.changeData(vmask, vdata);
    this.properties = {}

    this.element = $('<div class="drawable"><div class="relative"></div></div>').attr('id', 'e' + this.id).css({ width: width, height: height });
    this.element.children().append(this.canvas = $('<canvas></canvas>').attr('id', this.id).attr('width', width).attr('height', height));
    var ctx = this.canvas[0].getContext('2d');
    ctx.rect(0, 0, 1000, 1000);
    ctx.fillStyle = '#fff';
    ctx.fill();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  module.exports.Window = Window;

  Window.prototype.__defineGetter__('x', function () { return this._x });
  Window.prototype.__defineGetter__('y', function () { return this._x });
  Window.prototype.__defineSetter__('x', function (x) { this._x = x; this.element.css('left', x + 'px') });
  Window.prototype.__defineSetter__('y', function (y) { this._y = y; this.element.css('top' , y + 'px') });
  Window.prototype.__defineGetter__('width' , function () { return this._width  });
  Window.prototype.__defineGetter__('height', function () { return this._height });
  Window.prototype.__defineSetter__('width' , function (width)  { this._width  = width;  this.element.css('width',  width).children().children('canvas').attr('width', width)  });
  Window.prototype.__defineSetter__('height', function (height) { this._height = height; this.element.css('height', height).children().children('canvas').attr('height', height) });

  var _event_mask_fields = [
      'KeyPress', 'KeyRelease', 'ButtonPress', 'ButtonRelease', 'EnterWindow', 'LeaveWindow'
    , 'PointerMotion', 'PointerMotionHint', 'Button1Motion', 'Button2Motion', 'Button3Motion', 'Button4Motion', 'Button5Motion', 'ButtonMotion'
    , 'KeymapState', 'Exposure', 'VisibilityChange', 'StructureNotify', 'ResizeRedirect', 'SubstructureNotify', 'SubstructureRedirect'
    , 'FocusChange', 'PropertyChange', 'ColormapChange', 'OwnerGrabButton'
  ];
  Window.prototype.__defineSetter__('event_mask', function (event_mask) {
    this.events = _event_mask_fields.filter(function (mask, i) {
      return event_mask & Math.pow(2, i);
    });
    this._event_mask = event_mask;
  });
  Window.prototype.__defineGetter__('event_mask', function () {
    return this._event_mask || 0;
  });

  Window.prototype.map = function () {
    if (this.element[0].parentElement)
      return;
    this.parent.element.children().append(this.element);
    return true;
  }

  Window.prototype.unmap = function () {
    if (! this.element.parentElement)
      return;
    this.element.remove();
    return true;
  }

  Window.prototype.isMapped = function () {
    return !!(this.element && this.element[0].parentNode && this.parent && (!this.parent.id || this.parent.isMapped()));
  }

  Window.prototype.getRoot = function () {
    var current = this;
    while (current.parent && current.parent.id)
      current = current.parent;
    return current;
  }

  Window.prototype.changeData = function (vmask, vdata) {
    var offset = 0;
    for (var i = 0; i < _gc_vfields.length; i++)
      if (vmask & Math.pow(2, i)) {
        this[_win_vfields[i]] = vdata['read' + _win_vfield_types[i]](offset);
        offset += 4;
      }
  }

  // FIXME: Unused due to differing reply format to send format!
  Window.prototype.getData = function () {
    var data = new Buffer(_win_vfield_types.map(function (name) { return x_types[name] }).reduce(function (o, v) { return o + v }));
    for (var i = 0; i < _gc_vfields.length; i++) {
      data['write' + _win_vfield_types[i]](this[_win_vfields[i]], offset);
      offset += x_types[_win_vfield_types[i]].length;
    }
  }

  Window.prototype.changeProperty = function (property, format, data, mode) {
    mode = mode || 0;
    var old;
    switch (mode) {
      case 0: // Replace
        this.properties[property] = data;
        this.properties[property].format = format;
        break;
      case 1: // Prepend
        if (this.properties[property].format != format)
          throw new Error('Invalid format for this property')
        this.properties[property] = new Buffer((old = this.properties[property]).length + data.length);
        this.properties[property].endian = data.endian;
        data.copy(this.properties[property]);
        old.copy (this.properties[property], data.length);
        break;
      case 2: // Append
        if (this.properties[property].format != format)
          throw new Error('Invalid format for this property')
        this.properties[property] = new Buffer((old = this.properties[property]).length + data.length);
        this.properties[property].endian = data.endian;
        old.copy (this.properties[property]);
        data.copy(this.properties[property], old.length);
        break;
    }
  }

  Window.prototype.deleteProperty = function (property) {
    if (property in this.properties) {
      delete this.properties[property];
      return true;
    }
    return false;
  }
});
