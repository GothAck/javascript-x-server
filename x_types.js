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

function Request (data) {
  this.opcode = data.readUInt8(0);
  this.data_byte = data.readUInt8(1);
  this.length_quad = data.readUInt16(2);
  this.length = this.length_quad * 4;
  this.data = data.slice(4);
  this.data.endian = data.endian;
  this.sequence = Request.sequence ++;
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

function Window(id) {
  this.id = id;
  this.properties = {}
}

module.exports.Window = Window;
