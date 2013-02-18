define(['util', 'endianbuffer'], function (util, EndianBuffer) {
  var module = { exports: {} }

  module.exports.prototypes = [];

  var event_opcodes = [
      null // Events start at opcode 2
    , 'KeyPress'
    , 'KeyRelease'
    , 'ButtonPress'
    , 'ButtonRelease'
    , 'MotionNotify'
    , 'EnterNotify'
    , 'LeaveNotify'
    , 'FocusIn'
    , 'FocusOut'
    , 'KeymapNotify'
    , 'Expose'
    , 'GraphicsExposure'
    , 'NoExposure'
    , 'VisibilityNotify'
    , 'CreateNotify'
    , 'DestroyNotify'
    , 'UnmapNotify'
    , 'MapNotify'
    , 'MapRequest'
    , 'ReparentNotify'
    , 'ConfigureNotify'
    , 'ConfigureRequest'
    , 'GravityNotify'
    , 'ResizeRequest'
    , 'CirculateNotify'
    , 'CirculateRequest'
    , 'PropertyNotify'
    , 'SelectionClear'
    , 'SelectionRequest'
    , 'SelectionNotify'
    , 'ColormapNotify'
    , 'ClientMessage'
    , 'MappingNotify'
  ];

  function Event (req, code, detail) {
    if (typeof code === 'string')
      this.code = event_opcodes.indexOf(code) + 1;
    else
      this.code = code || 1;
    this.detail = detail || 0;
    this.sequence = req.sequence;
    if (req instanceof (require('x_client')))
      this.sequence = req.sequence_sent;
    this.data = new EndianBuffer(28);
    this.data.endian = req.endian;
    this.length = 32;
  }
  module.exports.prototypes.push(Event);
  module.exports.Event = Event;
  Event.prototype.writeBuffer = function (buffer, offset) {
    buffer.writeUInt8(this.code, offset);
    buffer.writeUInt8(this.detail, offset + 1);
    buffer.writeUInt16(this.sequence, offset + 2);
    this.data.copy(buffer, offset + 4);
    return offset + 32;
  }

  function EventExpose (event, window, data) {
    Event.call(this, window.owner, event);
    this.window = data.child || window;
    this.x = typeof data.data.original.x === 'undefined' ? window.x : data.data.original.x;
    this.y = typeof data.data.original.y === 'undefined' ? window.y : data.data.original.y;
    this.width = typeof data.data.original.width === 'undefined' ? window.width : data.data.original.width;
    this.height = typeof data.data.original.height === 'undefined' ? window.height : data.data.original.height;
    this.count = data.data.original.count;
  }
  util.inherits(EventExpose, Event);
  EventExpose.events = ['Expose'];
  module.exports.prototypes.push(EventExpose);
  EventExpose.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt16(this.x, 4);
    this.data.writeUInt16(this.y, 6);
    this.data.writeUInt16(this.width, 8);
    this.data.writeUInt16(this.height, 10);
    this.data.writeUInt16(this.count, 12);
    return this.constructor.super_.prototype.writeBuffer.call(this, buffer, offset);
  }

  function EventMapNotify (event, window, data) { // event, window, data
    Event.call(this, window.owner, event);
    this.event_window = window;
    this.window = data.child || window;
  }
  util.inherits(EventMapNotify, Event);
  EventMapNotify.events = ['MapNotify'];
  module.exports.prototypes.push(EventMapNotify);
  EventMapNotify.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(this.event_window.id, 0);
    this.data.writeUInt32(this.window.id, 4);
    this.data.writeUInt8(this.window.override_redirect ? 1 : 0, 8);
    return this.constructor.super_.prototype.writeBuffer.call(this, buffer, offset);
  }

  function EventPropertyNotify (event, window, data) {
    Event.call(this, window.owner, event);
    this.window = window;
    this.atom = data.data.original.atom;
    this.timestamp = data.data.original.timestamp || 0; //~~(Date.now() / 1000);
    this.deleted = !! data.data.original.deleted;
  }
  util.inherits(EventPropertyNotify, Event);
  module.exports.prototypes.push(EventPropertyNotify);
  EventPropertyNotify.events = ['PropertyNotify'];
  EventPropertyNotify.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt32(this.atom, 4);
    this.data.writeUInt32(this.timestamp, 8);
    this.data.writeUInt8(~~this.deleted, 12);
    return this.constructor.super_.prototype.writeBuffer.call(this, buffer, offset);
  }

  function EventWindowInputDevicePointer (event, child, parent, detail, child_x, child_y, btn_state) {
    Event.call(this, child.owner, event);
    this.child = child;
    this.parent = parent || child;
    this.detail = detail;
    this.x = child_x;
    this.y = child_y;
    this.btn_state = btn_state;
    this.same_screen = true;
    this.btn_state = this.child.owner.server.btn_state = btn_state
  }
  util.inherits(EventWindowInputDevicePointer, Event);
  EventWindowInputDevicePointer.prototype.writeBuffer = function (buffer, offset) {
    this.data.writeUInt32(0, 0); //Time
    this.data.writeUInt32(this.parent.getRoot().id, 4); // Root id
    this.data.writeUInt32(this.parent.id, 8); // Parent / event win id
    this.data.writeUInt32((this.child.id !== this.parent.id && this.child.id) || 0, 12); // Child id (0 if same as parent)
    var this_offset = this.child.element.offset()
      , root_offset = this.parent.getRoot().element.offset();

    this.data.writeInt16(root_offset.left - this_offset.left, 16); // Root x
    this.data.writeInt16(root_offset.top  - this_offset.top , 18); // Root y
    this.data.writeInt16(this.x, 20); // x
    this.data.writeInt16(this.y, 22); // y
    this.data.writeUInt16(this.btn_state, 24);
    this.data.writeUInt8(this.same_screen, 26);
    return Event.prototype.writeBuffer.call(this, buffer, offset);
  }

  function EventWindowKeyPressRelease (event, window, data) {
    this.constructor.super_.call(
        this, event, window
      , data.child, data.keycode, data.x, data.y, data.keybutmask
    );
  }
  util.inherits(EventWindowKeyPressRelease, EventWindowInputDevicePointer);
  EventWindowKeyPressRelease.events = ['KeyPress', 'KeyRelease'];
  module.exports.prototypes.push(EventWindowKeyPressRelease);

  function EventWindowButtonPressRelease (event, window, data) {
    this.constructor.super_.call(
        this, event, window
      , data.child, data.button, data.x, data.y, data.keybutmask
    );
  }
  util.inherits(EventWindowButtonPressRelease, EventWindowInputDevicePointer);
  EventWindowButtonPressRelease.events = ['ButtonPress', 'ButtonRelease'];
  module.exports.prototypes.push(EventWindowButtonPressRelease);

  function EventWindowEnterLeave (event, window, data) {
    this.constructor.super_.call(
        this, event, window
      , data.child, 0, data.x, data.y, data.keybutmask
    );
  }
  util.inherits(EventWindowEnterLeave, EventWindowInputDevicePointer);
  EventWindowEnterLeave.events = ['EnterNotify', 'LeaveNotify'];
  module.exports.prototypes.push(EventWindowEnterLeave);

  function EventWindowFocus (code) {
    Event.call(this, window.owner, code);
  }

  util.inherits(EventWindowFocus, Event);

  EventWindowFocus.prototype.writeBuffer = function (buffer, offset) {
  }

  module.exports.map = module.exports.prototypes
    .reduce(
        function (o, proto) {
          if (proto.events)
            proto.events.forEach(function (name) {
              o[name] = proto;
            });
          return o;
        }
      , {}
    );

  module.exports.fromBuffer = function (server, buffer, offset) {
    var code    = buffer.readUInt8(offset)
      , name    = event_opcodes[code - 1]
      , detail  = buffer.readUInt8(offset + 1)
      , req     = { sequence: buffer.readUInt16(offset + 2) }
      , data    = buffer.slice(offset + 4, offset + 32);
    data.endian = buffer.endian;
    var event_type = module.exports.map[name];
    return event_type && event_type.fromBuffer && event_type.fromBuffer(
      server, code, buffer, offset + 4
    );
  }

  var implemented = Object.keys(module.exports.map);
  console.log(
      'Missing these event objects:'
    , event_opcodes.filter(function (name, index) {
        return name && !(~implemented.indexOf(name));
      })
  );

  return module.exports;
});
