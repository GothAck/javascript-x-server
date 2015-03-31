/**
 * Copyright Greg Miell 2013-present
 * @flow weak
 */
import * as fs from "fs";
import * as EndianBuffer from "endianbuffer";
import * as events from "event_types";
import * as v6 from "lib/ipv6";
export * from "x_types_font";
export {events};

export class ExtrasArray {
  constructor(...args: Array<mixed>) {
    this._array = new Array(...args);
  }
  get(index: number) {
    return this._array[index];
  }
  set(index: number, value: ?mixed) {
    this._array[index] = value;
    return this;
  }
  push(...args: Array<mixed>) {
    return this._array.push(...args)
  }
  reduce(func: Function, initial?: mixed) {
    return this._array.reduce(func, initial);
  }
  map(func: Function, bind?: mixed) {
    return this._array.map(func, bind);
  }
  forEach(func: Function, bind?: mixed) {
    this._array.forEach(func, bind);
  }
  filter(func: Function, bind?: mixed) {
    return new ExtrasArray(this._array.filter(func, bind));
  }
  writeBuffer(buffer: EndianBuffer, offset: number) {
    return this.reduce((o, item) => item.writeBuffer(buffer, o), offset);
  }
  get length() {
    return this._array.length;
  }
  get byte_length() {
    return this.reduce((l, item) => l + item.length, 0);
  }
}

export class UInt8 {
  constructor(value) {
    this.value = value;
  }
  length = 1;
  writeBuffer(buffer, offset) {
    buffer.writeUInt8(this.value, offset);
    return offset + this.length;
  }
}

export class UInt16 {
  constructor(value) {    
    this.value = value;
  }
  length = 2;
  writeBuffer(buffer, offset) {
    buffer.writeUInt16(this.value, offset);
    return offset + this.length;
  }
}

export class UInt32 {
  constructor(value) {    
    this.value = value;
  }
  length = 4;
  writeBuffer(buffer, offset) {
    buffer.writeUInt32(this.value, offset);
    return offset + this.length;
  }
}

export class Nulls {
  constructor(count) {    
    this.length = count || 1;
  }
  writeBuffer(buffer, offset) {
    (new EndianBuffer(this.length)).copy(buffer, offset);
    return offset + this.length;
  }
}

export class XString {
  constructor(string) {    
    if ('string' !== typeof string)
      throw new window.Error('XString: This is not a string' + (typeof string))
    this.string = string;
  }
  get length() {
    return this.string.length + 1;
  }
  writeBuffer(buffer, offset) {
    buffer.writeUInt8(this.string.length, offset);
    buffer.write(this.string, offset + 1, this.string.length, 'ascii');
    return offset + this.string.length + 1;
  }
}

class NewString extends String {
  constructor(string) {
    super(string);
  }
  writeBuffer(buffer, offset) {
    buffer.write(this.string, offset, this.string.length, 'ascii');
    return offset + this.length;
  }
  static encodeString(str) {
    var out_str = '';
    if (typeof str !== 'string')
      return str;
    for (let i = 0; i < str.length; i++) {
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
  }
}

exports.String = NewString;

export class DataBuffer {
  constructor(buffer) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = new EndianBuffer(buffer);
    } else {
      this.buffer = buffer;
    }
  }
  get length() {
    return this.buffer.length;
  }
  writeBuffer(buffer, offset) {
    this.buffer.copy(buffer, offset);
    return offset + this.length;
  }
}

export class Format {
  constructor(depth, bpp, scanline_pad) {
    this.depth = depth || 0;
    this.bpp = bpp || 0;
    this.scanline_pad = scanline_pad || 0;
  }
  length = 8;
  writeBuffer(buffer, offset) {
    buffer.writeUInt8(this.depth, offset);
    buffer.writeUInt8(this.bpp, offset + 1);
    buffer.writeUInt8(this.scanline_pad, offset + 2);
    // 5 unused
    return offset + this.length
  }
}

export class VisualType {
  constructor(
    visualid,
    _class,
    bits_per_rgb,
    colormap_entries,
    red_mask,
    green_mask,
    blue_mask
  ) {
    this.visualid = visualid || 0;
    this.class = _class || 0;
    this.bits_per_rgb = bits_per_rgb || 0;
    this.colormap_entries = colormap_entries || 0;
    this.red_mask = red_mask || 0;
    this.green_mask = green_mask || 0;
    this.blue_mask = blue_mask || 0;
  }
  length = 24;
  writeBuffer(buffer, offset) {
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
}

export class Depth {
  constructor(depth, visual_types) {
    this.depth = depth || 0;
    this.visual_types = new ExtrasArray();
    if (Array.isArray(visual_types)) {
      this.visual_types.push(...visual_types);
    }
  }
  get length() {
    return 8 + this.visual_types.reduce((p, c) => {
      return p + c.length;
    }, 0);
  }
  writeBuffer(buffer, offset) {
    buffer.writeUInt8(this.depth, offset);
    // 1 unused
    buffer.writeUInt16(this.visual_types.length, offset + 2);
    // 4 unused
    offset += 8;
    offset = this.visual_types.writeBuffer(buffer, offset);
    return offset;
  }
}

export class Screen {
  constructor(
    window,
    colormap,
    white,
    black,
    current_input_masks,
    width_px,
    height_px,
    width_mm,
    height_mm,
    maps_min,
    maps_max,
    root_visual,
    backing_stores,
    save_unders,
    root_depth,
    depths
  ) {
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
    this.depths = new ExtrasArray();
    if (Array.isArray(depths)) {
      this.depths.push(...depths);
    }
  }
  get length() {
    return 40 + this.depths.reduce((p, c) => {
      return p + c.length;
    }, 0);
  }
  hasDepth(_depth) {
    return this.depths.some((depth) => depth.depth == _depth);
  }
  writeBuffer(buffer, offset) {
    buffer.writeUInt32(this.window, offset);
    buffer.writeUInt32(this.colormap, offset + 4);
    buffer.writeUInt32(this.white, offset + 8);
    buffer.writeUInt32(this.black, offset + 12);
    buffer.writeUInt32(this.current_input_masks, offset + 16);
    buffer.writeUInt16(this.width_px, offset + 20);
    buffer.writeUInt16(this.height_px, offset + 22);
    buffer.writeUInt16(this.width_mm, offset + 24);
    buffer.writeUInt16(this.height_mm, offset + 26);
    buffer.writeUInt16(this.maps_min, offset + 28);
    buffer.writeUInt16(this.maps_max, offset + 30);
    buffer.writeUInt32(this.root_visual, offset + 32);
    buffer.writeUInt8(this.backing_stores, offset + 36);
    buffer.writeUInt8(this.save_unders, offset + 37);
    buffer.writeUInt8(this.root_depth, offset + 38);
    buffer.writeUInt8(this.depths.length, offset + 39);
    return this.depths.writeBuffer(buffer, offset + 40);
  }
}

export class Request {
  constructor(data, sequence) {
    this.opcode = data.readUInt8(0);
    this.data_byte = data.readUInt8(1);
    this.length_quad = data.readUInt16(2);
    this.length = this.length_quad * 4;
    this.data = data.slice(4, this.length + 4);
    this.data.endian = data.endian;
    this.endian = data.endian;
    this.sequence = sequence;
  }
  get length() {
    return this.length_quad * 4;
  }
}

export class WorkReply {
  constructor(request) {
    this.opcode = request.opcode;
    this.sequence = request.sequence;
  }
}

export class Reply {
  constructor(request) {
    this.endian = request.endian;
    this.opcode = request.opcode;
    this.sequence = request.sequence;
    this.data_byte = 0;
    this.data = new EndianBuffer(24);
    this.data.endian = request.endian;
    this.data.fill(0);
    this.data_extra = new ExtrasArray();
  }
  get length() {
    var extra_len = Math.ceil(this.data_extra.byte_length / 4) * 4;
    return 8 + this.data.length + extra_len;
  }
  writeBuffer(buffer, offset) {
    // console.errorb(buffer.length, offset)
    if (offset >= buffer.length) {
      console.error('Waaaa', offset, buffer.length)
    }
    buffer.writeUInt8(1, offset     );
    buffer.writeUInt8(this.data_byte, offset += 1);
    buffer.writeUInt16(this.sequence, offset += 1);
    // Auto pad to multiple of 4
    if ((this.data_extra.byte_length % 4) !== 0)
      for (var i = 4 - (this.data_extra.byte_length % 4); i > 0; i--)
        this.data_extra.push(new UInt8(0));
    buffer.writeUInt32((this.data_extra.byte_length + this.data.length - 24)/ 4, offset += 2);
    this.data.copy(buffer, offset += 4);
    return this.data_extra.writeBuffer(buffer, offset += this.data.length);
  }
  toBuffer() {
    console.log(this.length);
    var buffer = new EndianBuffer(this.length);
    buffer.endian = this.data.endian;
    this.writeBuffer(buffer, 0);
    return buffer;
  }
}

export class XError extends Error {
  constructor(req, code, value) {
    super();
    this.endian = req.endian;
    this.code = code || 1;
    this.opcode = req.opcode;
    this.opcode_minor = 0;
    this.sequence = req.sequence & 0xffff;
    this.value = value || 0;
    this.length = 32;
  }

  writeBuffer(buffer, offset) {
    buffer.writeUInt8(0, offset);
    buffer.writeUInt8(this.code, offset + 1);
    buffer.writeUInt16(this.sequence, offset + 2);
    buffer.writeUInt32(this.value, offset + 4);
    buffer.writeUInt16(this.opcode_minor, offset + 8);
    buffer.writeUInt8(this.opcode, offset + 10);
    buffer.fill(0, offset + 11, offset + 32);
    return offset + 32;
  }
  
  toBuffer() {
    var buffer = new EndianBuffer(this.length);
    buffer.endian = this.endian;
    this.writeBuffer(buffer, 0);
    return buffer;
  }
}

exports.Error = XError;

var _gc_vfields = [
    'function' , 'plane_mask' , 'foreground' , 'background'
  , 'line_width' , 'line_style' , 'cap_style' , 'join_style' , 'fill_style' , 'fill_rule'
  , 'tile' , 'stipple', 'tile_stipple_x_origin', 'tile_stipple_y_origin'
  , 'font', 'subwindow_mode', 'graphics_exposures', 'clip_x_origin', 'clip_y_origin', 'clip_mask'
  , 'dash_offset', 'gc_dashes', 'arc_mode'
]

export class GraphicsContext {
  constructor(owner, id, drawable, fields) {
    this.function = 0;
    this.plane_mask = 0xff;
    this.foreground = 0;
    this.background = 0x00ffffff;
    this.line_width = 0;
    this.line_style = 0;
    this.fill_style = 0;
    this.graphics_exposures = true;
    this.owner = owner;
    this.id = id;
    this.drawable = drawable;
    this.context = drawable.canvas[0].getContext('2d');
    this.changeFields(owner, fields);
    this.x = 0;
    this.y = 0;
  }
  get font() {
    return this._font || null;
  }
  set font(fid) {
    if (fid) {
      this._font = this.owner.server.resources[fid];
    }
  }
  get clip_mask() {
    return this._clip_mask;
  }
  set clip_mask(did) {
    if (! did)
      return this._clip_mask = null;
    this._clip_mask = this.owner.server.resources[did];
    return;
    this._clip_mask_data = this._clip_mask.canvas[0].getContext('2d').getImageData(0, 0, this._clip_mask.width, this._clip_mask.height);
    for (var i = 3; i < this._clip_mask_data.data.length; i += 4) {
      this._clip_mask_data.data[i] = this._clip_mask_data.data[i-1];
    }
    this._clip_mask_alpha = this._clip_mask.canvas.clone();
    this._clip_mask_alpha[0].getContext('2d').putImageData(this._clip_mask_data, 0, 0);
  }

  destroy() {
    delete this.owner.server.resources[this.id];
  }

  changeFields(owner, fields) {
    this._currentClient = owner;
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) {
        this[key] = fields[key];
      }
    }
    this._currentClient = null;
  }

  copyTo(dst, fields) {
    for (var i in fields) {
      dst[fields[i]] = this[fields[i]];
    }
  }

  getContext(drawable) {
    var context = drawable.canvas[0].getContext('2d')
      , rgb = (this.foreground || 0).toString(16);
    if (rgb.length < 8)
      rgb = (new Array(9 - rgb.length)).join('0') + rgb;
    context.restore();
    context.save();
    context.translate(0.5, 0.5);
    context.webkitImageSmoothingEnabled = false;
    context.fillStyle = '#' + rgb.slice(2);
    context.strokeStyle = context.fillStyle;
    if (this.font) {
      context.font = this.font.height + 'px "' + this.font.file_name + '"';
    }
//    context.webkitImageSmoothingEnabled = false;
    return context;
  }

  putImage(drawable, format, data, width, height, x, y, pad, depth) {
    drawable.putImageData(this.owner['imageFrom' + format](drawable.createImageData(width, height), data, depth, width, height, pad), x, y);
  }

  putImageBitmap(drawable, data, width, height, x, y, pad, depth) {
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
}

GraphicsContext.error_code = 13;

export class Drawable {
  constructor(owner, depth, width, height) {
    this.owner = owner;
    this.depth = depth;
    this.canvas = $('<canvas></canvas>');
    this.width = width;
    this.height = height;
  }
  get width() {
    return this._width;
  }
  set width(width) {
    this._width = width;
    this.canvas.attr('width', width);
  }
  get height() {
    return this._height;
  }
  set height(height) {
    this._height = height;
    this.canvas.attr('height', height);
  }
  getRoot() {
    return (this.owner.server || this.owner).root;
  }
  destroy() {
  }

  getImageData(x, y, width, height) {
    return this.canvas[0].getContext('2d').getImageData(x, y, width, height);
  }

  putImageData(data, x, y) {
    return this.canvas[0].getContext('2d').putImageData(data, x, y);
  }

  createImageData(width, height) {
    return this.canvas[0].getContext('2d').createImageData(width, height);
  }
}

Drawable.error_code = 9;

export class Pixmap extends Drawable {
  constructor(owner, id, depth, drawable, width, height) {
    super(owner, depth, width, height);
    this.id = id;
    this.drawable = drawable;
    // FIXME: create correct buffer size for image!
    $('.buffers').append(this.canvas.attr('id', this.id));
  }
}

Pixmap.error_code = 4;

export class ColorMap {
  constructor(id, lookup_func) {
    this.id = id;
    this.lookup_func = lookup_func;
  }
  getRGB(pixel) {
    return this.lookup_func.call(this, pixel);
  }
}

ColorMap.error_code = 12;

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

export class Window extends Drawable {
  constructor(owner, id, depth, x, y, width, height, border_width, _class, visual, fields) {
    fields = fields || {}
    this.id = id;
    this.element = $('<div class="drawable" tabindex="0"><div class="relative"></div></div>')
        .attr('id', 'e' + this.id)
        .attr('owner', owner.id)
        .data('xob', this);
    console.log('Drawablesuper', this);
    super(owner, depth, width, height);
    this.border_width = border_width;
    this.class = _class;
    this.visual = visual;
    this.events = [];
    this.events.mask = 0;
    this.event_clients = {};
    this.element.css('display', 'none');
    this.element.children().append(this.canvas.attr('id', this.id));
    this.changeFields(owner, fields);
    this.properties = {}
//    var ctx = this.canvas[0].getContext('2d');
    this.x = x;
    this.y = y;
  }

  destroy() {
    delete this.owner.server.resources[this.id];
    this.triggerEvent('DestroyNotify');
  }

  sendEvent(event, data, event_mask) {
    console.log('Window.sendEvent', event, data, event_mask);
    if (event instanceof events.XEvent)
      event_mask = data;
    else
      event = new events.map[event](this, data || {});
    console.log('sendEvent', event, data, event_mask);
    event.send_event = true;
    return this.element.trigger('SendEvent', { event: event, event_mask: event_mask });
  }

  triggerEvent(event, data) {
    if (! (event instanceof events.XEvent))
      event = new events.map[event](this, data || {});
    //var des = (event.dom_events || []).slice(0);
    //des.push(event.constructor.name);
    //console.log(self.element.parents('body').length);
    //console.log('.' + des.join(',.'));
    //console.log(self.element.parentsUntil('#eventfilter').andSelf().filter('.' + des.join(',.')).length)
    if (event.dom_events)
      return event.dom_events.forEach((dom_event) => {
        this.element.trigger(dom_event, [event]);
      });
    return this.element.trigger(event.constructor.name, [event]);
  }

  onEvent(event, data) {
//    if (~this.events.indexOf(event)) {
    if (event instanceof events.XEvent) {
      if (event.testReady())
        Object.keys(this.event_clients).forEach((k) => {
          if (~ this.event_clients[k].indexOf(event.event_type)) {
            if (! this.owner.server.clients[k])
              return delete this.event_clients[k];
            this.owner.server.clients[k].sendEvent(event);
          }
        });
      return;
    }
    if (data instanceof events.XEvent) {
      if (event === 'SendEvent') {
        event = data;
        if (event.testReady())
          this.owner.sendEvent(event)
        return;
      }
    }

    if (this.owner instanceof (require('x_client'))) {
      this.owner.reps.push(
        events.map[event]
          ? new events.map[event](event, this, data)
          : null
      );
      return this.owner.processReps();
    }
    if (this.owner instanceof (require('x_server'))) {
      // Do X Server Events
    }
//    }
  }

  map() {
    if (this.element.css('display') !== 'none')
      return;
    this.element.css('display', 'block');
    this.triggerEvent('MapNotify');
    return true;
  }

  unmap() {
    if (this.element.css('display') === 'none')
      return;
    this.element.css('display', 'none');
    this.triggerEvent('UnmapNotify');
    return true;
  }

  isMapped() {
    return !!(this.element && this.element.css('display') !== 'none')
    return !!(this.element && this.element[0].parentNode && this.parent && (!this.parent.id || this.parent.isMapped()));
  }

  getRoot() {
    var current = this;
    while (current.parent && current.parent.id)
      current = current.parent;
    return current;
  }

  getParents(until) {
    var parents = [];
    while (current.parent && current.parent.id && current.parent !== until)
      parents.push(current = current.parent);
    return parents;
  }

  isChildOf(window) {
    return window.element.find(this.element).length > 0;
  }

  changeFields(owner, fields) {
    this._currentClient = owner;
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) {
        this[key] = fields[key];
      }
    }
    this._currentClient = null;
    // var server = this.owner.server || this.owner;
    // this.element.css('background-color', server.resources[server.screens[0].colormap].lookup_func(this.background_pixel, 'hex'));
  }

  // FIXME: Unused due to differing reply format to send format!
  getData() {
    var data = new EndianBuffer(_win_vfield_types
      .map((name) => x_types[name])
      .reduce((o, v) => o + v));
    for (var i = 0; i < _gc_vfields.length; i++) {
      data['write' + _win_vfield_types[i]](this[_win_vfields[i]], offset);
      offset += x_types[_win_vfield_types[i]].length;
    }
  }

  changeProperty(atom, property, format, type, data, mode) {
    mode = mode || 0;
    var old;
    switch (mode) {
      case 0: // Replace
        this.properties[property] = data;
        this.properties[property].format = format;
        this.properties[property].type = type;
        break;
      case 1: // Prepend
        if (this.properties[property].format != format)
          throw new Error('Invalid format for this property')
        this.properties[property] = new EndianBuffer((old = this.properties[property]).length + data.length);
        this.properties[property].endian = data.endian;
        data.copy(this.properties[property]);
        old.copy (this.properties[property], data.length);
        break;
      case 2: // Append
        if (this.properties[property].format != format)
          throw new Error('Invalid format for this property')
        this.properties[property] = new EndianBuffer((old = this.properties[property]).length + data.length);
        this.properties[property].endian = data.endian;
        old.copy (this.properties[property]);
        data.copy(this.properties[property], old.length);
        break;
    }
    this.triggerEvent('PropertyNotify', { atom: atom, deleted: false });
  }

  setProperty(property, value) {
    this.properties[property] = value;
    this.triggerEvent('PropertyNotify', { atom: this.owner.server.getAtom(property), deleted: false });
  }

  getProperty(property) {
    return this.properties[property];
  }

  deleteProperty(property) {
    if (property in this.properties) {
      delete this.properties[property];
      return true;
    }
    return false;
  }

  get children() {
    return Array.prototype.slice.call(
      this.element.children().children().map((i, e) => $(e).data('xob')));
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._x;
  }
  set x(x) {
    this._x = x;
    this.element.css('left', x + 'px');
  }
  set y(y) {
    this._y = y;
    this.element.css('top' , y + 'px');
  }

  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  set width(width) {
    super.width = width;
    this.element.css('width', width);
  }
  set height(height) {
    super.height = height;
    this.element.css('height', height);
  }
  set parent(parent) {
    this._parent = parent;
    parent.element.children().append(this.element);
  }
  get parent() {
    return this._parent;
  }
  get input_output() {
    if (this._parent) {
      if (this.class) {
        return !(this.class - 1);
      }
      this._parent.input_output;
    }
    return this.class;
  }
  set cursor(cursor) {
    if (this._cursor) {
      this.element.removeClass('cursor_' + this._cursor);
    }
    this.element.addClass('cursor_' + cursor);
    this._cursor = cursor;
  }
  set background_pixel(pixel) {
    this._background_pixel = pixel;
    pixel = pixel.toString(16);
    if (pixel.length < 6) {
      pixel = (new Array(7 - pixel.length)).join('0') + pixel;
    }
    this.element.css('background-color', '#' + pixel.slice(0, 6));
  }
  get background_pixel() {
    return this._background_pixel;
  }
  processEventMask(_mask) {
    return Window._event_mask_fields.filter((mask, i) => _mask & (1 << i));
  }
  set event_mask(event_mask) {
    var set_client = this._currentClient;
    this.event_clients[set_client.id] = this.processEventMask(event_mask);
    this.event_clients[set_client.id].mask = event_mask;
    
    console.log(
        'Window.event_mask set'
      , set_client.id
      , this.event_clients[set_client.id].join(', ')
      , this.event_clients[set_client.id].mask
      , this.event_clients[set_client.id].mask.toString(2)
    ) 

    event_mask = Object.keys(this.event_clients)
      .map((client_id) => this.event_clients[client_id].mask)
      .reduce((val, mask) => val | mask);
    this.events = this.processEventMask(event_mask);
    this.events.mask = event_mask;

    this.element.removeClass(Window._event_mask_fields.join(' '));
    this.element.addClass(this.events.join(' '));
  }
  get event_mask() {
    var set_client = this._currentClient;
    //TODO: Return correct event_mask
    return this.events.mask || 0;
  }
  set do_not_propagate_mask(event_mask) {
    this.do_not_propagate_events = Window._do_not_propagate_mask_fields
      .filter((mask, i) => event_mask & Math.pow(2, i));
    this._do_not_propagate_event_mask = event_mask;
    this.element.removeClass(_do_not_propagate_mask_fields.join(' '));
    this.element.addClass(this.do_not_propagate_events.join(' '));
  }
  get do_not_propagate_mask() {
    return this._do_not_propagate_event_mask || 0;
  }
  set colormap(colormap) {
    this._colormap = (typeof colormap === 'number')
      ? this.owner.server.resources[colormap]
      : colormap;
  }
  get colormap() {
    return this._colormap;
  }
  set win_gravity(grav) {
    this._win_gravity = Window._window_win_gravity[grav || 0];
  }
  get win_gravity() {
    if (this._win_gravity === undefined) {
      return 0;
    }
    return Window._window_win_gravity.indexOf(this._win_gravity);
  }
  set sibling(sibling) {
    if (typeof sibling === 'number') {
      this._sibling = this.owner.server.resources[id];
    } else {
      this._sibling = sibling;
    }
  }
  get sibling() {
    return this._sibling;
  }
  set stack_mode(mode) {
    var siblings = this.parent.children
      , elem_siblings = this.parent.element.children().children().not(this.element)
      , elem = this.element;
    if (! elem_siblings.length)
      return;
    console.log('Window.stack_mode', mode, this.sibling);
    switch (mode) {
      case 0: // Above
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          elem.insertAfter(this.sibling.element);
        } else {
          elem.insertAfter(elem_siblings.last());
        }
      break;
      case 1: // Below
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          elem.insertBefore(this.sibling.element);
        } else {
          elem.insertBefore(elem_siblings.first());
        }
      break;
      case 2: // TopIf
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          if (elem.nextAll().has(this.sibling.element).length && elem.collision(this.sibling.element).length)
            elem.insertAfter(elem_siblings.last());
        } else {
          if (elem.collision(elem.nextAll()).length)
            elem.insertAfter(elem_siblings.last());
        }
      break;
      case 3: // BtmIf
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          if (elem.prevAll().has(this.sibling.element).length && elem.collision(this.sibling.element).length)
            elem.insertBefore(elem_siblings.first());
        } else {
          if (elem.collision(elem.prevAll()).length)
            elem.insertBefore(elem_siblings.first());
        }
      break;
      case 4: // Opposite
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          if (elem.collision(this.sibling.element).length) {
            if (elem.nextAll().has(this.sibling.element).length)
              elem.insertAfter(elem_siblings.last());
            else
              elem.insertBefore(elem_siblings.first());
          }
        } else {
          var collision = elem.collision(elem_siblings.not(elem));
          if (collision.length) {
            if (elem.nextAll().has(collision).length)
              elem.insertAfter(elem_siblings.last());
            else
              elem.insertBefore(elem_siblings.first());
          }
        }
      break;
    }
  }

}
Window.error_code = 3;
Window._event_mask_fields = [
    'KeyPress', 'KeyRelease', 'ButtonPress', 'ButtonRelease', 'EnterWindow', 'LeaveWindow'
  , 'PointerMotion', 'PointerMotionHint', 'Button1Motion', 'Button2Motion', 'Button3Motion', 'Button4Motion', 'Button5Motion', 'ButtonMotion'
  , 'KeymapState', 'Exposure', 'VisibilityChange', 'StructureNotify', 'ResizeRedirect', 'SubstructureNotify', 'SubstructureRedirect'
  , 'FocusChange', 'PropertyNotify', 'ColormapChange', 'OwnerGrabButton'
];
Window._do_not_propagate_mask_fields = Window._event_mask_fields
  .map((name) => 'NoPropagate' + name);
Window._window_win_gravity = ['U', 'NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE', ''];

export class Atom extends String {
  constructor(value, owner) {
    this.owner = owner;
    super(value);
  }
}

Atom.error_code = 5;

export class Host {
  constructor(host, type) {
    this.host = host;
    if (this.constructor === Host) {
      if (~Object.keys(Host.types).indexOf(type)) {
        this.constructor = Host.types[type];
        this.__proto__ = Host.types[type].prototype;
        super(host, type);
      } else
        throw new Error('Unknown host type');
    }
    if (this.constructor.test && ! this.constructor.test.test(host))
      throw new Error('Invalid host for type ' + this.type);
  }
  toString(port) {
    if (this.constructor === Host)
      throw new Error('Host prototype not convertable');
    var string = this.type + '[' + this.host + ']' ;
    if ('number' === typeof port)
      string += ':' + port;
    else if (port === true) {
      string += ':';
      if (this.port)
        string += this.port;
    }
    return string;
  }
  static fromString(string) {
    var match = string.toString().match(/^(\w+)\[([^\]]+)\](?::(\d+)){0,1}$/);
    if (! match)
      throw new Error('Invalid Host string');
    var host = new Host(match[2], match[1]);
    if ('undefined' !== typeof match[3])
      host.port = match[3];
    return host;
  }
  writeBuffer(buffer, offset) {
    buffer.writeUInt8(this.family, 0);
    buffer.writeUInt16(this.address_length, 2);
    this.addressBuffer().copy(buffer, 4);
  }
  toBuffer() {
    var buffer = new EndianBuffer(this.length);
    this.writeBuffer(buffer, 0);
    return buffer;
  }
  get address_length() {
    return this.constructor.address_length;
  }
  get length() {
    return Math.ceil((4 + this.address_length) / 4) * 4;
  }
  get family() {
    return this.constructor.family;
  }
  get type() {
    if (this.constructor === Host)
      throw new Error('Host prototype not convertable');
    return this.constructor.name.slice(0, -4);
  }
}
Host.types = {};

export class InternetHost extends Host {
  constructor(host) {
    super(host);
  }
  addressBuffer() {
    var buffer = new EndianBuffer(InternetHost.address_length);
    this.host.split('.')
      .forEach((num, i) => buffer.writeUInt8(Number(num), i));
    return buffer;
  }
  static fromBuffer(buffer) {
    if (buffer.length !== InternetHost.address_length)
      throw new Error('Invalid InternetHost buffer length');
    return new InternetHost(
      Array.apply(Array, Array(4))
        .map((v, i) => buffer.readUInt8(i))
        .join('.')
    );
  }
  static address_length = 4;
  static family = 0;
}
Host.types.Internet = InternetHost;
InternetHost.test = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export class InternetV6Host extends Host {
  constructor(host) {
    super(host);
  }
  addressBuffer() {
    var buffer = new EndianBuffer(InternetV6Host.address_length);
    throw new Error('TODO: Implement me!');
    return buffer;
  }
  static fromBuffer(buffer) {
    buffer.endian = true;
    if (buffer.length !== InternetV6Host.address_length) {
      throw new Error('Invalid InternetHost buffer length');
    }
    return new InternetV6Host(
      Array.apply(Array, Array(4))
        .map((v, i) => buffer.readUInt32(i * 4).toString())
        .join(':')
    );
  }
  static address_length = 16;
  static family = 6;
}
Host.types.InternetV6 = InternetV6Host;
InternetV6Host.test = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;

export class ServerInterpretedHost extends Host {
  constructor(host) {
    super(host);
  }
  get address_length() {
    return this.host.length;
  }
}
ServerInterpretedHost.family = 5;
Host.types.ServerInterpreted = ServerInterpretedHost;

export class DECnetHost extends Host {
  constructor(host) {
    super(host);
  }
  static address_length = 2;
  static family = 1;
}
Host.types.DECnet = DECnetHost;

export class ChaosHost extends Host {
  constructor(host) {
    super(host);
  }
  static address_length = 2;
  static family = 2;
}
Host.types.Chaos = ChaosHost;
