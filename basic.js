var net = require('net')
  , repl = require('repl').start({ useGlobal: true })
  , Canvas = require('canvas')
  , x_types = require('./x_types');

var clients = [];

net.createServer(function (socket) {
  var sc;
  clients.push(sc = new XServerClient(socket));
  socket.on('end', function () {
    console.log('end');
    delete clients[clients.indexOf(sc)];
  });
}).listen(6041);

var appjs = require('appjs')
  , win = appjs.createWindow({
        width: 400
      , height: 400
      , alpha: false
    });
appjs.router.get('/', function (req, res, next) {
  res.send('<html><body></body></html>');
});
win.on('create', function () {
  win.frame.show().center();
});
win.on('close', function () {
  process.exit(0);
});

repl.context.win = win;

var windows = {
    0x00000026: new x_types.Window(
        0x00000026
      , 0x18 // depth 24
      , 0x0 // parent 0
      , 0, 0
      , 400, 400
      , 0, 0, 0, 0, 0
    )
}

var atoms = [];

repl.context.clients = clients;
repl.context.windows = windows;
//FIXME: Atoms not stored correctly
repl.context.atoms = atoms;

function XServerClient (socket) {
  this.socket = socket;
  this.state = 0;
  this.endian = null;
  this.release = 11300000;
  this.resource_id_mask = 0x001fffff;
  this.resource_id_base = 0x00200000;
  this.vendor = 'JavaScript X';
  this.motion_buffer_size = 0xff;
  this.maximum_request_length = 0xffff;
  this.sequence = 1;
  this.formats = [
      new x_types.Format(0x01, 0x01, 0x20)
    , new x_types.Format(0x04, 0x08, 0x20)
    , new x_types.Format(0x08, 0x08, 0x20)
    , new x_types.Format(0x0f, 0x10, 0x20)
    , new x_types.Format(0x10, 0x10, 0x20)
    , new x_types.Format(0x18, 0x20, 0x20)
    , new x_types.Format(0x20, 0x20, 0x20)
  ];
  this.resources = windows;
  this.screens = [
      new x_types.Screen(
          0x00000026 // root
        , 0x00000022 // def colormap
        , 0x00ffffff // white
        , 0x00000000 // black
        , 0x00000000 // current input masks
        , 400 // width px
        , 400 // height px
        , 400 // width mm
        , 400 // height mm
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
  socket.on('data', this.processData.bind(this));
}

XServerClient.prototype.processData = function (data) {
  data.endian = this.endian;
  switch (this.state) {
    case 0:
      return this.setup(data);
    case 1:
      var req = { length: 0 }
        , res = new Buffer(data.length * 1000)
        , offset = 0;
      res.endian = this.endian;
      res.fill(0);
      while (data.length > 0) {
        var req = new x_types.Request(data, this.sequence ++);
        console.log('NEW REQ', req.opcode);
        var func = this[XServerClient.opcodes[req.opcode]];
        offset = (func && func.call(this, req, res, offset)) || offset;
        if (data.length > 0) {
          data = data.slice(req.length);
          data.endian = this.endian;
        }
      }
      if (offset)
        this.socket.write(res.slice(0, offset));
  }
}

XServerClient.prototype.setup = function (data) {
  data.endian = this.endian = data[0] !== 'B' ? 'LE' : 'BE';
  this.protocol_major = data.readUInt16(2);
  this.protocol_minor = data.readUInt16(4);

  this.auth_name = data.toString(
      'ascii'
    , 12
    , 12 + data.readUInt16(6)
  );

  this.auth_data = data.toString(
      'ascii'
    , 12 + data.readUInt16(6) + 2
    , 12 + data.readUInt16(6) + 2 + data.readUInt16(8)
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
  res.fill(0);
  res.writeUInt8(1, 0);
  res.writeUInt16(this.protocol_major, 2);
  res.writeUInt16(this.protocol_minor, 4);
  res.writeUInt16((32 + (this.formats.byteLength()) + stringPad(this.vendor) + this.screens.byteLength()) / 4, 6);
  res.writeUInt32(this.release, 8);
  res.writeUInt32(this.resource_id_base, 12);
  res.writeUInt32(this.resource_id_mask, 16);
  res.writeUInt32(this.motion_buffer_size, 20);
  res.writeUInt16(this.vendor.length, 24);
  res.writeUInt16(this.maximum_request_length, 26);
  res.writeUInt8(this.screens.length, 28); // Number screens
  res.writeUInt8(this.formats.length, 29); // Number formats
  res.writeUInt8(0, 30); // image lsb first
  res.writeUInt8(0, 31); // pixmap lsb first
  res.writeUInt8(32, 32); // pixmap scanline unit
  res.writeUInt8(32, 33); // pixmap scanline pad
  res.writeUInt8(8, 34); // min keycode
  res.writeUInt8(255, 35); // max keycode
  // 4 unused
  res.write(this.vendor, 40, this.vendor.length, 'ascii');
  var base = 40 + stringPad(this.vendor);
  base = this.formats.writeBuffer(res, base);
  base = this.screens.writeBuffer(res, base);
  var _res = new Buffer(base);
  _res.fill(0);
  res.copy(_res, 0, 0, base);
  this.socket.write(_res);
  console.log('Finished setup');
  this.state = 1;
}

XServerClient.opcodes = {
    1: 'CreateWindow'
  , 16: 'InternAtom'
  , 18: 'ChangeProperty'
  , 20: 'GetProperty'
  , 43: 'GetInputFocus'
  , 53: 'CreatePixmap'
  , 54: 'FreePixmap'
  , 55: 'CreateGC'
  , 72: 'PutImage'
  , 98: 'QueryExtension'
}



XServerClient.prototype.CreateWindow = function (req, res, offset) {
  var depth = req.data_byte
    , id = req.data.readUInt32(0)
    , parent = req.data.readUInt32(4)
    , x = req.data.readUInt16(8)
    , y = req.data.readUInt16(10)
    , width = req.data.readUInt16(12)
    , height = req.data.readUInt16(14)
    , border_width = req.data.readUInt16(16)
    , _class = req.data.readUInt16(18)
    , visual = req.data.readUInt32(20)
    , vmask = req.data.readUInt32(24)
    , vdata = req.data.slice(28);
  vdata.endian = this.endian;
  this.resources[id] = new x_types.Window(id, depth, parent, x, y, width, height, border_width, _class, visual, vmask, vdata);
  console.log('CreateWindow', id);
  return offset;
}

XServerClient.prototype.InternAtom = function (req, res, offset) {
  var only_if_exists = req.data_byte
    , length = req.data.readUInt16(0)
    , name = req.data.toString('ascii', 2, 2 + length)
    , index = atoms.indexOf(name) + 1;
  if ((!index) && ! only_if_exists)
    index = atoms.push(name);
  var _res = new x_types.Reply(req)
  _res.data.writeUInt32(index, 0);
  console.log('InternAtom')
  return _res.writeBuffer(res, offset)
}

XServerClient.prototype.ChangeProperty = function (req, res, offset) {
  var mode = req.data_byte
    , window = this.resources[req.data.readUInt32(0)]
    , property = req.data.readUInt32(4)
    , type = req.data.readUInt32(8)
    , format = req.data.readUInt8(12)
    , length = req.data.readUInt32(16) * (format === 8 ? 1 : (format === 16 ? 2 : (format === 32) ? 4 : 0))
    , data = req.data.slice(20, length + 20);
  data.endian = this.endian;

  window.changeProperty(property, format, data, mode);

  console.log('ChangeProperty', window.id, property, format, data, mode);
  return offset;
}


XServerClient.prototype.GetProperty = function (req, res, offset) {
  var window = req.data.readUInt32(0)
    , property = req.data.readUInt32(4)
    , type = req.data.readUInt32(8)
    , long_off = req.data.readUInt32(12)
    , long_len = req.data.readUInt32(16);
  console.log('Get Property', window, property);
  var _res = new x_types.Reply(req)
  return _res.writeBuffer(res, offset);
}

XServerClient.prototype.GetInputFocus = function (req, res, offset) {
  // TODO: STUB Returning one value, check functionality and FIXME
  console.log('GetInputFocus');
  var _res = new x_types.Reply(req);
  _res.data_byte = 1;
  _res.data.writeUInt32(1, 0);
  return _res.writeBuffer(res, offset);
}

XServerClient.prototype.CreatePixmap = function (req, res, offset) {
  var depth = req.data_byte
    , pid = req.data.readUInt32(0)
    , drawable = req.data.readUInt32(4)
    , width = req.data.readUInt16(8)
    , height = req.data.readUInt16(10);
  if (this.resources[pid])
    console.log('TODO: Throw error?');
  if (!(drawable = this.resources[drawable]))
    console.log('TODO: Throw error! (No drawable)');
  console.log('CreatePixmap', pid);
  console.log(drawable.depth, depth);
  if (drawable.depth !== depth && depth !== 1) {
    var _res = new x_types.Error(req, 4, depth);
    console.log('Depth Error');
    return _res.writeBuffer(res, offset);
  }

  this.resources[pid] = new x_types.Pixmap(pid, depth, drawable, width, height);
  console.log(pid in this.resources, pid in windows);
  return offset;
}

XServerClient.prototype.FreePixmap = function (req, res, offset) {
  var pid = req.data.readUInt32(0);
  console.log('FreePixmap', pid);
  if (! (this.resources[pid] instanceof x_types.Pixmap)) {
    var _res = new x_types.Error(req, 2, pid);
    console.log('Error');
    return _res.writeBuffer(res, offset);
  }
  delete this.resources[pid];
  return offset;
}

XServerClient.prototype.CreateGC = function (req, res, offset) {
  var cid = req.data.readUInt32(0)
    , drawable = req.data.readUInt32(4)
    , vmask = req.data.readUInt32(8)
    , vdata = req.data.slice(12);
  vdata.endian = this.endian;
  if (this.resources[cid])
    console.log('TODO: Throw error?');
  if (! this.resources[drawable])
    console.log('TODO: Throw error?', cid, drawable);
  console.log('CreateGC', cid, drawable);
  this.resources[cid] = new x_types.GraphicsContext(cid, this.resources[drawable], vmask, vdata);
  return offset;
}

XServerClient.prototype.PutImage = function (req, res, offset) {
  var type = req.data_byte
    , drawable = this.resources[req.data.readUInt32(0)]
    , context = this.resources[req.data.readUInt32(4)]
    , width = req.data.readUInt16(8)
    , height = req.data.readUInt16(10)
    , x = req.data.readUInt16(12)
    , y = req.data.readUInt16(14)
    , pad = req.data.readUInt8(16)
    , depth = req.data.readUInt8(17)
    , data = req.data.slice(20);
  data.endian = this.endian;
  context.putImage(data, width, height, x, y);
  console.log('PutImage', req.data.readUInt32(0), req.data.readUInt32(4));
  return offset;
}

XServerClient.prototype.QueryExtension = function (req, res, offset) {
  console.log('QueryExtension');
  var _res = new x_types.Reply(req);
  _res.data.writeUInt8(0, 0);
  _res.data.writeUInt8(req.opcode, 1);
  _res.data.writeUInt8(0, 2);
  _res.data.writeUInt8(0, 3);
  console.log('QueryExtension');
  return _res.writeBuffer(res, offset);
}

function stringPad (string) {
  return string.length + (4 - ((string.length % 4) || 4));
}
