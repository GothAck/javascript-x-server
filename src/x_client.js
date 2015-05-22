import EndianBuffer from './endianbuffer';
import * as rgb_colors from './rgb_colors';

import * as x_types from './x_types';
import { GCVField, WinVField, WinConfigureField } from './common';

var _image_formats = ['Bitmap', 'XYPixmap', 'ZPixmap'];
var _closedown_mode = ['destroy', 'permanent', 'temporary'];


export default class XServerClient {
  constructor(server, id, resource_id_base, resource_id_mask, host) {
    this.server = server;
    this.id = id;
    this.host = host;
    this.idLog = host.toString(true);
    this.state = 0;
    this.endian = null;
    this.resource_id_mask = resource_id_mask;
    this.resource_id_base = resource_id_base;
    this.sequence_sent = 0;
    this.save_set = [];
    this.closedown = 'destroy';
  }

  write(data) {
    if ((data instanceof x_types.Reply) || (data instanceof x_types.XError) || (data instanceof x_types.events.XEvent)) // FIXME: Migrate to x_types.WorkReply
      return this.server.write(this, data.toBuffer());
    return this.server.write(this, data);
  }

  async processRequest(message) {
    var req = message.request
      , req_str = '> Request (' + this.idLog + ') ' + message.type;
    var rep;
    if (message.type === 'SetupRequest') {
      if (this.state !== 0)
        throw new Error('SetupRequest received at the wrong time?!');
      this.setup(req)
    } else {
      var func = this[message.type];

      console.time(req_str);
      try {
        rep = func && await this::func(req);
        console.timeEnd(req_str);
        if (rep) {
          if (Array.isArray(rep)) {
            rep.forEach((r) => this.processReply(r));
          } else {
            this.processReply(rep);
          }
        }
      } catch (e) {
        console.timeEnd(req_str);
        if (e instanceof x_types.Error) {
          e.endian = req.endian;
          e.opcode = req.opcode;
          e.sequence = req.sequence & 0xffff;
          console.error(this.id, e, e.stack);
          this.processReply(e);
        } else {
          console.error('Implementation Error', e.stack);
          this.processReply(new x_types.Error(req, 17, 0));
          throw e;
        }
      }
    }
  }
  
  processReply(rep) {
    if (rep instanceof x_types.events.XEvent)
      rep.sequence = this.sequence_sent;
    if (this.sequence_sent < rep.sequence)
      this.sequence_sent = rep.sequence;
    this.write(rep);
  }
  
  sendEvent(event) {
    //console.error((new Event).stack);
    // Endian hacks until we process events within x_protocol worker!
    event.endian = this.endian;
    if (Array.isArray(event))
      event.forEach(function (event) { event.endian = this.endian; this.processReply(event) }, this);
    else
      this.processReply(event);
    return;
  }

  disconnect() {
    console.log('Disconnect', this.id);
    this.server.clients.delete(this.id);
    if (this.closedown === 'destroy') {
      for (let resource of this.server.resources.values()) {
        if (resource.owner === this) {
          resource.destroy();
        }
      }
    }
  }

  setup(data) {
    this.endian = data.endian;
    this.protocol_major = data.protocol_major;
    this.protocol_minor = data.protocol_minor;

    this.auth_name = data.auth_name;

    this.auth_data = data.auth_data;
    
    /* Deny connection
    var reason = 'No Way'
      , pad = 4 - ((reason.length % 4) || 4);

    var res = new EndianBuffer(8 + reason.length + pad);
    res.fill(0);
    res.writeUInt8(reason.length, 1); // 2 (0: 0, 1: reason.length)
    this.writeUInt16(res, this.protocol_major, 2); // 2
    this.writeUInt16(res, this.protocol_minor, 4); // 2
    this.writeUInt16(res, (reason.length + pad) / 4, 6);
    res.write(reason, 8, reason.length, 'ascii');
    this.socket.write(res);
    */
    // Allow connection

    var res = new EndianBuffer(500);
    res.endian = this.endian;
    res.writeUInt8(1, 0);
    res.writeUInt16(this.server.protocol_major, 2);
    res.writeUInt16(this.server.protocol_minor, 4);
    res.writeUInt16((32 + (this.server.formats.byte_length) + stringPad(this.server.vendor) + this.server.screens.byte_length) / 4, 6);
    res.writeUInt32(this.server.release, 8);
    res.writeUInt32(this.resource_id_base, 12);
    res.writeUInt32(this.resource_id_mask, 16);
    res.writeUInt32(this.server.motion_buffer_size, 20);
    res.writeUInt16(this.server.vendor.length, 24);
    res.writeUInt16(this.server.maximum_request_length, 26);
    res.writeUInt8(this.server.screens.length, 28); // Number screens
    console.log('a', this.server.screens.length);
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
    var rep = new EndianBuffer(base);
    rep.fill(0);
    res.copy(rep, 0, 0, base);
    this.state = 1;
    this.write(rep);
  }

  imageFromBitmap(dest, data, depth, width, height, pad) {
    var format = this.server.getFormatByDepth(depth)
      , scanline_pad_unit = format.scanline_pad / format.bpp
      , scanline = width + (scanline_pad_unit - (width % scanline_pad_unit || format.scanline));
    switch (depth) {
      case 1:
        var byte;
        for (var row = 0; row < height; row ++) {
          for (var col = 0; col < width; col ++) {
            var data_offset = (row * scanline) + col
              , dest_offset = (row * width) + col
              , bit = col % 8
              , bit_mask = Math.pow(2, bit);
            if (bit == 0)
              byte = data.readUInt8(data_offset / 8);
            dest.data[dest_offset] =
            dest.data[dest_offset + 1] =
            dest.data[dest_offset + 2] = (byte & bit_mask) ? 0xff : 0x00;
            dest.data[dest_offset + 3] = 0xff;
          }
        }
      break;
      default:
        throw new Error('Bitmap with depth ' + depth + ' not implemented!');
    }
    return dest;
  }

  imageToBitmap(data, depth, width, height) {
    throw new Error('STUB: Implement imageToBitmap')
  }

  imageFromXYPixmap(dest, data, depth, width, height, pad) {
    var format = this.server.getFormatByDepth(depth)
      , scanline = width + ((format.scanline_pad / format.bpp) - width % (format.scanline_pad / format.bpp));
    switch (depth) {
      case 1:
        var byte;
        for (var row = 0; row < height; row ++) {
          for (var col = 0; col < width; col ++) {
            var data_offset = (row * scanline) + col
              , dest_offset = ((row * width) + col) * 4
              , bit = col % 8
              , bit_mask = Math.pow(2, bit)
            if (bit == 0)
              byte = data.readUInt8(data_offset / 8);
            dest.data[dest_offset    ] =
            dest.data[dest_offset + 1] =
            dest.data[dest_offset + 2] = (byte & bit_mask) ? 0xff : 0x00;
            dest.data[dest_offset + 3] = 0xff;
          }
        }
        break;
      default:
        throw new Error('XYPixmap with depth ' + depth + ' not implemented!');
    }
    return dest;
  }

  imageToXYPixmap(data, depth, width, height) {
    throw new Error('STUB: Implement imageToXYPixmap')
  }

  imageFromZPixmap(dest, data, depth, width, height, pad) {
    var format = this.server.getFormatByDepth(depth)
      , scanline = width + (width % (format.scanline_pad / format.bpp));
    data.endian = true; // ZPixmaps always have the same endianess?!
    width = scanline; // Overscan the image for now! FIXME: Need to crop instead of overscan!
    switch (depth) {
      case 1:
        throw new Error('1 bit ZPixmap not implemented!');
      default:
        var byte_pp = format.bpp / 8
          , func_pp = 'readUInt' + format.bpp;
        for (var pixel = 0; pixel < data.length / byte_pp; pixel ++) {
          var pixel_data = data[func_pp](pixel * byte_pp)
            , dest_pixel = pixel * 4;
          if (depth === 24) {
            dest.data[(dest_pixel)    ] = (0xff0000 & pixel_data) >> 16;
            dest.data[(dest_pixel) + 1] = (0x00ff00 & pixel_data) >>  8;
            dest.data[(dest_pixel) + 2] = (0x0000ff & pixel_data)      ;
            dest.data[(dest_pixel) + 3] = 0xff;
          }
        }
    }
    return dest;
  }

  imageToZPixmap(from, depth, width, height) {
    var data
      , format = this.server.getFormatByDepth(depth)
      , scanline = width + ((format.scanline_pad / format.bpp) - width % (format.scanline_pad / format.bpp));
    switch (depth) {
      case 1:
        throw new Error('1 bit ZPixmap not implemented!');
      default:
        var byte_pp = format.bpp / 8
          , func_pp = 'writeUInt' + format.bpp
          , data = new EndianBuffer(scanline * height * byte_pp);
        data.endian = true; // ZPixmaps always have the same endianess?!
        row: for (var y = 0; y < height; y ++)
          col: for (var x = 0; x < scanline; x ++) {
            if (x < width) {
              var offset = ((y * width) + x) * 4;
              data[func_pp](
                  (from.data[offset    ]      ) |
                  (from.data[offset + 1] <<  8) |
                  (from.data[offset + 2] << 16)
                , ((y * scanline) + x) * byte_pp
              );
            }
          }
    }
    return data;
  }

  async CreateWindow(req) {
    var parent = this.server.getResource(req.parent)
    console.log(
        'CreateWindow', req.id, req.depth, req.parent
      , req.x, req.y, req.width, req.height, req.fields
    );
    var window = this.server.putResource(new x_types.Window(
            this, req.id, req.depth, req.x, req.y, req.width, req.height
          , req.border_width, req.class, req.visual, req.fields
    ));
    window.parent = parent;
  }

  async ChangeWindowAttributes(req) {
    console.log('ChangeWindowAttributes', req);
    this.server.getResource(req.window, x_types.Window)
      .changeFields(this, WinVField.fromObject(req.fields));
  }

  async GetWindowAttributes(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req);
    rep.backing_store = 2; // Backing store (0 NotUseful, 1 WhenMapper, 2 Always)
    rep.visual_id = 0; // Visual id
    rep.input_output = window.input_output; // Class (1 InputOutput, 2 InputOnly)
    rep.bit_gravity = 0; // Bit gravity
    rep.win_gravity = 0; // Win gravity
    rep.backing_planes = 0; // Backing planes
    rep.background_pixel = window.background_pixel || 0; // Backing pixel
    rep.save_under = 0; // Save under
    rep.map_installed = window.isMapped() ? 1 : 0; // Map is installed
    // Map state (0 Unmapped, 1 Unviewable, 2 Viewable)
    rep.override_redirect = window.override_redirect; // Override redirect
    rep.colormap = (this._colormap && this._colormap.id) || 0;// Colormap
    rep.event_mask = window.event_mask;// All event masks
    // Your event mask
    rep.do_not_propagate_mask = window.do_not_propagate_mask; // Do not propagate mask
    return rep;
  }
  
  async DestroyWindow(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    if (window !== window.owner.server.root)
      window.destroy();
  }

  async DestroySubWindows(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    window.children.forEach(function (child) {
      child.destroy();
    });
  }

  async ChangeSaveSet(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    if (req.data_byte) {
      delete this.save_set[this.save_set.indexOf(window)];
    } else {
      this.save_set.push(window);
    }
  }

  async ReparentWindow(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , parent = this.server.getResource(req.parent)
      , was_mapped = window.isMapped();
    console.log('ReparentWindow', window.id, window.parent.id, parent.id);
    window.unmap();
    window.x = req.x;
    window.y = req.y;
    window.triggerEvent('ReparentNotify', { new_parent: parent })
    window.parent = parent;
    window.element.appendTo(parent.element.children());
    window.triggerEvent('ReparentNotify', { new_parent: parent })
    if (was_mapped)
      window.map();
  }

  async MapWindow(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('MapWindow', window.id);
    var reps = [];
    if (
      (~ window.parent.events.indexOf('SubstructureRedirect')) &&
      Object.keys(window.parent.event_clients).filter(function (id) {
        return ~ window.parent.event_clients[id].indexOf('SubstructureRedirect') && id != this.id
      }, this).length &&
      ! window.override_redirect
    ) {
      xt = x_types;
      window.parent.triggerEvent(new x_types.events.map.MapRequest(window, {}));
      console.log('!REDIRECT!');
    } else
    if (window.map()) {
      window.triggerEvent('Expose', { count: 0 });
    }
    return reps;
  }

  async MapSubwindows(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('MapSubwindows', window.id);
    window.mapSubwindows();
    return [];
  }

  async UnmapWindow(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('UnmapWindow');
    window.unmap()
  }
  
  async UnmapSubwindows(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('UnmapSubwindows');
    window.children.forEach(function (child) {
      child.unmap();
    });
  }

  async ConfigureWindow(req) {
    var window = this.server.getResource(req.window, x_types.Window)
    console.log('ConfigureWindow', window, req.fields);
    window.sibling = null;
    for (let [k, v] of WinConfigureField.fromObject(req.fields)) {
      window[k] = v;
    }
    console.log('ConfigureWindow FIXME: Incomplete');
  }

  async GetGeometry(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , rep = new x_types.WorkReply(req);
    rep.depth = drawable.depth;

    rep.root = drawable.getRoot().id;
    rep.x = drawable.x;
    rep.y = drawable.y;
    rep.width = drawable.width;
    rep.height = drawable.height;
    // TODO: 2 byte border-geom
    return rep;
  }

  async QueryTree(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req)
      , root = window.getRoot();
    rep.root = root && root.id;
    rep.parent = window.parent && window.parent.id;
    rep.children = window.children.map(function (child) {
      return child.id;
    });
    console.log(rep.children);
    return rep;
  }

  async InternAtom(req) {
    var index = this.server.getAtom(req.name, true)
      , rep = new x_types.WorkReply(req);
    if ((!index) && ! req.only_if_exists)
      index = this.server.atoms.push(req.name);
    rep.atom = index;
    return rep;
  }

  async GetAtomName(req) {
    var atom = this.server.getAtom(req.atom)
      , rep = new x_types.WorkReply(req);
    rep.name = atom;
    return rep;
  }

  async ChangeProperty(req) {
    var window = this.server.getResource(req.window, x_types.Window)
    console.log('ChangeProperty', window, window.id, this.server.getAtom(req.atom));
    window.changeProperty(req.atom, this.server.getAtom(req.atom), req.format, req.type, req.value, req.mode);
    //console.log('ChangeProperty', window.id, property, format, data, mode);
  }

  async DeleteProperty(req) {
    var window = this.server.getResource(req.window, x_types.Window);
    window.deleteProperty(this.server.getAtom(req.atom));
    window.triggerEvent('PropertyNotify', { atom: req.atom, deleted: true });
  }


  async GetProperty(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , property = this.server.getAtom(req.atom)
      , type = req.type
      , long_off = req.long_off
      , long_len = req.long_len
      , rep = new x_types.WorkReply(req);

    //console.log('Get Property', window.id, property);

    var value = window.getProperty(property);
    if (!value)
      return rep;

    rep.format = value.format;
    rep.type = value.type;
    rep.length = value.length;
    rep.value = value.buffer;
    return rep;
  }

  async RotateProperties(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , delta = req.delta
      , property_names = req.atoms.map(function (atom) { return this.server.getAtom(atom) }, this)
      , property_vals = property_keys.map(function (key) { return this.getProperty(key) }, window);

    if (property_vals.some(function (val) { return 'undefined' === typeof val }))
      throw new Error('FIXME: This should throw a Match error'); //FIXME: Should also throw if dup keys
    if (!delta)
      return;
    property_vals.slice(-delta)
      .concat(property_vals.slice(0, -delta))
      .forEach(function (val, i) {
        window.setProperty(property_keys, val);
      });
  }

  async ListProperties(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req);
    rep.atoms = Object.keys(window.properties).map(function (name) { return this.atoms.indexOf(name) + 1 }, this);
    return rep;
  }

  async GetSelectionOwner(req) {
    var atom_id = req.atom
      , atom = this.server.atoms[atom_id]
      , owner = this.server.atom_owners[atom_id]
      , rep = new x_types.WorkReply(req);
    rep.owner = (owner && this.server.getResource(owner) && owner) || 0;
    return rep;
  }

  async SendEvent(req) {
    // Hack to make event endian match until it's shifter to worker:
    req.event_data.endian = this.endian;
    var propagate = req.propagate
      , window = this.server.getResource(req.window, x_types.Window)
      , event = x_types.events.fromBuffer(this, req.event_data, 0);
    if (! event)
      throw new Error('SendEvent sent an unknown event');
    window.sendEvent(event, req.event_mask);
  }

  async GrabPointer(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , confine = this.server.getResource(req.confine)
      , cursor = req.cursor
      , timestamp = req.timestamp
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply

    if (this.server.grab_pointer) {
      rep.data_byte = 1;
    } else if (! window.isMapped()) {
      rep.data_byte = 3;
    } else {
      var root = window.getRoot();
      if (cursor) {
        var cursor_class = 'cursor_' + cursor + '_important';
        root.element
          .addClass(cursor_class).data('grab_pointer_class', cursor_class);
      }
      var event_filter = root.element.parent().parent().parent();
      event_filter.addClass('grab_pointer');
      if (req.owner_events)
        event_filter.addClass('owner_events');
      this.server.grab_pointer = window;
      this.server.grab_pointer_owner_events = req.owner_events;
      this.server.grab_pointer_mask = window.processEventMask(req.events);
      rep.data_byte = 0;
    }
    console.log('GrabPointer', window, req.owner_events, req.events, req.mouse_async, req.keybd_async, confine, timestamp);
    return rep;
  }

  async UngrabPointer(req) {
    var time = req.time;
    if (this.server.grab_pointer) {
      this.server.grab_pointer = null;
      var cursor = this.server.root.element.data('grab_pointer_class');
      if (cursor)
        this.server.root.element.removeClass(cursor);
      this.server.root.element.parent().parent().parent().removeClass('grab_pointer');
    }
  }
  
  async GrabKeyboard(req) {
    var window = this.server.getResource(req.window)
      , owner_events = req.owner_events
      , timestamp = req.timestamp
      , mouse_async = req.mouse_async
      , keybd_async = req.keybd_async
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply

    if (this.server.grab_pointer) {
      rep.data_byte = 1;
    } else if (! window.isMapped()) {
      rep.data_byte = 3;
    } else {
      var root = window.getRoot();
      root.element.parent().parent().parent().addClass('grab_keyboard');
      this.server.grab_keyboard = window;
      rep.data_byte = 0;
    }
    console.log('GrabKeyboard', window, owner_events, timestamp, mouse_async, keybd_async);
    return rep;
  }
  
  async UngrabKeyboard(req) {
    var time = req.time;
    if (this.server.grab_keyboard) {
      this.server.grab_keyboard = null;
      this.server.root.element.parent().parent().parent().removeClass('grab_keyboard');
    }
  }

  async GrabServer(req) {
    this.server.grab = this;
    this.server.grab_reason = 'GrabServer';
  }

  async UngrabServer(req) {
    this.server.grab = null;
    this.server.flushGrabBuffer();
  }

  async QueryPointer(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req);
    rep.serverX = this.server.mouseX;
    rep.serverY = this.server.mouseY;
    rep.windowX = this.server.mouseX - window.x;
    rep.windowY = this.server.mouseY - window.y;
    return rep;
  }

  async SetInputFocus(req) {
    var window = this.server.getResource(req.window, x_types.Window, 0, 1)
    if (req.time < this.server.input_focus_time)
      return;
    switch (window) {
      case 0:
        this.server.input_focus = null;
      break;
      case 1:
        this.server.input_focus = this.server.root;
      break;
      default:
        this.server.input_focus = window;
    }
    this.server.input_focus_time = req.time;
    this.server.input_focus_revert = req.revert;
  }

  async GetInputFocus(req) {
    var rep = new x_types.WorkReply(req);
    rep.revert_to = this.server.input_focus_revert;
    if (this.server.input_focus === this.server.root)
      rep.focus = 1;
    else if (this.server.input_focus)
      rep.focus = this.server.input_focus.id;
    else
      rep.focus = 0;
    return rep;
  }

  async OpenFont(req) {
    var fid = req.fid
      , length = req.name_length
      , name = req.name;
    this.server.grab = this;
    this.server.grab_reason = 'OpenFont';
    this.server.openFont(this, fid, name);
  }

  async CloseFont(req) {
    var font = this.server.getResource(req.font, x_types.Font);
    font.close();
  }

  async QueryFont(req) {
    var font = this.server.getResource(req.font, x_types.Font);
    var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    rep.data = new EndianBuffer(32);
    rep.data.endian = this.endian;
    font.getChar(-1).toCharInfo().writeBuffer(rep.data,  0); // Write min bounds
    font.getChar(-2).toCharInfo().writeBuffer(rep.data, 16); // Write max bounds
    // Extra data
    rep.data_extra.push(font.toFontInfo());
    rep.data_extra.push(new x_types.UInt32(font.characters.length));
    for (var i in font.properties) {
      if (typeof font.properties[i] === 'string') {
        // Convert string properties to atoms
        font.properties[i] = this.server.atoms.push(font.properties[i]);
      }
      rep.data_extra.push(new x_types.FontProp(
          this.server.atoms.indexOf(i) + 1
        , font.properties[i]
      ));
    }
    for (var i = 0; i < font.characters.length; i++)
      rep.data_extra.push(font.getChar(i).toCharInfo());
    return rep;
  }

  async ListFonts(req) {
    var rep = new x_types.WorkReply(req);
    rep.fonts = this.server.listFonts(req.pattern).slice(0, req.max_names);
    return rep;
  }

  async ListFontsWithInfo(req) {
    var fonts = this.server.listFonts(req.pattern).slice(0, req.max_names);
    console.log('ListFontsWithInfo', req.pattern);
    if (!fonts.length) {
      var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
      rep.data_extra.push(new x_types.Nulls(7 * 4));
      return rep;
    }

    var reps = await* fonts.map(async (font_name) => {
      var [server_name, resolved_name] = this.server.resolveFont(font_name);
      if (!resolved_name) {
        throw new Error('Unresolved font');
      }
      var font = await this.server.loadFontAsync(resolved_name, server_name);
      var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
      // CLOWNTOWN: Instead of fitting 2x 12 byte CHARINFO into 24 byte standard
      // reply, they broke the spec with 12 CHARINFO 4 PAD 12 CHARINFO 4 PAD
      // DAFUQ PEOPLE?!
      rep.data = new EndianBuffer(32);
      rep.data.endian = this.endian;
      rep.data_byte = font.name.length;
      font.getChar(-1).toCharInfo().writeBuffer(rep.data, 0);
      font.getChar(-2).toCharInfo().writeBuffer(rep.data, 16);
      // Extra data
      rep.data_extra.push(font.toFontInfo());
      rep.data_extra.push(new x_types.UInt32(fonts.length));
      for (var i in font.properties)
        rep.data_extra.push(new x_types.FontProp(
            this.server.atoms.indexOf(i)
          , font.properties[i]
        ));
      rep.data_extra.push(new x_types.String(font.name));
      return rep;
    });

    var final_rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    final_rep.data_extra.push(new x_types.Nulls(7 * 4));
    reps.push(final_rep);

    return reps;
  }

  async CreatePixmap(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable);
    console.log('CreatePixmap', req.depth, req.pid, drawable, req.width, req.height);
    if (drawable.depth !== req.depth && req.depth !== 1) {
      throw new x_types.Error(
        req,
        4,
        req.depth,
        `Incorrect depth ${req.depth}, drawable ${drawable.depth}`
      );
    }
    this.server.putResource(new x_types.Pixmap(this, req.pid, req.depth, drawable, req.width, req.height));
  }

  async FreePixmap(req) {
    this.server.freeResource(req.pid, x_types.Pixmap);
  }

  async CreateGC(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
    console.log('CreateGC', drawable, req.cid, req.fields)
    this.server.putResource(new x_types.GraphicsContext(this, req.cid, drawable, req.fields));
  }

  async ChangeGC(req) {
    this.server.getResource(req.gc, x_types.GraphicsContext)
      .changeFields(this, GCVField.fromObject(req.fields));
  }

  async CopyGC(req) {
    this.server.getResource(req.src_gc, x_types.GraphicsContext)
      .copyTo(
          this.server.getResource(req.dst_gc, x_types.GraphicsContext)
        , req.fields
      );
  }

  async ClearArea(req) {
    var window = this.server.getResource(req.window, x_types.Window)
      , w = req.w || (window.width - req.y)
      , h = req.h || (window.height - req.x);
    var context = window.canvas[0].getContext('2d');
    context.clearRect(req.x, req.y, w, h);
    if (req.exposures)
      window.triggerEvent('Expose', { x: req.x, y: req.y, width: w, height: h });
  }

  async CopyArea(req) {
    var src    = this.server.getResource(req.src, x_types.Drawable)
      , dst    = this.server.getResource(req.dst, x_types.Drawable)
      , gc     = this.server.getResource(req.gc, x_types.GraphicsContext)
      , data   = src.getImageData(req.src_x, req.src_y, req.width, req.height);
    console.log('CopyArea', src.id, dst.id, req.src_x, req.src_y, req.dst_x, req.dst_y, req.width, req.height);
    dst.putImageData(data, req.dst_x, req.dst_y);
    if (gc.graphics_exposures)
      dst.owner.sendEvent(new x_types.events.map.NoExposure(dst, { major: req.opcode, minor: 0 }));
  }

  async FreeGC(req) {
    this.server.freeResource(req.gc, x_types.GraphicsContext);
  }

  async PolyLine(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , coord_mode = req.data_byte
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , count = req.length_quad - 3;
    context.moveTo(0, 0);
    req.lines.forEach(function (line) {
      context.moveTo(line[0][0], line[0][1]);
      context.lineTo(line[1][0], line[1][1]);
      context.stroke()
    });
  }

  async PolySegment(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 2;
    req.lines.forEach(function (line) {
      context.beginPath();
      context.moveTo(line[0][0], line[0][1])
      context.lineTo(line[1][0], line[1][1])
      context.stroke();
    })
  }

  async PolyRectangle(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable);
    req.rectangles.forEach(function (rect) {
      context.beginPath();
      context.rect.apply(context, rect);
      context.stroke();
    });
  }

  async PolyArc(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , d_w = drawable.canvas[0].width
      , d_h = drawable.canvas[0].height
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 3
      , end = (count * 12) + 8;
    req.arcs.forEach(function (arc) {
      context.save()
      context.scale(arc.aspect, 1);
      context.beginPath();
      context.arc(
          (arc.x + (arc.w / 2)) / arc.aspect
        , arc.y + (arc.h / 2)
        , arc.h / 2, arc.sr, arc.er
      );

      context.restore();
    });
  }

  async FillPoly(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , shape = req.shape
      , coordinate_mode = req.coordinate_mode
      , coordinates = [];

    context.beginPath();
    req.coordinates.forEach(function (coord, i) {
      if (i == 0 && coordinate_mode == 0) {
        context.moveTo(coord[0], coord[1]);
      } else {
        context.lineTo(coord[0], coord[1]);
      }
    });
//    context.closePath()
    context.fill();

    console.log('FillPoly', drawable, context, coordinates);
  }

  async PolyFillRectangle(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable);
    // x, y, width, height
    req.rectangles.forEach(function (rect) {
      context.beginPath();
      context.rect.apply(context, rect);
      context.fill();
    });
    if (gc.clip_mask) {
      gc.globalCompositeOperation = 'xor';
      //context.drawImage(gc.clip_mask.canvas[0], gc.clip_x_origin || 0, gc.clip_y_origin || 0);
    }
  }

  async PolyFillArc(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , d_w = drawable.canvas[0].width
      , d_h = drawable.canvas[0].height
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , count = (req.length_quad - 3) / 3
      , end = (count * 12) + 8;
    req.arcs.forEach(function (arc) {
      context.save()
      context.scale(arc.aspect, 1);
      context.beginPath();
      context.arc(
          (arc.x + (arc.w / 2)) / arc.aspect
        , arc.y + (arc.h / 2)
        , arc.h / 2, arc.sr, arc.er
      );

      context.restore();
      context.fill();
    });
  }

  async PutImage(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , context = this.server.getResource(req.context, x_types.GraphicsContext)
    context.putImage(drawable, req.format, req.image, req.width, req.height, req.x, req.y, req.pad, req.depth);
    console.log(req.format, req.width, req.height, req.x, req.y, req.pad, req.depth);
  }

  async GetImage(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    console.log('GetImage', drawable.id);
    rep.data_byte = drawable.depth;
    rep.data_extra.push(
      new x_types.DataBuffer(
        this['imageTo' + req.format](drawable.getImageData(req.x, req.y, req.w, req.h), drawable.depth, req.w, req.h)
      )
    );
    return rep;
    console.log('FIXME GetImage:', req.format, drawable, req.x, req.y, req.w, req.h, req.plane_mask);
  }

  async PolyText8(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , x = req.x;
    req.textitems.forEach(function (item) {
      context.fillText(item.str, x + item.delta, req.y);
      x += context.measureText(item.str).width + item.delta;
    });
  }

  async PolyText16(req) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , x = req.x;
    req.textitems.forEach(function (item) {
      context.fillText(item.str, x + item.delta, req.y);
      x += context.measureText(item.str).width + item.delta;
    });
  }

  async AllocColor(req) {
    var cmap = this.server.getResource(req.cmap, x_types.ColorMap)
      , rep = new x_types.WorkReply(req);
    rep.r = req.r;
    rep.g = req.g;
    rep.b = req.b;
    rep.id =  (req.r << 16) | (req.g << 8) | req.b;
    return rep;
  }

  async QueryColors(req) {
    console.log('QueryColors');
    var count = req.length_quad - 2
      , length = count * 4
      , colormap = this.server.getResource(req.colormap, x_types.ColorMap)
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    rep.data.writeUInt16(count);
    for (var i = 4; i < length + 4; i += 4) {
      var rgb = colormap.getRGB(req.rgb);
      rep.data_extra.push(new x_types.UInt16(rgb[0] < 8));
      rep.data_extra.push(new x_types.UInt16(rgb[1] < 8));
      rep.data_extra.push(new x_types.UInt16(rgb[2] < 8));
      rep.data_extra.push(new x_types.UInt16(0));
    }
    return rep;
  }


  async LookupColor(req) {
    var cmap = this.server.getResource(req.cmap, x_types.ColorMap)
      , length = req.name_length
      , name = req.name
      , color = rgb_colors[name] || 0
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply

    rep.data.writeUInt16((color & 0xff0000) >> 16,  0);
    rep.data.writeUInt16((color & 0x00ff00) >>  8,  2);
    rep.data.writeUInt16((color & 0x0000ff) >>  0,  4);
    rep.data.writeUInt16((color & 0xff0000) >> 16,  6);
    rep.data.writeUInt16((color & 0x00ff00) >>  8,  8);
    rep.data.writeUInt16((color & 0x0000ff) >>  0, 10);

    return rep;
  }

  async CreateGlyphCursor(req) {
    var source_font = this.server.getResource(req.source_font, x_types.Font)
      , mask_font = this.server.getResource(req.mask_font, x_types.Font)
      , source_char_meta = req.source_char && source_font.characters[req.source_char]
      , mask_char_meta = req.mask_char && mask_font.characters[req.mask_char]
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
    if (req.mask_char) {
      var color = (
          ((~~(req.back_r / 0x100)) << 16) +
          ((~~(req.back_g / 0x100)) << 8 ) +
          ((~~(req.back_b / 0x100)) << 0 )
        ).toString(16)
      color = (new Array(7 - color.length)).join(0) + color;
      context.fillStyle = '#' + color;
      context.font = '30px "' + mask_font.file_name + '"';
      context.fillText(
          x_types.String.encodeString(String.fromCharCode(req.mask_char))
        , x
        , y
      );
    }
//      mask_char.drawTo(context, x, y, back_r, back_g, back_b);
    var color = (
        ((~~(req.fore_r / 0x100)) << 16) +
        ((~~(req.fore_g / 0x100)) << 8 ) +
        ((~~(req.fore_b / 0x100)) << 0 )
      ).toString(16)
    color = (new Array(7 - color.length)).join(0) + color;
    context.fillStyle = '#' + color;
    if (source_font !== mask_font)
      context.font = '30px "' + source_font.file_name + '"';
    context.fillText(
        x_types.String.encodeString(String.fromCharCode(req.source_char))
      , x
      , y
    );
//    source_char.drawTo(context, x, y, fore_r, fore_g, fore_b);
    canvas.id = req.cursor_id;
    context.restore();
    $('style#cursors')[0].innerHTML += [
      , '.cursor_' , req.cursor_id , ' { '
      ,   'cursor: url(' , canvas.toDataURL() , ') ' , x , ' ' , y , ', default;'
      , '}'
      , '.cursor_' , req.cursor_id , ':active { '
      ,   'cursor: url(' , canvas.toDataURL() , ') ' , x , ' ' , y , ', default;'
      , '}'
      , '.cursor_' , req.cursor_id , '_important { '
      ,   'cursor: url(' , canvas.toDataURL() , ') ' , x , ' ' , y , ', default !important;'
      , '}'
      , '.cursor_' , req.cursor_id , '_important:active { '
      ,   'cursor: url(' , canvas.toDataURL() , ') ' , x , ' ' , y , ', default !important;'
      , '}'
    ].join('') + '\n';
    setTimeout(function () {
    }, 20);
  }

  async QueryBestSize(req) {
    console.log('QueryBestSize');
    var _class = req.data_byte
      , drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , width = req.width
      , height = req.height;
    var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    switch (_class) {
      case 0: // Cursor
        rep.data.writeUInt16(64, 0); // Cursors are always 64x64
        rep.data.writeUInt16(64, 2);
      break;
      default:
        throw new Error('Class not implemented');
    }
    return rep;
  }

  async QueryExtension(req) {
    console.log('QueryExtension - Incomplete');
    var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    rep.data.writeUInt8(0, 0);
    rep.data.writeUInt8(req.opcode, 1);
    rep.data.writeUInt8(0, 2);
    rep.data.writeUInt8(0, 3);
    return rep;
  }

  async ListExtensions(req) {
    console.log('ListExtensions');
    var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    return rep;
  }

  async GetKeyboardMapping(req) {
    var self = this
      , first = req.first
      , count = req.count
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply

    rep.data_byte = self.server.keymap.maxModifiers;

    for (var key = first; key < first + count; key++) {
      var keyObj = self.server.keymap.get(key);
      for (var mod = 0; mod < rep.data_byte; mod ++) {
        if (keyObj) {
          var modifier = ~~Math.pow(2, mod - 1)
            , keycode = keyObj['' + ~~Math.pow(2, mod - 1)] || keyObj['0'];
          rep.data_extra.push(new x_types.UInt32(self.server.keymap.getKeysym(keycode, modifier & 1)));
        } else
          rep.data_extra.push(new x_types.UInt32(0));
      }
    }
    return rep;
  }

  async Bell(req) {
    var percent = req.data_byte;
    $('audio#bell')[0].play();
  }

  async ChangeHosts(req) {
    var host = x_types.Host.fromString(req.host);
    if (req.mode)
      this.server.deleteAllowedHost(host);
    else
      this.server.insertAllowedHost(host);
  }

  async ListHosts(req) {
    var rep = new x_types.Reply(req);
    rep.mode = this.server.access_control;
    rep.hosts = this.server.allowed_hosts.lookup;
  }

  async SetAccessControl(req) {
    this.server.access_control = !! req.mode;
  }

  async SetCloseDownMode(req) {
    this.closedown = _closedown_mode[req.data_byte];
  }
  
  async KillClient(req) {
    var rid = req.rid
      , resource = this.server.resources.get(rid);
    console.log('KillClient', rid, resource);
    if (rid && resource)
      resource.owner.disconnect();
    console.warn('TODO', 'Finish me');
  }

  async GetModifierMapping(req) {
    var rep = new x_types.Reply(req) // FIXME: Migrate to x_types.WorkReply
      , datas = (['Shift', 'Lock', 'Control', 'Mod1', 'Mod2', 'Mod3', 'Mod4', 'Mod5'])
          .map(function (name) { return this.server.keymap.find(name) }, this);

    rep.data_byte = datas.reduce(function (o, v) { return Math.max(o, v.length) }, 0);
    rep.data_extra.push(...datas.reduce(function (array, values) { 
      for (var i = 0; i < rep.data_byte; i++) {
        array.push(new x_types.UInt8(values [i] || 0))
      };
      return array
    }, []));
    return rep;
  }

  async NoOperation(req) {
  }
}
XServerClient.opcodes = {
    1: 'CreateWindow'
  , 2: 'ChangeWindowAttributes'
  , 3: 'GetWindowAttributes'
  , 4: 'DestroyWindow'
  , 5: 'DestroySubWindows'
  , 6: 'ChangeSaveSet'
  , 7: 'ReparentWindow'
  , 8: 'MapWindow'
  , 9: 'MapSubwindows'
  , 10: 'UnmapWindow'
  , 11: 'UnmapSubwindows'
  , 12: 'ConfigureWindow'
  , 13: 'CirculateWindow'
  , 14: 'GetGeometry'
  , 15: 'QueryTree'
  , 16: 'InternAtom'
  , 17: 'GetAtomName'
  , 18: 'ChangeProperty'
  , 19: 'DeleteProperty'
  , 20: 'GetProperty'
  , 21: 'ListProperties'
  , 22: 'SetSelectionOwner'
  , 23: 'GetSelectionOwner'
  , 24: 'SetSelectionOwner'
  , 25: 'SendEvent'
  , 26: 'GrabPointer'
  , 27: 'UngrabPointer'
  , 28: 'GrabButton'
  , 29: 'UngrabButton'
  , 30: 'ChangeActivePointerGrab'
  , 31: 'GrabKeyboard'
  , 32: 'UngrabKeyboard'
  , 33: 'GrabKey'
  , 34: 'UngrabKey'
  , 35: 'AllowEvents'
  , 36: 'GrabServer'
  , 37: 'UngrabServer'
  , 38: 'QueryPointer'
  , 39: 'GetMotionEvents'
  , 40: 'TranslateCoordinates'
  , 41: 'WarpPointer'
  , 42: 'SetInputFocus'
  , 43: 'GetInputFocus'
  , 44: 'QueryKeymap'
  , 45: 'OpenFont'
  , 46: 'CloseFont'
  , 47: 'QueryFont'
  , 48: 'QueryTextExtents'
  , 49: 'ListFonts'
  , 50: 'ListFontsWithInfo'
  , 51: 'SetFontPath'
  , 52: 'GetFontPath'
  , 53: 'CreatePixmap'
  , 54: 'FreePixmap'
  , 55: 'CreateGC'
  , 56: 'ChangeGC'
  , 57: 'CopyGC'
  , 58: 'SetDashes'
  , 59: 'SetClipRectangles'
  , 60: 'FreeGC'
  , 61: 'ClearArea'
  , 62: 'CopyArea'
  , 63: 'CopyPlane'
  , 64: 'PolyPoint'
  , 65: 'PolyLine'
  , 66: 'PolySegment'
  , 67: 'PolyRectangle'
  , 68: 'PolyArc'
  , 69: 'FillPoly'
  , 70: 'PolyFillRectangle'
  , 71: 'PolyFillArc'
  , 72: 'PutImage'
  , 73: 'GetImage'
  , 74: 'PolyText8'
  , 75: 'PolyText16'
  , 76: 'ImageText8'
  , 77: 'ImageText16'
  , 78: 'CreateColormap'
  , 79: 'FreeColormap'
  , 80: 'CopyColormapAndFree'
  , 81: 'InstallColormap'
  , 82: 'UninstallColormap'
  , 83: 'ListInstalledColormaps'
  , 84: 'AllocColor'
  , 85: 'AllocNamedColor'
  , 86: 'AllocColorCells'
  , 87: 'AllocColorPlanes'
  , 88: 'FreeColors'
  , 89: 'StoreColors'
  , 90: 'StoreNamedColor'
  , 91: 'QueryColors'
  , 92: 'LookupColor'
  , 93: 'CreateCursor'
  , 94: 'CreateGlyphCursor'
  , 95: 'FreeCursor'
  , 96: 'RecolorCursor'
  , 97: 'QueryBestSize'
  , 98: 'QueryExtension'
  , 99: 'ListExtensions'
  , 100: 'ChangeKeyboardMapping'
  , 101: 'GetKeyboardMapping'
  , 102: 'ChangeKeyboardControl'
  , 103: 'GetKeyboardControl'
  , 104: 'Bell'
  , 105: 'ChangePointerControl'
  , 106: 'GetPointerControl'
  , 107: 'SetScreenSaver'
  , 108: 'GetScreenSaver'
  , 109: 'ChangeHosts'
  , 110: 'ListHosts'
  , 111: 'SetAccessControl'
  , 112: 'SetCloseDownMode'
  , 113: 'KillClient'
  , 114: 'RotateProperties'
  , 115: 'ForceScreenSaver'
  , 116: 'SetPointerMapping'
  , 117: 'GetPointerMapping'
  , 118: 'SetModifierMapping'
  , 119: 'GetModifierMapping'
  , 127: 'NoOperation'
}; // 34 or 127

  function stringPad (string) {
    return string.length + (4 - ((string.length % 4) || 4));
  }

  (function () {
    console.log(
        'Missing these opcode functions:'
      , Object.keys(XServerClient.opcodes).map(function (i) { return XServerClient.opcodes[i] })
          .filter(function (n) { return ! XServerClient.prototype[n] })
    );
    var opcodes = Object.keys(XServerClient.opcodes).filter(function (n) { return XServerClient.prototype[XServerClient.opcodes[n]] }).length;
    console.log(Object.keys(XServerClient.opcodes).length);
    console.log('Implemented', opcodes, 'opcodes of 127, that\'s', opcodes / 127 * 100, '%');
  })();
