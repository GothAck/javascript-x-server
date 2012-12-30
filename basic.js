var net = require('net')
  , x_types = require('./x_types');

net.createServer(function (socket) {
  new XServerClient(socket);
}).listen(6041);

var windows = {
    0x00000026: new x_types.Window(0x00000026)
}

var atoms = [];

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
  console.log('DATA');
  data.endian = this.endian;
  switch (this.state) {
    case 0:
      return this.setup(data);
    case 1:
      var req = { length: 0 }
      while (data.length > req.length) {
        var req = new x_types.Request(data);
        console.log('NEW REQ', req.opcode);
        var func = this[XServerClient.opcodes[req.opcode]];
        func && func.call(this, req);
        if (data.length > req.length) {
          data = data.slice(req.length);
          data.endian = this.endian;
        }
      }
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
  console.log(this.auth_name, this.auth_data);

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
    16: 'InternAtom'
  , 20: 'GetProperty'
  , 55: 'CreateGC'
  , 98: 'QueryExtension'
}

XServerClient.prototype.InternAtom = function (req) {
  var only_if_exists = req.data_byte
    , length = req.data.readUInt16(0)
    , name = req.data.toString('ascii', 2, 2 + length)
    , index = atoms.indexOf(name) + 1;
  if ((!index) && ! only_if_exists)
    index = atoms.push(name);
  var res = new x_types.Reply(req)
  res.data.writeUInt32(index, 0);
  var _res = new Buffer(res.length);
  _res.endian = this.endian;
  res.writeBuffer(_res, 0);
  this.socket.write(_res);
}

XServerClient.prototype.GetProperty = function (req) {
  console.log('GP');
  console.log(req);
  var window = req.data.readUInt32(0)
    , property = req.data.readUInt32(4)
    , type = req.data.readUInt32(8)
    , long_off = req.data.readUInt32(12)
    , long_len = req.data.readUInt32(16);
  var res = new x_types.Reply(req)
    , _res = new Buffer(res.length);
  _res.endian = this.endian;
  res.writeBuffer(_res, 0);
  this.socket.write(_res);
}

XServerClient.prototype.CreateGC = function (req) {
  console.log('CGC');
  console.log(req);
}

XServerClient.prototype.QueryExtension = function (req) {
  console.log('QE');
  var res = new x_types.Reply(req);
  res.data.writeUInt8(0, 0);
  res.data.writeUInt8(req.opcode, 1);
  res.data.writeUInt8(0, 2);
  res.data.writeUInt8(0, 3);
  var _res = new Buffer(res.length);
  _res.endian = this.endian;
  res.writeBuffer(_res, 0);
  this.socket.write(_res);
}

function stringPad (string) {
  return string.length + (4 - ((string.length % 4) || 4));
}
