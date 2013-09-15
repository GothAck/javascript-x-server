define(
    'x_protocol'
  , ['worker_console', 'util', 'lib/async', 'x_types', 'endianbuffer']
  , function (console, util, async, x_types, EndianBuffer) {
      var module = { exports: {} }

      var _gc_vfields = [
          'function' , 'plane_mask' , 'foreground' , 'background'
        , 'line_width' , 'line_style' , 'cap_style' , 'join_style' , 'fill_style' , 'fill_rule'
        , 'tile' , 'stipple', 'tile_stipple_x_origin', 'tile_stipple_y_origin'
        , 'font', 'subwindow_mode', 'graphics_exposures', 'clip_x_origin', 'clip_y_origin', 'clip_mask'
        , 'dash_offset', 'gc_dashes', 'arc_mode'
      ];
      function GCVField (vmask, vdata) {
        var offset = 0;
        for (var i = 0; i < _gc_vfields.length; i++)
          if (vmask & Math.pow(2, i))
            this[_gc_vfields[i]] = vdata.readUInt32((offset ++) * 4);
      }
      function getGCVFieldNames (vmask) {
        var names = []
          , offset = 0;
        for (var i = 0; i < _gc_vfields.length; i++)
          if (vmask & Math.pow(2, i))
            names.push(_gc_vfields[i]);
        return names;
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
      function WinVField (vmask, vdata) {
        var offset = 0;
        for (var i = 0; i < _gc_vfields.length; i++)
          if (vmask & Math.pow(2, i)) {
            this[_win_vfields[i]] = vdata['read' + _win_vfield_types[i]](offset);
            offset += 4;
          }
      }
      var _win_configure_vfields = [
        'x', 'y', 'width', 'height', 'border_width', 'sibling', 'stack_mode'
      ]
      function WinConfigureField (vmask, vdata) {
        var offset = 0;
        for (var i = 0; i < _win_configure_vfields.length; i++)
          if (vmask & Math.pow(2, i))
            this[_win_configure_vfields[i]] = vdata.readUInt32((offset ++) * 4);
      }



      function XProtocolServer (socket, onClose) {
        console.log('new XProtocolServer')
        this.socket = socket;
        this.onClose = onClose;
        this.clients = {};
        socket.addEventListener('message', this.socketMessage.bind(this));
        socket.addEventListener('close', this.socketClose.bind(this));
        socket.addEventListener('open', this.socketOpen.bind(this));
      }
      XProtocolServer.prototype.serverMessage = function (message) {
        var client = this.clients[message.id];
        if (! client)
          postMessage({ cmd: 'error', message: 'not connected?' });
        client.state = message.state;
        var data = new EndianBuffer(message.data)
          , buffer = new EndianBuffer(data.length + client.id.length + 1);
        buffer.writeUInt8(client.id.length, 0);
        buffer.write(client.id, 1, null, 'ascii');
        data.copy(buffer, client.id.length + 1);
        this.socket.send(buffer.buffer);
      }
      XProtocolServer.prototype.serverReply = function (message) {
        try {
          var client = this.clients[message.id]
            , ReqObj = Request[Request.opcodes[message.data.opcode]]
            , Rep = ReqObj.Rep;
          var rep = new Rep(message.data, client)
            , data = rep.toBuffer()
            , buffer = new EndianBuffer(data.length + client.id.length + 1);
          buffer.writeUInt8(client.id.length, 0);
          buffer.write(client.id, 1, null, 'ascii');
          data.copy(buffer, client.id.length + 1);
          this.socket.send(buffer.buffer);
        } catch (e) {
          console.error(e.toString(), e.stack);
        }
      }
      XProtocolServer.prototype.socketMessage = function (event) {
        if (event.data.constructor === String) {
          var data = event.data.split(' ');
          switch (data[0]) {
            case 'SCR':
              postMessage({
                  cmd: 'screen'
                , id: data[1]
              });
            break
            case 'NEW':
              var client = this.clients[data[1]] = new XProtocolClient(data[1]);
              postMessage({
                  cmd: 'new'
                , id: data[1]
                , host: client.host
                , port: client.port
                , host_type: client.host_type
              });
            break;
            case 'END':
              this.clients[data[1]].end();
              delete this.clients[data[1]]
            break;
            case 'PING':
              socket.send('PONG');
            break;
            default:
              console.error('Unknown message received', data.join(' '));
          }
        } else {
          var data = new EndianBuffer(event.data)
            , length = data.readUInt8(0)
            , id = data.toString('ascii', 1, length + 1);
          if (! this.clients[id])
            throw new Error('Invalid client! Disconnected?');
          this.clients[id].processData(data.slice(length + 1));
        }
      }
      XProtocolServer.prototype.socketClose = function (event) {
        postMessage({ cmd: 'close' });
        this.socket = null;
        this.onClose && this.onClose();
      }
      XProtocolServer.prototype.socketOpen = function (event) {
        postMessage({ cmd: 'open' });
      }
      module.exports.XProtocolServer = XProtocolServer;
      
      function XProtocolClient (id, sendData) {
        this.id = id;
        id = id.match(/^([^\]]+)\[([^\]]+)\]:(\d+)$/);
        if (!id)
          throw new Error('Invalid id host');
        this.host_type = id[1];
        this.host = id[2];
        this.port = id[3];
        this.sendData = sendData;
        this.endian = false;
        this.state = 0;
        this.sequence = 1;
      }
      XProtocolClient.prototype.end = function () {
        postMessage({ cmd: 'end', id: this.id });
      }
      XProtocolClient.prototype.postRequest = function (request) {
        var type = request.constructor.name || request.opname
          , transferrable = [];
        Object.keys(request).forEach(function (name) {
          if (request[name] instanceof EndianBuffer) {
            transferrable.push(request[name] = request[name].buffer);
          }
        });
        postMessage({ cmd: 'request', id: this.id, type: type, request: request });
      }
      XProtocolClient.prototype.processData = function (data) {
        data.endian = this.endian;
        if (this.buffer) {
          var data_new = new EndianBuffer(this.buffer.length + data.length);
          data_new.endian = this.endian;
          this.buffer.copy(data_new, 0);
          data.copy(data_new, this.buffer.length);
          delete this.buffer;
          data = data_new;
        }
        switch (this.state) {
          case 0:
            var req = new SetupRequest(data);
            this.endian = req.endian;
            this.postRequest(req);
          break;
          case 1:
            var req = { length: 0 };
            var gooj = 2000;
            while (data.length > 0) {
              gooj -= 1;
              if (gooj < 1) throw new Error('You are out of jail, have a nice day!');
              var req_str = '> Request decode (' + this.id + ') ' + this.sequence;
              console.time(req_str);
              req = new Request(data, this.sequence);
              console.timeEnd(req_str);
              if (req.length > data.length) {
                this.buffer = data;
                break;
              }
              console.time(req_str);
              console.log('>> Post request', req.opcode, req.opname);
              this.sequence = this.sequence + 1;
              this.postRequest(req);
              if (data.length > 0)
                data = data.slice(req.length);
            }
          break;
        }
      }
      module.exports.XProtocolClient = XProtocolClient;
      
      function SetupRequest (data) {
        this.endian = data.endian = data.readUInt8(0) !== 66;
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
      }
      module.exports.SetupRequest = SetupRequest;

      function Reply (rep, client) {
        this.endian = client.endian;
        this.opcode = this.constructor.Req.opcode;
        this.sequence = rep.sequence;
        this.data_byte = 0;
        this.data = new EndianBuffer(24);
        this.data.endian = this.endian;
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
            this.data_extra.push(new x_types.UInt8(0));
        buffer.writeUInt32((this.data_extra.byteLength() + this.data.length - 24)/ 4, offset += 2);
        this.data.copy(buffer                               , offset += 4);
        return this.data_extra.writeBuffer(buffer           , offset += this.data.length);
      }

      Reply.prototype.toBuffer = function () {
        var buffer = new EndianBuffer(this.length);
        buffer.endian = this.data.endian;
        this.writeBuffer(buffer, 0);
        return buffer;
      }
      
      function Request (data, sequence) {
        this.sequence = sequence;
        this.opcode = data.readUInt8(0);
        this.opname = this.constructor.opcodes[this.opcode];
        if (Request[this.opname]) {
          Object.defineProperty(this, 'constructor', {
              value: Request[this.opname]
            , enumerable: false
          });
          this.__proto__ = this.constructor.prototype;
        }
        this.data_byte = data.readUInt8(1);
        this.length_quad = data.readUInt16(2);
        this.length = this.length_quad * 4;
        this.data = data.slice(4, this.length + 4);
        this.data.endian = data.endian;
        this.endian = data.endian;
        if (this.constructor !== Request) {
          this.constructor.apply(this, arguments);
          delete this.data;
        }
      }
      module.exports.Request = Request;
      Request.opcodes = {
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
      }
      Request.opcodes_name = Object.keys(Request.opcodes)
        .reduce(
            function (o, key) {
              o[Request.opcodes[key]] = key;
              return o;
            }
          , {}
        );
      Request.CreateWindow = function () {
        this.depth = this.data_byte;
        this.id = this.data.readUInt32(0);
        this.parent = this.data.readUInt32(4);
        this.x = this.data.readInt16(8);
        this.y = this.data.readInt16(10);
        this.width = this.data.readUInt16(12);
        this.height = this.data.readUInt16(14);
        this.border_width = this.data.readUInt16(16);
        this.class = this.data.readUInt16(18);
        this.visual = this.data.readUInt32(20);
        this.fields = new WinVField(
            this.data.readUInt32(24)
          , this.data.slice(28)
        );
      }
    
      Request.ChangeWindowAttributes = function () {
        this.window = this.data.readUInt32(0);
        this.fields = new WinVField(
            this.data.readUInt32(4)
          , this.data.slice(8)
        );
      }
    
      Request.GetWindowAttributes = function () {
        this.window = this.data.readUInt32(0)
      }

      Request.GetWindowAttributes.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data_byte = rep.backing_store;
        this.data.writeUInt32(rep.visual_id, 0); // Visual id
        this.data.writeUInt16((!rep.input_output) + 1, 4); // Class (1 InputOutput, 2 InputOnly)
        this.data.writeUInt8(rep.bit_gravity, 6); // Bit gravity
        this.data.writeUInt8(rep.win_gravity, 7); // Win gravity
        this.data.writeUInt32(rep.backing_planes, 8); // Backing planes
        this.data.writeUInt32(rep.background_pixel || 0, 12); // Backing pixel
        this.data.writeUInt8(rep.save_under, 16); // Save under
        this.data.writeUInt8(rep.map_installed, 17); // Map is installed
        this.data.writeUInt8(rep.map_state, 18); // Map state (0 Unmapped, 1 Unviewable, 2 Viewable)
        this.data.writeUInt8(rep.override_redirect, 19); // Override redirect
        this.data.writeUInt32(rep.colormap, 20); // Colormap
        this.data_extra.push(new x_types.UInt32(rep.event_mask)); // All event masks
        this.data_extra.push(new x_types.UInt32(rep.event_mask)); // Your event mask
        this.data_extra.push(new x_types.UInt16(rep.do_not_propagate_mask)); // Do not propagate mask
        this.data_extra.push(new x_types.UInt16(0)); // Unused
      }
      
      Request.DestroyWindow = function () {
        this.window = this.data.readUInt32(0)
      }
    
      Request.DestroySubWindows = function () {
        this.window = this.data.readUInt32(0)
      }
    
      Request.ChangeSaveSet = function () {
        this.window = this.data.readUInt32(0)
      }
    
      Request.ReparentWindow = function () {
        this.window = this.data.readUInt32(0)
        this.parent = this.data.readUInt32(4)
        this.x = this.data.readInt16(8)
        this.y = this.data.readInt16(10)
      }
    
      Request.MapWindow = function () {
        this.window = this.data.readUInt32(0)
      }
    
      Request.MapSubwindows = function () {
        this.window = this.data.readUInt32(0)
      }
    
      Request.UnmapWindow = function () {
        this.window = this.data.readUInt32(0)
      }
      
      Request.UnmapSubwindows = function () {
        this.window = this.data.readUInt32(0)
      }
    
      Request.ConfigureWindow = function () {
        this.window = this.data.readUInt32(0)
        this.fields = new WinConfigureField(
            this.data.readUInt16(4)
          , this.data.slice(8)
        )
      }
    
      Request.GetGeometry = function () {
        this.drawable = this.data.readUInt32(0)
      }

      Request.GetGeometry.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data_byte = rep.depth;
        this.data.writeUInt32(rep.root.id, 0);
        this.data.writeInt16(rep.x, 4);
        this.data.writeInt16(rep.y, 6);
        this.data.writeInt16(rep.width, 8);
        this.data.writeInt16(rep.height, 10);
        // TODO: 2 byte border-geom
      }
    
      Request.QueryTree = function () {
        this.window = this.data.readUInt32(0)
      }

      Request.QueryTree.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt32(rep.root, 0);
        this.data.writeUInt32(rep.parent || 0, 4);
        this.data.writeUInt16(rep.children.length, 8);
        this.data_extra = rep.children.map(function (child) {
          return new x_types.UInt32(child);
        });
      }
    
      Request.InternAtom = function () {
        this.only_if_exists = this.data_byte
        this.name_length = this.data.readUInt16(0)
        this.name = this.data.toString('ascii', 4, 4 + this.name_length)
      }

      Request.InternAtom.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt32(rep.atom, 0);
      }
    
      Request.GetAtomName = function () {
        this.atom = this.data.readUInt32(0);
      }

      Request.GetAtomName.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt16(rep.name.length);
        this.data_extra.push(new x_types.String(rep.name));
      }
    
      Request.ChangeProperty = function () {
        this.mode = this.data_byte
        this.window = this.data.readUInt32(0)
        this.atom = this.data.readUInt32(4)
        this.type = this.data.readUInt32(8)
        this.format = this.data.readUInt8(12)
        this.value_length = this.data.readUInt32(16) *
          (this.format === 8 ? 1 : (this.format === 16 ? 2 : (this.format === 32) ? 4 : 0))
        this.value = this.data.slice(20, this.value_length + 20);
      }
    
      Request.DeleteProperty = function () {
        this.window = this.data.readUInt32(0)
        this.atom = this.data.readUInt32(4)
      }
    
    
      Request.GetProperty = function () {
        this.window = this.data.readUInt32(0)
        this.atom = this.data.readUInt32(4)
        this.type = this.data.readUInt32(8)
        this.long_off = this.data.readUInt32(12)
        this.long_len = this.data.readUInt32(16)
      }

      Request.GetProperty.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data_byte = rep.format;
        if (rep.format) {
          this.data.writeUInt32(rep.type || 0, 0);
          this.data.writeUInt32(rep.length || 0, 4);
          this.data.writeUInt32(rep.length / (rep.format / 8), 8);
          this.data_extra.push(new x_types.DataBuffer(rep.value));
        }
      }
    
      Request.RotateProperties = function () {
        this.window = this.data.readUInt32(0);
        this.atoms = Array.apply(Array, Array(this.data.readUInt16(4)))
          .map(function (v, i) {
            return this.data.readUInt32(i + 8);
          });
        this.delta = this.data.readUInt16(6) % this.atoms.length;
      }

      Request.ListProperties = function () {
        this.window = this.data.readUInt32(0)
      }

      Request.ListProperties.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt32(rep.atoms.length);
        rep.atoms.forEach(function (atom){
          this.data_extra.push(new x_types.UInt32(atom));
        }, this);
      }
    
      Request.GetSelectionOwner = function () {
        this.atom_id = this.data.readUInt32(0)
      }

      Request.GetSelectionOwner.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt32(rep.owner);
      }
    
      Request.SendEvent = function () {
        this.propagate = this.data_byte
        this.wid = this.data.readUInt32(0)
        this.window = this.data.readUInt32(0)
        this.event_mask = this.data.readUInt32(4)
        this.event_data = this.data.slice(8)
      }
    
      Request.GrabPointer = function () {
        this.window = this.data.readUInt32(0)
        this.owner_events = this.data_byte
        this.events = this.data.readUInt16(4)
        this.mouse_async = this.data.readUInt8(6)
        this.keybd_async = this.data.readUInt8(7)
        this.confine = this.data.readUInt32(8)
        this.cursor = this.data.readUInt32(12)
        this.timestamp = this.data.readUInt32(16)
      }
    
      Request.UngrabPointer = function () {
        this.time = this.data.readUInt32(0);
      }
      
      Request.GrabKeyboard = function () {
        this.window = this.data.readUInt32(0)
        this.owner_events = this.data_byte
        this.timestamp = this.data.readUInt32(4)
        this.mouse_async = this.data.readUInt8(8)
        this.keybd_async = this.data.readUInt8(9)
      }
      
      Request.UngrabKeyboard = function () {
        this.time = this.data.readUInt32(0);
      }
    
      Request.GrabServer = function () {
      }
    
      Request.UngrabServer = function () {
      }
    
      Request.QueryPointer = function () {
        this.window = this.data.readUInt32(0)
      }

      Request.QueryPointer.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt32(0x26, 0);
        this.data.writeUInt32(0, 4);
        this.data.writeUInt16(rep.serverX, 8);
        this.data.writeUInt16(rep.serverY, 10);
        this.data.writeUInt16(rep.windowX, 12);
        this.data.writeUInt16(rep.windowY, 14);
      }
    
      Request.SetInputFocus = function () {
        this.revert = this.data_byte
        this.window = this.data.readUInt32(0)
        this.time = this.data.readUInt32(4) || ~~(Date.now() / 1000);
      }
    
      Request.GetInputFocus = function () {
      }

      Request.GetInputFocus.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data_byte = rep.revert_to;
        this.data.writeUInt32(rep.focus, 0);
      }
    
      Request.OpenFont = function () {
        this.fid = this.data.readUInt32(0)
        this.name_length = this.data.readUInt16(4)
        this.name = this.data.toString('ascii', 8, this.name_length + 8);
      }
    
      Request.CloseFont = function () {
        this.font = this.data.readUInt32(0)
      }
    
      Request.QueryFont = function () {
        this.font = this.data.readUInt32(0)
      }

      Request.QueryFont.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data = new EndianBuffer(32);
        this.data.endian = this.endian;
      }
    
      Request.ListFonts = function () {
        this.max_names = this.data.readUInt16(0)
        this.pattern_length = this.data.readUInt16(2)
        this.pattern = this.data.toString('ascii', 4, 4 + this.pattern_length)
      }

      Request.ListFonts.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt16(rep.fonts.length, 0);
        this.data_extra = rep.fonts.map(function (font) {
          return new x_types.XString(font);
        })
      }
    
      Request.ListFontsWithInfo = function () {
        this.max_names = this.data.readUInt16(0)
        this.pattern_length = this.data.readUInt16(2)
        this.pattern = this.data.toString('ascii', 4, 4 + this.pattern_length)
      }
    
      Request.CreatePixmap = function () {
        this.pid = this.data.readUInt32(0)
        this.drawable = this.data.readUInt32(4)
        this.depth = this.data_byte
        this.width = this.data.readUInt16(8)
        this.height = this.data.readUInt16(10);
      }
    
      Request.FreePixmap = function () {
        this.pid = this.data.readUInt32(0);
      }
    
      Request.CreateGC = function () {
        this.cid = this.data.readUInt32(0)
        this.drawable = this.data.readUInt32(4)
        this.fields = new GCVField(
            this.data.readUInt32(8)
          , this.data.slice(12)
        );
      }
    
      Request.ChangeGC = function () {
        this.gc = this.data.readUInt32(0)
        this.fields = new GCVField(
            this.data.readUInt32(4)
          , this.data.slice(8)
        );
      }
    
      Request.CopyGC = function () {
        this.src_gc = this.data.readUInt32(0)
        this.dst_gc = this.data.readUInt32(4)
        this.fields = getGCVFieldNames(this.data.readUInt32(8));
      }
    
      Request.ClearArea = function () {
        this.window = this.data.readUInt32(0)
        this.exposures = this.data_byte
        this.x = this.data.readUInt16(4)
        this.y = this.data.readUInt16(6)
        this.w = this.data.readUInt16(8)
        this.h = this.data.readUInt16(10)
      }
    
      Request.CopyArea = function () {
        this.src    = this.data.readUInt32( 0)
        this.dst    = this.data.readUInt32( 4)
        this.gc     = this.data.readUInt32( 8)
        this.src_x  = this.data.readInt16 (12)
        this.src_y  = this.data.readInt16 (14)
        this.dst_x  = this.data.readInt16 (16)
        this.dst_y  = this.data.readInt16 (18)
        this.width  = this.data.readUInt16(20)
        this.height = this.data.readUInt16(22)
      }
    
      Request.FreeGC = function () {
        this.gc = this.data.readUInt32(0)
      }
    
      Request.PolyLine = function () {
        this.drawable = this.data.readUInt32(0)
        this.coordinate_mode = this.data_byte
        this.gc = this.data.readUInt32(4)
        this.count = this.length_quad - 3;
        this.lines = [];
        var prev = [0, 0]
          , pair = []
          , curr = null;
        for (var i = 8; i < (this.count + 2) * 4; i += 4) {
          curr = [
              this.data.readInt16(i)
            , this.data.readInt16(i + 2)
          ];
          if (this.coord_mode)
            prev = [ (curr[0] += prev[0]), (curr[1] += prev[1]) ];
          pair.push(curr);
          if (pair.length === 2)
            this.lines.push(pair.splice(0));
        }
      }
    
      Request.PolySegment = function () {
        this.drawable = this.data.readUInt32(0)
        this.gc = this.data.readUInt32(4)
        this.count = (this.length_quad - 3) / 2;
        this.lines = [];
        for (var i = 8; i < ((this.count + 1) * 8); i += 8) {
          this.lines.push([
              [ this.data.readInt16(i), this.data.readInt16(i + 2) ]
            , [this.data.readUInt16(i + 4), this.data.readUInt16(i + 6) ]
          ]);
        }
      }
    
      Request.PolyRectangle = function () {
        this.drawable = this.data.readUInt32(0)
        this.gc = this.data.readUInt32(4)
        this.count = (this.length_quad - 3) / 2;
        this.rectangles = [];
        // x, y, width, height
        for (var i = 8; i < ((this.count + 1) * 8); i += 8) {
          this.rectangles.push([
              this.data.readInt16(i)
            , this.data.readInt16(i + 2)
            , this.data.readUInt16(i + 4)
            , this.data.readUInt16(i + 6)
          ]);
        }
      }
    
      Request.FillPoly = function () {
        this.drawable = this.data.readUInt32(0)
        this.gc = this.data.readUInt32(4)
        this.shape = this.data.readUInt8(8)
        this.coordinate_mode = this.data.readUInt8(9)
        this.count = (this.length_quad - 4) * 4
        this.coordinates = [];
        // Unused 2
        // 12
        if (this.coordinate_mode != 0)
          throw new Error('Previous coordinate mode not implemented');
        for (var i = 12; i < this.count + 12; i += 4)
          this.coordinates.push([this.data.readUInt16(i), this.data.readUInt16(i + 2)]);
      }
    
      Request.PolyFillRectangle = function () {
        Request.PolyRectangle.apply(this);
      }
    
      Request.PolyFillArc = function () {
        this.drawable = this.data.readUInt32(0)
        this.gc = this.data.readUInt32(4)
        this.count = (this.length_quad - 3) / 3
        this.end = (this.count * 12) + 8;
        this.arcs = [];
        for (var i = 8; i < this.end; i += 12) {
          var x = this.data.readInt16 (i)
            , y = this.data.readInt16 (i + 2)
            , w = this.data.readUInt16(i + 4)
            , h = this.data.readUInt16(i + 6)
            , aspect = w / h
            , s = (this.data.readInt16 (i + 8) / 64) + 90 // Arc starts at 3 o'clock and each degree is expressed as 64
            , sr = (s * Math.PI) / 180
            , e = (this.data.readInt16 (i + 10) / 64) + s // This is the arc extent, not finishing point
            , er = (e * Math.PI) / 180;
          
          this.arcs.push({
              x: x
            , y: y
            , w: w
            , h: h
            , aspect: aspect
            , s: s
            , sr: sr
            , e: e
            , er: er
          });
        }
      }
    
      var _image_formats = ['Bitmap', 'XYPixmap', 'ZPixmap'];
      Request.PutImage = function () {
        this.format = _image_formats[this.data_byte]
        this.drawable = this.data.readUInt32(0)
        this.context = this.data.readUInt32(4)
        this.width = this.data.readUInt16(8)
        this.height = this.data.readUInt16(10)
        this.x = this.data.readInt16(12)
        this.y = this.data.readInt16(14)
        this.pad = this.data.readUInt8(16)
        this.depth = this.data.readUInt8(17)
        this.image = this.data.slice(20);
      }
    
      Request.GetImage = function () {
        this.format = _image_formats[this.data_byte]
        this.drawable = this.data.readUInt32(0)
        this.x = this.data.readInt16(4)
        this.y = this.data.readInt16(6)
        this.w = this.data.readUInt16(8)
        this.h = this.data.readUInt16(10)
        this.plane_mask = this.data.readUInt32(12)
      }
    
      Request.PolyText8 = function () {
        this.drawable = this.data.readUInt32(0)
        this.gc = this.data.readUInt32(4)
        this.count = (this.length_quad / 4) - 1
        this.x = this.data.readInt16(8)
        this.y = this.data.readInt16(10)// - gc.font.font.getChar(-1).ascent
        this.textitems = []
        var req_offset = 12;
        for (var i = 0; i < this.count; i ++) {
          var len = this.data.readUInt8(req_offset);
          if (len === 0)
            break;
          if (len === 255)
            throw new Error('Type 255');
          else {
            var textitem = {
                delta : this.data.readInt8(req_offset + 1)
              , start : req_offset + 2
              , end : req_offset + 2 + len
            };
            textitem.str = x_types.String.encodeString(this.data.toString('ascii', textitem.start, textitem.end));
            this.textitems.push(textitem);
            req_offset = textitem.end + ((textitem.end % 4) ? (4 - (textitem.end % 4)) : 0);
            if (req_offset + 4 >= this.data.length)
              break;
          }
        }
      }
    
      Request.PolyText16 = function () {
        this.drawable = this.data.readUInt32(0)
        this.gc = this.data.readUInt32(4)
        this.count = (this.length_quad - 1) / 4
        this.x = this.data.readInt16(8)
        this.y = this.data.readInt16(10)// - gc.font.font.getChar(-1).ascent
        this.textitems = []
        var req_offset = 12;
        for (var i = 0; i < this.count; i ++) {
          var len = this.data.readUInt8(req_offset);
          if (len === 0)
            break;
          if (len === 255)
            throw new Error('Type 255');
          else {
            var textitem = {
                delta : this.data.readInt8(req_offset + 1)
              , start : req_offset + 2
              , end : req_offset + 2 + (len * 2)
            }
            textitem.str = x_types.String.encodeString(this.data.toString('2charb', textitem.start, textitem.end))
            req_offset = textitem.end + ((textitem.end % 4) ? (4 - (textitem.end % 4)) : 0);
            this.textitems.push(textitem);
            if (req_offset + 4 >= this.data.length)
              break;
          }
        }
      }
    
      Request.AllocColor = function () {
        this.cmap = this.data.readUInt32(0)
        this.r = this.data.readUInt16(4) >> 8
        this.g = this.data.readUInt16(6) >> 8
        this.b = this.data.readUInt16(8) >> 8
      }

      Request.AllocColor.Rep = function (rep) {
        this.constructor.super_.apply(this, arguments);
        this.data.writeUInt16(rep.r, 0);
        this.data.writeUInt16(rep.g, 2);
        this.data.writeUInt16(rep.b, 4);
        this.data.writeUInt32(rep.id, 8);
      }
    
      Request.QueryColors = function () {
        this.count = this.length_quad - 2
        this.colormap_length = this.count * 4
        this.colormap = this.data.readUInt32(0)
      }
    
    
      Request.LookupColor = function () {
        this.cmap = this.data.readUInt32(0)
        this.name_length = this.data.readUInt16(4)
        this.name = this.data.toString('ascii', 8, this.name_length + 8)
      }
    
      Request.CreateGlyphCursor = function () {
        this.cursor_id = this.data.readUInt32(0)
        this.source_font = this.data.readUInt32(4)
        this.mask_font = this.data.readUInt32(8)
        this.source_char = this.data.readUInt16(12)
        this.mask_char = this.data.readUInt16(14)
        this.fore_r = this.data.readUInt16(16)
        this.fore_g = this.data.readUInt16(18)
        this.fore_b = this.data.readUInt16(20)
        this.back_r = this.data.readUInt16(22)
        this.back_g = this.data.readUInt16(24)
        this.back_b = this.data.readUInt16(26)
      }
    
      Request.QueryBestSize = function () {
        this._class = this.data_byte
        this.drawable = this.data.readUInt32(0)
        this.width = this.data.readUInt16(4)
        this.height = this.data.readUInt16(6);
      }
    
      Request.QueryExtension = function () {
      }
    
      Request.ListExtensions = function () {
      }
    
      Request.GetKeyboardMapping = function () {
        this.first = this.data.readUInt8(0)
        this.count = this.data.readUInt8(1)
      }
    
      Request.Bell = function () {
        this.percent = this.data_byte;
      }

      Request.SetAccessControl = function () {
        this.mode = this.data_byte;
      }
    
      var _closedown_mode = ['destroy', 'permanent', 'temporary'];
      Request.SetCloseDownMode = function () {
        this.closedown = _closedown_mode[this.data_byte];
      }
      
      Request.KillClient = function () {
        this.rid = this.data.readUInt32(0)
      }
    
      Request.GetModifierMapping = function () {
      }
    
      Request.NoOperation = function () {
      }
    
      Object.keys(Request).forEach(function (name) {
        if (Request[name].constructor === Function) {
          var Req = Request[name]
            , Rep = Req.Rep;
          util.inherits(Req, Request);
          Req.opcode = Request.opcodes_name[name];
          if (Rep && Rep.constructor === Function) {
            Rep.Req = Request;
            util.inherits(Rep, Reply);
          }
        }
      })
      return module.exports;
    }
);
