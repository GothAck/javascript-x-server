/**
 * Copyright Greg Miell 2013-present
 * @flow weak
 */
import { GCVField, WinVField, WinConfigureField, yieldAll } from './common';
import * as fs from './fs';
import EndianBuffer from './endianbuffer';
import * as events from './event_types';
import * as v6 from 'ip-address';
export * from './x_types_font';
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
    return this._array.push(...args);
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
    return new ExtrasArray(...this._array.filter(func, bind));
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

class NewString {
  constructor(string) {
    this.__string = string;
  }
  writeBuffer(buffer, offset) {
    buffer.write(this.__string, offset, this.length, 'ascii');
    return offset + this.length;
  }
  get length() {
    return this.__string.length;
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
    return out_str;
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
  element = document.createElement('x-screen');

  constructor(
    owner,
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
    this.owner = owner;
    this.element.xob = this;
    this.window = window || 0;
    this.colormap = colormap || 0;
    this.white = white || 0;
    this.black = black || 0;
    this.current_input_masks = current_input_masks || 0;
    this.element.setAttribute('height', height_px);
    this.element.setAttribute('width', width_px);
    this.element.setAttribute('mapped', true);
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
    var buffer = new EndianBuffer(this.length);
    buffer.endian = this.data.endian;
    this.writeBuffer(buffer, 0);
    return buffer;
  }
}

export class XError extends Error {
  constructor(req, code, value, msg) {
    super(msg);
    Error.captureStackTrace(this, XError);
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
    this.changeFields(owner, GCVField.fromObject(fields));
    this.x = 0;
    this.y = 0;
  }
  get font() {
    return this._font || null;
  }
  set font(fid) {
    if (fid) {
      this._font = this.owner.server.resources.get(fid);
    }
  }
  get clip_mask() {
    return this._clip_mask;
  }
  set clip_mask(did) {
    if (! did)
      return this._clip_mask = null;
    this._clip_mask = this.owner.server.resources.get(did);
    return;
    this._clip_mask_data = this._clip_mask.canvas.getContext('2d').getImageData(0, 0, this._clip_mask.width, this._clip_mask.height);
    for (var i = 3; i < this._clip_mask_data.data.length; i += 4) {
      this._clip_mask_data.data[i] = this._clip_mask_data.data[i-1];
    }
    this._clip_mask_alpha = this._clip_mask.canvas.clone();
    this._clip_mask_alpha[0].getContext('2d').putImageData(this._clip_mask_data, 0, 0);
  }

  destroy() {
    this.owner.server.resources.delete(this.id);
  }

  changeFields(owner, fields) {
    this._currentClient = owner;
    if (fields) {
      for (let [key, val] of fields) {
        this[key] = val;
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
    var context = drawable.canvas.getContext('2d')
      , rgb = (this.foreground || 0).toString(16);
    if (rgb.length < 8)
      rgb = (new Array(9 - rgb.length)).join('0') + rgb;
    context.restore();
    context.save();
    context.translate(0.5, 0.5);
    context.imageSmoothingEnabled = false;
    context.fillStyle = '#' + rgb.slice(2);
    context.strokeStyle = context.fillStyle;
    if (this.font) {
      context.font = this.font.height + 'px "' + this.font.file_name + '"';
    }
//    context.imageSmoothingEnabled = false;
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
  element = document.createElement('x-drawable');

  constructor(owner, depth, width, height) {
    this.owner = owner;
    this.depth = depth;
    this.width = width;
    this.height = height;
  }
  get width() {
    return this._width;
  }
  set width(width) {
    this._width = width;
    this.element.setAttribute('width', width);
  }
  get height() {
    return this._height;
  }
  set height(height) {
    this._height = height;
    this.element.setAttribute('height', height);
  }
  getRoot() {
    return (this.owner.server || this.owner).root;
  }
  destroy() {
  }
  get canvas() {
    return this.element.canvas;
  }

  getImageData(x, y, width, height) {
    return this.canvas.getContext('2d').getImageData(x, y, width, height);
  }

  putImageData(data, x, y) {
    return this.canvas.getContext('2d').putImageData(data, x, y);
  }

  createImageData(width, height) {
    return this.canvas.getContext('2d').createImageData(width, height);
  }
}

Drawable.error_code = 9;

export class Pixmap extends Drawable {
  constructor(owner, id, depth, drawable, width, height) {
    super(owner, depth, width, height);
    this.id = id;
    this.drawable = drawable;
    // FIXME: create correct buffer size for image!
    this.element.setAttribute('id', this.id);
    document.getElementById('buffers').appendChild(this.element);
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
  element = document.createElement('x-window');
  events = new Set();
  do_not_propagate_events = new Set();

  constructor(owner, id, depth, x, y, width, height, border_width, _class, visual, fields) {
    super(owner, depth, width, height);
    this.id = id;
    this.element.id = id;
    this.element.dataset.id = id;
    this.element.dataset.owner = owner.id;
    this.element.xob = this;
    this.width = width;
    this.height = height;
    this.border_width = border_width;
    this.class = _class;
    this.visual = visual;
    this.events.mask = 0;
    this.event_listeners = new Map();
    this.event_clients = new Map();
    this.element.removeAttribute('mapped');
    fields = WinVField.fromObject(fields);
    this.changeFields(owner, fields);
    this.properties = {}
//    var ctx = this.canvas.getContext('2d');
    this.x = x;
    this.y = y;
  }

  destroy() {
    this.owner.server.resources.delete(this.id);
    this.element.remove();
    this.triggerEvent('DestroyNotify');
  }

  sendEvent(event, data, event_mask) {
    console.log('Window.sendEvent', event, data, event_mask);
    if (event instanceof events.XEvent)
      event_mask = data;
    else
      event = new (events.map.get(event))(this, data || {});
    console.log('sendEvent', event, data, event_mask);
    event.send_event = true;
    return this.element.dispatchEvent(
      new CustomEvent(
        'SendEvent',
        {
          detail: { event: event, event_mask: event_mask },
          bubbles: true,
          cancelable: true,
        }));
  }

  triggerEvent(event, data) {
    if (! (event instanceof events.XEvent))
      event = new (events.map.get(event))(this, data || {});
    //var des = (event.dom_events || []).slice(0);
    //des.push(event.constructor.name);
    //console.log(self.element.parents('body').length);
    //console.log('.' + des.join(',.'));
    //console.log(self.element.parentsUntil('#eventfilter').andSelf().filter('.' + des.join(',.')).length)
    return this.element.dispatchEvent(
      new CustomEvent(
        event.constructor.name,
        {
          detail: event,
          bubbles: true,
          cancelable: true,
        }));
  }

  onEvent(event, data) {
//    if (~this.events.indexOf(event)) {
    if (event instanceof events.XEvent) {
      if (event.testReady()) {
        var to_del = [];
        for (let [id, mask] of this.event_clients) {
          if (event.matchesSet(mask)) {
            if (!this.owner.server.clients.has(id)) {
              to_del.push(id);
              continue;
            }
            this.owner.server.clients.get(id).sendEvent(event);
          }
        }
        if (to_del.length) {
          for (let id of to_del) {
            this.event_clients.delete(id);
          }
        }
      }
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

    if (this.owner instanceof (require('./x_client'))) {
      this.owner.reps.push(
        events.map.has(event)
          ? new (events.map.get(event))(event, this, data)
          : null
      );
      return this.owner.processReps();
    }
    if (this.owner instanceof (require('./x_server'))) {
      // Do X Server Events
    }
//    }
  }

  __eventListener(event) {
    var x_event = event.detail;
    if (x_event.stop_propagation) {
      return;
    }
    if (x_event.matchesSet(this.do_not_propagate_events)) {
      x_event.stop_propagation = true;
    }
    if (x_event.matchesSet(this.events)) {
      x_event.stop_propagation = true;
      x_event.event_type = event.type;
      x_event.event_window = this;
      this.onEvent(x_event);
    }
  }

  map() {
    if (this.element.getAttribute('mapped')) {
      return;
    }
    this.element.setAttribute('mapped', true);
    this.triggerEvent('MapNotify');
    return true;
  }

  unmap() {
    if (!this.element.getAttribute('mapped')) {
      return;
    }
    this.element.removeAttribute('mapped');
    this.triggerEvent('UnmapNotify');
    return true;
  }

  isMapped() {
    return !!this.element.getAttribute('mapped');
  }

  mapSubwindows() {
    this.children.forEach((child) => {
      if (child.map()) {
        child.triggerEvent('Expose', {count: 0});
      }
      child.mapSubwindows();
    });
  }

  getRoot() {
    var current = this;
    while (current.parent && current.parent.id)
      current = current.parent;
    return current;
  }

  getParents(until) {
    var parents = [];
    var current = this;
    while (current.parent && current.parent.id && current.parent !== until)
      parents.push(current = current.parent);
    return parents;
  }

  isChildOf(window) {
    return window.element.find(this.element).length > 0;
  }

  changeFields(owner, fields) {
    this._currentClient = owner;
    if (fields) {
      var process_events = false;
      if (fields.has('event_mask')) {
        process_events = true;
        this.setEventMask(fields.get('event_mask'), owner, true);
        fields.delete('event_mask');
      }
      if (fields.has('do_not_propagate_mask')) {
        process_events = true;
        this.setPropagateMask(fields.get('do_not_propagate_mask'), owner, true);
        fields.delete('do_not_propagate_mask');
      }
      this.updateEventListeners();
      for (let [key, val] of fields) {
        this[key] = val;
      }
    }
    this._currentClient = null;
    // var server = this.owner.server || this.owner;
    // this.element.css('background-color', server.resources.get(server.screens[0].colormap).lookup_func(this.background_pixel, 'hex'));
  }

  // FIXME: Unused due to differing reply format to send format!
  getData() {
    var data = new EndianBuffer(_win_vfield_types
      .map((name) => exports[name])
      .reduce((o, v) => o + v));
    var offset = 0;
    for (var i = 0; i < _gc_vfields.length; i++) {
      data['write' + _win_vfield_types[i]](this[_win_vfields[i]], offset);
      offset += exports[_win_vfield_types[i]].length;
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
    return Array.from(this.element.childNodes)
      .map((e) => e.xob);
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._x;
  }
  set x(x) {
    this._x = x;
    this.element.style.left = x + 'px';
  }
  set y(y) {
    this._y = y;
    this.element.style.top = y + 'px';
  }
  set parent(parent) {
    this._parent = parent;
    parent.element.appendChild(this.element);
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
      this.element.classList.remove('cursor_' + this._cursor);
    }
    this.element.classList.add('cursor_' + cursor);
    this._cursor = cursor;
  }
  set background_pixel(pixel) {
    this._background_pixel = pixel;
    pixel = pixel.toString(16);
    if (pixel.length < 6) {
      pixel = (new Array(7 - pixel.length)).join('0') + pixel;
    }
    this.element.style.backgroundColor = '#' + pixel.slice(0, 6);
  }
  get background_pixel() {
    return this._background_pixel;
  }
  processEventMask(_mask) {
    var mask = new Set(
      Window._event_mask_fields.filter((mask, i) => _mask & (1 << i)));
    mask.mask = _mask;
    return mask;
  }
  setEventMask(mask, set_client, defer_update) {
    var events_set = this.processEventMask(mask);
    this.event_clients.set(set_client.id, events_set);
    for (let set of this.event_clients) {
      mask |= set.mask;
    }
    this.events = this.processEventMask(mask);
    if (!defer_update) {
      this.updateEventListeners();
    }
  }
  setPropagateMask(mask, set_client, defer_update) {
    this.do_not_propagate_events = this.processEventMask(mask);
    if (!defer_update) {
      this.updateEventListeners();
    }
  }
  updateEventListeners() {
    var current_listeners = new Set(this.event_listeners.keys());
    var require_listeners = new Set(yieldAll(
      this.events,
      this.do_not_propagate_events));
    for (let e of require_listeners) {
      for (let xe of events.x11_event_mask_map.get(e)) {
        if (!this.event_listeners.has(xe)) {
          var listener = this.__eventListener.bind(this);
          this.event_listeners.set(xe, listener);
          this.element.addEventListener(xe, listener);
          this.element.classList.add(xe);
        }
        current_listeners.delete(xe);
      }
    }
    for (let xe of current_listeners) {
      if (this.event_listeners.has(xe)) {
        this.element.removeEventListener(xe, this.event_listeners.get(xe));
        this.event_listeners.delete(xe);
        this.element.classList.remove(xe);
      }
    }
  }

  get event_mask() {
    var set_client = this._currentClient;
    //TODO: Return correct event_mask
    return this.events.mask || 0;
  }
  get do_not_propagate_mask() {
    return this._do_not_propagate_event_mask || 0;
  }
  set colormap(colormap) {
    this._colormap = (typeof colormap === 'number')
      ? this.owner.server.resources.get(colormap)
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
      this._sibling = this.owner.server.resources.get(sibling);
    } else {
      this._sibling = sibling;
    }
  }
  get sibling() {
    return this._sibling;
  }
  set stack_mode(mode) {
    var elem_siblings = Array.from(this.element.genSiblings());
    var siblings = elem_siblings.map((e) => e.xob);
    var elem = this.element;
    if (! elem_siblings.length)
      return;
    console.log('Window.stack_mode', mode, this.sibling);
    switch (mode) {
      case 0: // Above
        if (
          this.sibling &&
          ~siblings.indexOf(this.sibling)
        ) {
          this.parent.element.insertAfter(
            elem, this.sibling.element);
        } else {
          this.parent.element.appendChild(elem);
        }
      break;
      case 1: // Below
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          this.parent.element.insertBefore(
            elem, this.sibling.element);
        } else {
          this.parent.element.insertBefore(elem, elem_siblings[0]);
        }
      break;
      case 2: // TopIf
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          if (elem.hasNextSibling(this.sibling.element) && elem.collidesWith(this.sibling.element)) {
            this.parent.element.appendChild(elem);
          }
        } else {
          if (elem.collidesWith(...Array.from(elem.genNextSiblings()))) {
            this.parent.element.appendChild(elem);
          }
        }
      break;
      case 3: // BtmIf
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          if (elem.hasPrevSibling(this.sibling.element) && elem.collidesWith(this.sibling.element)) {
            elem.insertBefore(elem_siblings[0]);
          }
        } else {
          if (elem.collidesWith(elem.prevAll()).length) {
            elem.insertBefore(elem_siblings[0]);
          }
        }
      break;
      case 4: // Opposite
        if (this.sibling && ~siblings.indexOf(this.sibling)) {
          if (elem.collidesWith(this.sibling.element)) {
            if (elem.hasNextSibling(this.sibling.element)) {
              this.parent.element.appendNode(elem);
            } else {
              this.parent.element.prependNode(elem);
            }
          }
        } else {
          var collision = elem.collidesWith(elem_siblings);
          if (collision.length) {
            if (elem.nextAll().has(collision).length) {
              this.parent.element.appendNode(elem);
            } else {
              this.parent.element.prependNode(elem);
            }
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
    super(value);
    this.owner = owner;
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
        this.constructor(host, type);
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
