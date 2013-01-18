var Canvas = require('canvas');

Buffer.prototype.endian = null

Object.keys(Buffer.prototype).filter(function (name) { return /(BE|LE)$/.test(name) }).map(function (name) { return name.slice(0, -2) })
  .forEach(function (name) {
    Buffer.prototype[name] = function () {
      if (! this.endian) throw new Error('No endian');
      return this[name + this.endian].apply(this, arguments);
    }
  });

var awb_open = 0;
Array.prototype.writeBuffer = function (buffer, offset) {
  this.forEach(function (item) {
    offset = item.writeBuffer(buffer, offset);
  });
  return offset;
}

Array.prototype.byteLength = function () {
  return this.reduce(function (p, c) { return p + c.length }, 0);
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
  this.data = data.slice(4);
  this.data.endian = data.endian;
  this.sequence = sequence;
}

Request.sequence = 1;

module.exports.Request = Request;

function Reply (request) {
  this.opcode = request.opcode;
  this.sequence = request.sequence;
  this.data_byte = 0;
  this.data = new Buffer(24);
  this.data.endian = request.data.endian;
  this.data.fill(0);
  this.data_extra = [];
}

module.exports.Reply = Reply;

Reply.prototype.__defineGetter__('length', function () {
  return 32 + this.data_extra.byteLength();
});

Reply.prototype.writeBuffer = function (buffer, offset) {
  buffer.writeUInt8(1, offset);
  buffer.writeUInt8(this.data_byte, offset + 1);
  buffer.writeUInt16(this.sequence, offset + 2);
  buffer.writeUInt32(this.data_extra.byteLength() / 4, offset + 4);
  this.data.copy(buffer, offset + 8);
  return this.data_extra.writeBuffer(buffer, offset + 8 + 24);
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

var _gc_vfields = [
    'function' , 'plane_mask' , 'foreground' , 'background'
  , 'line_width' , 'line_style' , 'cap_style' , 'join_style' , 'fill_style' , 'fill_rule'
  , 'tile' , 'stipple', 'tile_stipple_x_origin', 'tile_stipple_y_origin'
  , 'font', 'subwindow_mode', 'graphics_exposures', 'clip_x_origin', 'clip_y_origin', 'clip_mask'
  , 'dash_offset', 'gc_dashes', 'arc_mode'
]

function GraphicsContext (id, drawable, vmask, vdata) {
  this.id = id;
  this.drawable = drawable;
  this.context = drawable.canvas.getContext('2d');
  var offset = 0;
  for (var i = 0; i < _gc_vfields.length; i++)
    if (vmask & Math.pow(2, i))
      this[_gc_vfields[i]] = vdata.readUInt32((offset ++) * 4);

  console.log('Created GC', this);
}

module.exports.GraphicsContext = GraphicsContext;

GraphicsContext.prototype.putImage = function (data, width, height, x, y) {
  var rgba = this.context.createImageData(width, height);
  switch (this.drawable.depth) {
    case 1:
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < 8; j++) {
          var offset = ((i * 8) + j) * 4;
          var mask = Math.pow(2, j);
          if (offset >= rgba.data.length)
            break;
          rgba.data[offset] = rgba.data[offset + 1] = rgba.data[offset + 2] = ((data[i] & mask) ? 0xff : 0x00);
          rgba.data[offset + 3] = 0xff;
        }
      }
    break;
  }
  this.context.putImageData(rgba, x, y);
}

function Pixmap (id, depth, drawable, width, height) {
  this.id = id;
  this.depth = depth;
  this.drawable = drawable;
  this.width = width;
  this.height = height;
  // FIXME: create correct buffer size for image!
  this.canvas = new Canvas(width, height);
  console.log('Created Pixmap', this);
}

module.exports.Pixmap = Pixmap;

var _win_vfields = [
    'background_pixmap', 'background_pixel', 'border_pixmap', 'border_pixel'
  , 'bit_gravity', 'win_gravity'
  , 'backing_store', 'backing_planes', 'backing_pixel'
  , 'override_redirect', 'save_under', 'event_mask', 'do_not_propagate_mask'
  , 'colormap', 'cursor'
];

function Window (id, depth, parent, x, y, width, height, border_width, _class, visual, vmask, vdata) {
  this.id = id;
  this.depth = depth;
  this.parent = parent;
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.border_width = border_width;
  this.class = _class;
  this.visual = visual;
  var offset = 0;
  for (var i = 0; i < _gc_vfields.length; i++)
    if (vmask & Math.pow(2, i))
      this[_win_vfields[i]] = vdata.readUInt32((offset ++) * 4);

  this.properties = {}
  this.canvas = new Canvas(width, height);
}

module.exports.Window = Window;

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
