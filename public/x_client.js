define('x_client', ['worker_console', 'lib/async', 'x_types', 'endianbuffer', 'rgb_colors'], function (console, async, x_types, EndianBuffer, rgb_colors) {
  var window = null;
  
  function XServerClient (server, id, resource_id_base, resource_id_mask, host) {
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

  XServerClient.prototype.write = function (data) {
    if ((data instanceof x_types.Reply) || (data instanceof x_types.Error) || (data instanceof x_types.events.Event)) // FIXME: Migrate to x_types.WorkReply
      return this.server.write(this, data.toBuffer());
    return this.server.write(this, data);
  }

  XServerClient.prototype.processRequest = function (message) {
    var req = message.request
      , req_str = '> Request (' + this.idLog + ') ' + message.type;
    console.log(req_str, req);
    if (message.type === 'SetupRequest') {
      if (this.state !== 0)
        throw new Error('SetupRequest received at the wrong time?!');
      this.setup(req)
    } else {
      var self = this;
      var func = self[message.type];
      try {
        console.time(req_str);
        func && func.call(self, req, function (err, rep) {
          console.timeEnd(req_str);
          if (rep) {
            if (Array.isArray(rep))
              rep.forEach(self.processReply.bind(self));
            else
              self.processReply(rep);
          }
        });
      } catch (e) {
        console.timeEnd(req_str);
        if (e instanceof x_types.Error) {
          e.endian = req.endian;
          e.opcode = req.opcode;
          e.sequence = req.sequence & 0xffff;
          console.error(self.id, e, e.stack);
          self.processReply(e);
        } else {
          console.error('Implementation Error', e.stack);
          self.processReply(new x_types.Error(req, 17, 0));
          throw e;
        }
      }
    }
  }
  
  XServerClient.prototype.processReply = function (rep) {
    if (rep instanceof x_types.events.Event)
      rep.sequence = this.sequence_sent;
    if (this.sequence_sent < rep.sequence)
      this.sequence_sent = rep.sequence;
    this.write(rep);
  }
  
  XServerClient.prototype.sendEvent = function (event) {
    //console.error((new Event).stack);
    // Endian hacks until we process events within x_protocol worker!
    event.endian = this.endian;
    if (Array.isArray(event))
      event.forEach(function (event) { event.endian = this.endian; this.processReply(event) }, this);
    else
      this.processReply(event);
    return;
  }

  XServerClient.prototype.disconnect = function () {
    console.log('Disconnect', this.id);
    delete this.server.clients[this.id];
    if (this.closedown === 'destroy')
      Object.keys(this.server.resources)
        .forEach(function (resource) {
          resource = this.server.resources[resource];
          if (! resource)
            return;
          if (resource.owner === this)
            resource.destroy();
        }, this);
  }

  XServerClient.prototype.setup = function (data) {
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
    res.writeUInt16((32 + (this.server.formats.byteLength()) + stringPad(this.server.vendor) + this.server.screens.byteLength()) / 4, 6);
    res.writeUInt32(this.server.release, 8);
    res.writeUInt32(this.resource_id_base, 12);
    res.writeUInt32(this.resource_id_mask, 16);
    res.writeUInt32(this.server.motion_buffer_size, 20);
    res.writeUInt16(this.server.vendor.length, 24);
    res.writeUInt16(this.server.maximum_request_length, 26);
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
    var rep = new EndianBuffer(base);
    rep.fill(0);
    res.copy(rep, 0, 0, base);
    this.state = 1;
    this.write(rep);
  }

  XServerClient.prototype.imageFromBitmap = function (dest, data, depth, width, height, pad) {
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

  XServerClient.prototype.imageToBitmap = function (data, depth, width, height) {
    throw new Error('STUB: Implement imageToBitmap')
  }

  XServerClient.prototype.imageFromXYPixmap = function (dest, data, depth, width, height, pad) {
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

  XServerClient.prototype.imageToXYPixmap = function (data, depth, width, height) {
    throw new Error('STUB: Implement imageToXYPixmap')
  }

  XServerClient.prototype.imageFromZPixmap = function (dest, data, depth, width, height, pad) {
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

  XServerClient.prototype.imageToZPixmap = function (from, depth, width, height) {
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

  XServerClient.prototype.CreateWindow = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.ChangeWindowAttributes = function (req, callback) {
    console.log('ChangeWindowAttributes', req);
    this.server.getResource(req.window, x_types.Window)
      .changeFields(this, req.fields);
    callback();
  }

  XServerClient.prototype.GetWindowAttributes = function (req, callback) {
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
    callback(null, rep);
  }
  
  XServerClient.prototype.DestroyWindow = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    if (window !== window.owner.server.root)
      window.destroy();
    callback();
  }

  XServerClient.prototype.DestroySubWindows = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    window.children.forEach(function (child) {
      child.destroy();
    });
    callback();
  }

  XServerClient.prototype.ChangeSaveSet = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    if (req.data_byte) {
      delete this.save_set[this.save_set.indexOf(window)];
    } else {
      this.save_set.push(window);
    }
    callback();
  }

  XServerClient.prototype.ReparentWindow = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.MapWindow = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('MapWindow', window.id);
    reps = [];
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
    callback(null, reps);
  }

  XServerClient.prototype.MapSubwindows = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('MapSubwindows', window.id);
    var reps = [];
    function run (parent_children) {
      var children_children = [];
      parent_children.forEach(function (child_window, i) {
        if (child_window.map()) {
          child_window.triggerEvent('MapNotify')
          child_window.triggerEvent('Expose', { count: 0 });
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
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('UnmapWindow');
    window.unmap()
    callback();
  }
  
  XServerClient.prototype.UnmapSubwindows = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    console.log('UnmapSubwindows');
    window.children.forEach(function (child) {
      child.unmap();
    });
    callback();
  }

  XServerClient.prototype.ConfigureWindow = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
    console.log('ConfigureWindow', window, req.fields);
    window.sibling = null;
    Object.keys(req.fields).forEach(function (key) {
      window[key] = req.fields[key];
    })
    console.log('ConfigureWindow FIXME: Incomplete');
    callback();
  }

  XServerClient.prototype.GetGeometry = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , rep = new x_types.WorkReply(req);
    rep.depth = drawable.depth;

    rep.root = drawable.getRoot().id;
    rep.x = drawable.x;
    rep.y = drawable.y;
    rep.width = drawable.width;
    rep.height = drawable.height;
    // TODO: 2 byte border-geom
    callback(null, rep);
  }

  XServerClient.prototype.QueryTree = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req)
      , root = window.getRoot();
    rep.root = root && root.id;
    rep.parent = window.parent && window.parent.id;
    rep.children = window.children.map(function (child) {
      return child.id;
    });
    console.log(rep.children);
    callback(null, rep);
  }

  XServerClient.prototype.InternAtom = function (req, callback) {
    var index = this.server.getAtom(req.name, true)
      , rep = new x_types.WorkReply(req);
    if ((!index) && ! req.only_if_exists)
      index = this.server.atoms.push(req.name);
    rep.atom = index;
    callback(null, rep);
  }

  XServerClient.prototype.GetAtomName = function (req, callback) {
    var atom = this.server.getAtom(req.atom)
      , rep = new x_types.WorkReply(req);
    rep.name = atom;
    callback(null, rep);
  }

  XServerClient.prototype.ChangeProperty = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
    console.log('ChangeProperty', window, window.id, this.server.getAtom(req.atom));
    window.changeProperty(req.atom, this.server.getAtom(req.atom), req.format, req.type, req.value, req.mode);
    //console.log('ChangeProperty', window.id, property, format, data, mode);
    callback();
  }

  XServerClient.prototype.DeleteProperty = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window);
    window.deleteProperty(this.server.getAtom(req.atom));
    window.triggerEvent('PropertyNotify', { atom: req.atom, deleted: true });
    callback();
  }


  XServerClient.prototype.GetProperty = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
      , property = this.server.getAtom(req.atom)
      , type = req.type
      , long_off = req.long_off
      , long_len = req.long_len
      , rep = new x_types.WorkReply(req);

    //console.log('Get Property', window.id, property);

    var value = window.getProperty(property);
    if (!value)
      return callback(null, rep);

    rep.format = value.format;
    rep.type = value.type;
    rep.length = value.length;
    rep.value = value.buffer;
    callback(null, rep);
  }

  XServerClient.prototype.RotateProperties = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
      , delta = req.delta
      , property_names = req.atoms.map(function (atom) { return this.server.getAtom(atom) }, this)
      , property_vals = property_keys.map(function (key) { return this.getProperty(key) }, window);

    if (property_vals.some(function (val) { return 'undefined' === typeof val }))
      throw new Error('FIXME: This should throw a Match error'); //FIXME: Should also throw if dup keys
    if (!delta)
      return callback();
    property_vals.slice(-delta)
      .concat(property_vals.slice(0, -delta))
      .forEach(function (val, i) {
        window.setProperty(property_keys, val);
      });
  }

  XServerClient.prototype.ListProperties = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req);
    rep.atoms = Object.keys(window.properties).map(function (name) { return this.atoms.indexOf(name) + 1 }, this);
    callback(null, rep);
  }

  XServerClient.prototype.GetSelectionOwner = function (req, callback) {
    var atom_id = req.atom
      , atom = this.server.atoms[atom_id]
      , owner = this.server.atom_owners[atom_id]
      , rep = new x_types.WorkReply(req);
    rep.owner = (owner && this.server.getResource(owner) && owner) || 0;
    callback(null, rep);
  }

  XServerClient.prototype.SendEvent = function (req, callback) {
    // Hack to make event endian match until it's shifter to worker:
    req.event_data.endian = this.endian;
    var propagate = req.propagate
      , window = this.server.getResource(req.window, x_types.Window)
      , event = x_types.events.fromBuffer(this, req.event_data, 0);
    if (! event)
      throw new Error('SendEvent sent an unknown event');
    window.sendEvent(event, req.event_mask);
    callback();
  }

  XServerClient.prototype.GrabPointer = function (req, callback) {
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
    callback(null, rep);
  }

  XServerClient.prototype.UngrabPointer = function (req, callback) {
    var time = req.time;
    if (this.server.grab_pointer) {
      this.server.grab_pointer = null;
      var cursor = this.server.root.element.data('grab_pointer_class');
      if (cursor)
        this.server.root.element.removeClass(cursor);
      this.server.root.element.parent().parent().parent().removeClass('grab_pointer');
    }
    callback();
  }
  
  XServerClient.prototype.GrabKeyboard = function (req, callback) {
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
    callback(null, rep);
  }
  
  XServerClient.prototype.UngrabKeyboard = function (req, callback) {
    var time = req.time;
    if (this.server.grab_keyboard) {
      this.server.grab_keyboard = null;
      this.server.root.element.parent().parent().parent().removeClass('grab_keyboard');
    }
    callback();
  }

  XServerClient.prototype.GrabServer = function (req, callback) {
    this.server.grab = this;
    this.server.grab_reason = 'GrabServer';
    callback();
  }

  XServerClient.prototype.UngrabServer = function (req, callback) {
    this.server.grab = null;
    this.server.flushGrabBuffer();
    callback();
  }

  XServerClient.prototype.QueryPointer = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
      , rep = new x_types.WorkReply(req);
    rep.serverX = this.server.mouseX;
    rep.serverY = this.server.mouseY;
    rep.windowX = this.server.mouseX - window.x;
    rep.windowY = this.server.mouseY - window.y;
    callback(null, rep);
  }

  XServerClient.prototype.SetInputFocus = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.GetInputFocus = function (req, callback) {
    var rep = new x_types.WorkReply(req);
    rep.revert_to = this.server.input_focus_revert;
    if (this.server.input_focus === this.server.root)
      rep.focus = 1;
    else if (this.server.input_focus)
      rep.focus = this.server.input_focus.id;
    else
      rep.focus = 0;
    callback(null, rep);
  }

  XServerClient.prototype.OpenFont = function (req, callback) {
    var fid = req.fid
      , length = req.name_length
      , name = req.name;
    this.server.grab = this;
    this.server.grab_reason = 'OpenFont';
    this.server.openFont(this, fid, name);
    callback();
  }

  XServerClient.prototype.CloseFont = function (req, callback) {
    var font = this.server.getResource(req.font, x_types.Font);
    font.close();
    callback();
  }

  XServerClient.prototype.QueryFont = function (req, callback) {
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
    callback(null, rep);
  }

  XServerClient.prototype.ListFonts = function (req, callback) {
    var rep = new x_types.WorkReply(req);
    rep.fonts = this.server.listFonts(req.pattern).slice(0, req.max_names);
    callback(null, rep);
  }

  XServerClient.prototype.ListFontsWithInfo = function (req, callback) {
    var fonts = this.server.listFonts(req.pattern).slice(0, req.max_names);
    console.log('ListFontsWithInfo', req.pattern);
    if (!fonts.length) {
      var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
      rep.data_extra.push(new x_types.Nulls(7 * 4));
      return callback(null, rep);
    }
    async.map(
        fonts
      , function (font_name, callback) {
          var resolved_name = this.server.resolveFont(font_name);
          if (resolved_name[1])
            return this.server.loadFont(resolved_name[1], resolved_name[0], callback);
          console.log('Not loading invalid name');
          callback('Not resolved');
        }
      , function (err, fonts) {
          fonts = fonts.filter(function (font) { return font && !font.error });
          this.server.grab = false;
          this.server.flushGrabBuffer();
          var reps = fonts.map(function (font) {
            var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
            rep.data = new EndianBuffer(32);
            rep.data.endian = self.endian;
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
          }.bind(this));
          var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
          rep.data_extra.push(new x_types.Nulls(7 * 4));
          reps.push(rep);
          callback(null, reps);
        }.bind(this)
    );
  }

  XServerClient.prototype.CreatePixmap = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable);
    console.log('CreatePixmap', req.depth, req.pid, drawable, req.width, req.height);
    if (drawable.depth !== req.depth && req.depth !== 1) {
      throw new x_types.Error(req, 4, req.depth);
    }
    this.server.putResource(new x_types.Pixmap(this, req.pid, req.depth, drawable, req.width, req.height));
    callback();
  }

  XServerClient.prototype.FreePixmap = function (req, callback) {
    this.server.freeResource(req.pid, x_types.Pixmap);
    callback();
  }

  XServerClient.prototype.CreateGC = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
    console.log('CreateGC', drawable, req.cid, req.fields)
    this.server.putResource(new x_types.GraphicsContext(this, req.cid, drawable, req.fields));
    callback();
  }

  XServerClient.prototype.ChangeGC = function (req, callback) {
    this.server.getResource(req.gc, x_types.GraphicsContext)
      .changeFields(this, req.fields);
    callback();
  }

  XServerClient.prototype.CopyGC = function (req, callback) {
    this.server.getResource(req.src_gc, x_types.GraphicsContext)
      .copyTo(
          this.server.getResource(req.dst_gc, x_types.GraphicsContext)
        , req.fields
      );
    callback();
  }

  XServerClient.prototype.ClearArea = function (req, callback) {
    var window = this.server.getResource(req.window, x_types.Window)
      , w = req.w || (window.width - req.y)
      , h = req.h || (window.height - req.x);
    var context = window.canvas[0].getContext('2d');
    context.clearRect(req.x, req.y, w, h);
    if (req.exposures)
      window.triggerEvent('Expose', { x: req.x, y: req.y, width: w, height: h });
    callback();
  }

  XServerClient.prototype.CopyArea = function (req, callback) {
    var src    = this.server.getResource(req.src, x_types.Drawable)
      , dst    = this.server.getResource(req.dst, x_types.Drawable)
      , gc     = this.server.getResource(req.gc, x_types.GraphicsContext)
      , data   = src.getImageData(req.src_x, req.src_y, req.width, req.height);
    console.log('CopyArea', src.id, dst.id, req.src_x, req.src_y, req.dst_x, req.dst_y, req.width, req.height);
    dst.putImageData(data, req.dst_x, req.dst_y);
    if (gc.graphics_exposures)
      dst.owner.sendEvent(new x_types.events.map.NoExposure(dst, { major: req.opcode, minor: 0 }));
    callback();
  }

  XServerClient.prototype.FreeGC = function (req, callback) {
    this.server.freeResource(req.gc, x_types.GraphicsContext);
    callback();
  }

  XServerClient.prototype.PolyLine = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.PolySegment = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.PolyRectangle = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable);
    req.rectangles.forEach(function (rect) {
      context.beginPath();
      context.rect.apply(context, rect);
      context.stroke();
    });
    callback();
  }

  XServerClient.prototype.FillPoly = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.PolyFillRectangle = function (req, callback) {
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
    callback();
  }

  XServerClient.prototype.PolyFillArc = function (req, callback) {
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
    callback();
  }

  var _image_formats = ['Bitmap', 'XYPixmap', 'ZPixmap'];
  XServerClient.prototype.PutImage = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , context = this.server.getResource(req.context, x_types.GraphicsContext)
    context.putImage(drawable, req.format, req.image, req.width, req.height, req.x, req.y, req.pad, req.depth);
    console.log(req.format, req.width, req.height, req.x, req.y, req.pad, req.depth);
    callback();
  }

  XServerClient.prototype.GetImage = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    console.log('GetImage', drawable.id);
    rep.data_byte = drawable.depth;
    rep.data_extra.push(
      new x_types.DataBuffer(
        this['imageTo' + req.format](drawable.getImageData(req.x, req.y, req.w, req.h), drawable.depth, req.w, req.h)
      )
    );
    callback(null, rep);
    console.log('FIXME GetImage:', req.format, drawable, req.x, req.y, req.w, req.h, req.plane_mask);
  }

  XServerClient.prototype.PolyText8 = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , x = req.x;
    req.textitems.forEach(function (item) {
      context.fillText(item.str, x + item.delta, req.y);
      x += context.measureText(item.str).width + item.delta;
    });
    callback();
  }

  XServerClient.prototype.PolyText16 = function (req, callback) {
    var drawable = this.server.getResource(req.drawable, x_types.Drawable)
      , gc = this.server.getResource(req.gc, x_types.GraphicsContext)
      , context = gc.getContext(drawable)
      , x = req.x;
    req.textitems.forEach(function (item) {
      context.fillText(item.str, x + item.delta, req.y);
      x += context.measureText(item.str).width + item.delta;
    });
    callback();
  }

  XServerClient.prototype.AllocColor = function (req, callback) {
    var cmap = this.server.getResource(req.cmap, x_types.ColorMap)
      , rep = new x_types.WorkReply(req);
    rep.r = req.r;
    rep.g = req.g;
    rep.b = req.b;
    rep.id =  (req.r << 16) | (req.g << 8) | req.b;
    callback(null, rep);
  }

  XServerClient.prototype.QueryColors = function (req, callback) {
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
    callback(null, rep);
  }


  XServerClient.prototype.LookupColor = function (req, callback) {
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

    callback(null, rep);
  }

  XServerClient.prototype.CreateGlyphCursor = function (req, callback) {
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
      callback();
    }, 20);
  }

  XServerClient.prototype.QueryBestSize = function (req, callback) {
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
    callback(null, rep);
  }

  XServerClient.prototype.QueryExtension = function (req, callback) {
    console.log('QueryExtension - Incomplete');
    var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    rep.data.writeUInt8(0, 0);
    rep.data.writeUInt8(req.opcode, 1);
    rep.data.writeUInt8(0, 2);
    rep.data.writeUInt8(0, 3);
    callback(null, rep);
  }

  XServerClient.prototype.ListExtensions = function (req, callback) {
    console.log('ListExtensions');
    var rep = new x_types.Reply(req); // FIXME: Migrate to x_types.WorkReply
    callback(null, rep);
  }

  XServerClient.prototype.GetKeyboardMapping = function (req, callback) {
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
    callback(null, rep);
  }

  XServerClient.prototype.Bell = function (req, callback) {
    var percent = req.data_byte;
    $('audio#bell')[0].play();
    callback();
  }

  XServerClient.prototype.ChangeHosts = function (req, callback) {
    var host = x_types.Host.fromString(req.host);
    if (req.mode)
      this.server.deleteAllowedHost(host);
    else
      this.server.insertAllowedHost(host);
    callback();
  }

  XServerClient.prototype.ListHosts = function (req, callback) {
    var rep = new x_types.Reply(req);
    rep.mode = this.server.access_control;
    rep.hosts = this.server.allowed_hosts.lookup;
    callback();
  }

  XServerClient.prototype.SetAccessControl = function (req, callback) {
    this.server.access_control = !! req.mode;
    callback();
  }

  var _closedown_mode = ['destroy', 'permanent', 'temporary'];
  XServerClient.prototype.SetCloseDownMode = function (req, callback) {
    this.closedown = _closedown_mode[req.data_byte];
    callback();
  }
  
  XServerClient.prototype.KillClient = function (req, callback) {
    var rid = req.rid
      , resource = this.server.resources[rid];
    console.log('KillClient', rid, resource);
    if (rid && resource)
      resource.owner.disconnect();
    console.warn('TODO', 'Finish me');
    callback();
  }

  XServerClient.prototype.GetModifierMapping = function (req, callback) {
    var rep = new x_types.Reply(req) // FIXME: Migrate to x_types.WorkReply
      , datas = (['Shift', 'Lock', 'Control', 'Mod1', 'Mod2', 'Mod3', 'Mod4', 'Mod5'])
          .map(function (name) { return this.server.keymap.find(name) }, this);

    rep.data_byte = datas.reduce(function (o, v) { return Math.max(o, v.length) }, 0);
    rep.data_extra = datas.reduce(function (array, values) { 
      for (var i = 0; i < rep.data_byte; i++) {
        array.push(new x_types.UInt8(values [i] || 0))
      };
      return array
    }, []);
    callback(null, rep);
  }

  XServerClient.prototype.NoOperation = function (req, callback) {
    callback();
  }

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

  return XServerClient;
});
