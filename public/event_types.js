define('event_types', ['util', 'endianbuffer'], function (util, EndianBuffer) {
  var module = { exports: {} }

  module.exports.prototypes = [];

  var event_opcodes = [
    // Events start at opcode 2
      'KeyPress'
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

  /*
   * Base Event Prototype
   */
  function Event (window_client_req, data) {
    if ((!(this instanceof Event)) || this.constructor === Event)
      throw new Error('Cannot instantiate an Event object directly, use subprototypes');
    var owner_obj = window_client_req.owner || window_client_req;
    this.sequence = (owner_obj.sequence_sent || owner_obj.sequence || 0) & 0xffff;
    if (window_client_req.owner)
      this.window = window_client_req;
    var self = this;
    Object.keys(data).forEach(function (key) {
      self[key] = data[key];
    });
    this.data = new EndianBuffer(28);
    this.data.endian = owner_obj.endian;
    this.endian = owner_obj.endian;
    this.length = 32;
  }

  module.exports.prototypes.push(Event);

  module.exports.Event = Event;

  Event.prototype.writeBuffer = function (buffer, offset) {
    this.data.endian = buffer.endian;
    this.writeData();
    var code = this.code;
    if (this.send_event)
      code ^= 128; // Flip msb if this is an event sent from another client (SendEvent)
    buffer.writeUInt8(code, offset);
    buffer.writeUInt8(this.detail, offset + 1);
    buffer.writeUInt16(this.sequence, offset + 2);
    this.data.copy(buffer, offset + 4);
    return offset + this.length;
  }

  Event.prototype.toBuffer = function () {
    var buffer = new EndianBuffer(this.length);
    buffer.endian = this.endian;
    this.writeBuffer(buffer, 0);
    return buffer;
  }

  Event.prototype.testReady = function () {
    return true;
  }

  Event.prototype.__defineGetter__('length', function () {
    return this.data.length + 4;
  });

  Event.prototype.__defineGetter__('type', function () {
    return this.constructor.name;
  });

  Event.prototype.__defineGetter__('code', function () {
    var opcode = event_opcodes.indexOf(this.constructor.name);
    if (~ opcode)
      return opcode + 2;
    throw new Error('This event object has an invalid "name"!');
  });

  Event.prototype.__defineSetter__('code', function (code) {
    if (typeof code === 'number')
      code = event_opcodes[code - 2];
    if (!code)
      throw new Error('Invalid opcode number');
    if (this.constructor.name !== code) {
      Object.defineProperty(this, 'constructor', {
          value: module.exports.map[code]
        , enumerable: false
      });
      this.__proto__ = module.exports.map[code].prototype;
    }
  });

  /*
   * Event Prototypes
   */

  // Expose
  var _Expose_inherits = ['x', 'y', 'width', 'height'];
  function Expose (child_window, data) {
    this.constructor.super_.call(this, child_window, data);
    this.child_window = child_window;
    var self = this;
    _Expose_inherits.forEach(function (key) {
      if (typeof self[key] === 'undefined')
        self[key] = child_window[key];
    });
    this.x = 0;
    this.y = 0;
  }
  util.inherits(Expose, Event);
  Expose.prototype.dom_events = ['Exposure'];
  module.exports.prototypes.push(Expose);
  Expose.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt16(this.x, 4);
    this.data.writeUInt16(this.y, 6);
    this.data.writeUInt16(this.child_window.width, 8);
    this.data.writeUInt16(this.child_window.height, 10);
    this.data.writeUInt16(this.count, 12);
  }

  //NoExposure
  
  function NoExposure (window, data) {
    this.constructor.super_.call(this, window, data);
  }
  util.inherits(NoExposure, Event);
  module.exports.prototypes.push(NoExposure);
  NoExposure.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt16(this.minor, 4);
    this.data.writeUInt8(this.major, 6);
  }

  // DestroyNotify
  function DestroyNotify (window, data) { // event, window, data
    this.constructor.super_.call(this, window, data);
    this.window = window;
  }
  util.inherits(DestroyNotify, Event);
  DestroyNotify.prototype.dom_events = ['StructureNotify', 'SubstructureNotify'];
  module.exports.prototypes.push(DestroyNotify);
  DestroyNotify.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32((this.event_window || this.window).id, 0);
    this.data.writeUInt32(this.window.id, 4);
  }
  DestroyNotify.prototype.testReady = function () {
    switch (this.event_type) {
      case 'StructureNotify':
        if (this.event_window === this.window) {
          delete this.window.owner.server.resources[this.window.id];
          return true;
        }
        return false;
      case 'SubstructureNotify':
        return this.window.isChildOf(this.event_window);
    }
    return false;
  }

  // MapNotify
  function MapNotify (window, data) { // event, window, data
    this.constructor.super_.call(this, window, data);
    this.window = window;
  }
  util.inherits(MapNotify, Event);
  MapNotify.prototype.dom_events = ['StructureNotify', 'SubstructureNotify'];
  module.exports.prototypes.push(MapNotify);
  MapNotify.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32((this.event_window || this.window).id, 0);
    this.data.writeUInt32(this.window.id, 4);
    this.data.writeUInt8(this.window.override_redirect ? 1 : 0, 8);
  }
  MapNotify.prototype.testReady = function () {
    switch (this.event_type) {
      case 'StructureNotify':
        return this.event_window === this.window;
      case 'SubstructureNotify':
        return this.window.isChildOf(this.event_window);
    }
    return false;
  }

  // MapRequest
  function MapRequest (window, data) {
    this.constructor.super_.call(this, window, data);
    this.window = window;
  }
  util.inherits(MapRequest, Event);
  MapRequest.prototype.dom_events = ['SubstructureRedirect'];
  module.exports.prototypes.push(MapRequest);
  MapRequest.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(this.window.parent.id, 0);
    this.data.writeUInt32(this.window.id, 4);
  }

  // UnmapNotify
  function UnmapNotify (window, data) {
    this.constructor.super_.call(this, window, data);
    this.window = window;
  }
  util.inherits(UnmapNotify, Event);
  UnmapNotify.prototype.dom_events = ['StructureNotify'];
  module.exports.prototypes.push(UnmapNotify);
  UnmapNotify.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32((this.event_window || this.window).id, 0);
    this.data.writeUInt32(this.window.id, 4);
    this.data.writeUInt8(this.from_configure, 8)
  }

  function ReparentNotify (window, data) {
    this.constructor.super_.call(this, window, data);
  }
  util.inherits(ReparentNotify, Event);
  ReparentNotify.prototype.dom_events = ['StructureNotify'];
  module.exports.prototypes.push(ReparentNotify);
  ReparentNotify.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(this.event_window.id, 0);
    this.data.writeUInt32(this.window.id, 4);
    this.data.writeUInt32(this.new_parent.id, 8);
    this.data.writeInt16(this.window.x, 12);
    this.data.writeInt16(this.window.y, 14);
    this.data.writeUInt8(this.window.override_redirect, 16);
  }
  ReparentNotify.prototype.testReady = function () {
    switch (this.event_type) {
      case 'StructureNotify':
        return this.event_window === this.window;
      case 'SubstructureNotify':
        return this.window.isChildOf(this.event_window);
    }
    return false;
  }

  // PropertyNotify
  function PropertyNotify (window, data) {
    this.constructor.super_.call(this, window, data);
    this.window = window;
  }
  util.inherits(PropertyNotify, Event);
  PropertyNotify.prototype.dom_events = ['PropertyNotify'];
  module.exports.prototypes.push(PropertyNotify);
  PropertyNotify.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt32(this.atom, 4);
    this.data.writeUInt32(this.timestamp, 8);
    this.data.writeUInt8(~~this.deleted, 12);
  }

  function Event_WindowInputDevicePointer (window, data) {
    Event.call(this, window, data);
    this.same_screen = true;
    this.btn_state = window.owner.server.btn_state = data.btn_state
  }
  util.inherits(Event_WindowInputDevicePointer, Event);
  Event_WindowInputDevicePointer.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(0, 0); //Time
    this.data.writeUInt32(this.window.getRoot().id, 4); // Root id
    this.data.writeUInt32((this.event_window || this.window).id, 8); // Parent / event win id
    this.data.writeUInt32((this.window.id !== this.event_window.id && this.window.id) || 0, 12); // Child id (0 if same as parent)
    var this_offset = this.window.element.offset()
      , root_offset = this.event_window.getRoot().element.offset();

    this.data.writeInt16(this_offset.left - root_offset.left + this.x, 16); // Root x
    this.data.writeInt16(this_offset.top  - root_offset.top  + this.y , 18); // Root y
    this.data.writeInt16(this.x, 20); // x
    this.data.writeInt16(this.y, 22); // y
    this.data.writeUInt16(this.keybutmask, 24);
    this.data.writeUInt8(this.same_screen, 26);
  }

  function KeyPress (window, data) {
    this.constructor.super_.call(this, window, data);
    this.detail = data.keycode;
  }
  util.inherits(KeyPress, Event_WindowInputDevicePointer);
  KeyPress.dom_events = ['keydown'];
  KeyPress.grab = 'keyboard';
  module.exports.prototypes.push(KeyPress);

  function KeyRelease (window, data) {
    this.constructor.super_.call(this, window, data);
    this.detail = data.keycode;
  }
  util.inherits(KeyRelease, Event_WindowInputDevicePointer);
  KeyRelease.dom_events = ['keyup'];
  KeyRelease.grab = 'keyboard';
  module.exports.prototypes.push(KeyRelease);

  function ButtonPress (window, data) {
    this.constructor.super_.call(this, window, data);
    this.detail = data.button;
  }
  util.inherits(ButtonPress, Event_WindowInputDevicePointer);
  ButtonPress.prototype.dom_events = ['ButtonPress'];
  ButtonPress.dom_events = ['mousedown'];
  ButtonPress.grab = 'pointer';
  module.exports.prototypes.push(ButtonPress);

  function ButtonRelease (window, data) {
    this.constructor.super_.call(this, window, data);
    this.detail = data.button;
  }
  util.inherits(ButtonRelease, Event_WindowInputDevicePointer);
  ButtonRelease.prototype.dom_events = ['ButtonRelease'];
  ButtonRelease.dom_events = ['mouseup'];
  ButtonRelease.grab = 'pointer';
  module.exports.prototypes.push(ButtonRelease);

  function MotionNotify (window, data) {
    this.constructor.super_.call(this, window, data);
    this.detail = 0; // TODO: Add PointerMotionHint
  }
  util.inherits(MotionNotify, Event_WindowInputDevicePointer);
  MotionNotify.prototype.dom_events = ['MotionNotify', 'ButtonMotion'];
  MotionNotify.dom_events = ['mousemove'];
  MotionNotify.grab = 'pointer';
  module.exports.prototypes.push(MotionNotify);
  MotionNotify.prototype.testReady = function () {
    switch (this.event_type) {
      case 'MotionNotify':
        return true;
      case 'ButtonMotion':
        return !!this.window.owner.server.buttons;
    }
    return false;
  }

  function EnterNotify (window, data) {
    this.constructor.super_.call(this, window, data);
  }
  util.inherits(EnterNotify, Event_WindowInputDevicePointer);
  EnterNotify.dom_events = ['mouseover'];
  module.exports.prototypes.push(EnterNotify);

  function LeaveNotify (window, data) {
    this.constructor.super_.call(this, window, data);
  }
  util.inherits(LeaveNotify, Event_WindowInputDevicePointer);
  LeaveNotify.dom_events = ['mouseout'];
  module.exports.prototypes.push(LeaveNotify);

  function ConfigureNotify (window, data) {
    this.constructor.super_.call(this, window, data);
    this.event_window = window;
    this.window = data && (data.child || window);
  }
  util.inherits(ConfigureNotify, Event);
  module.exports.prototypes.push(ConfigureNotify);
  ConfigureNotify.prototype.writeData = function (buffer, offset) {
    this.data.writeUInt32(this.event_window.id, 0);
    this.data.writeUInt32(this.window.id, 4);
    this.data.writeUInt32((this.above_sibling && this.above_sibling.id) || 0, 8);
    this.data.writeInt16 (this.x, 12);
    this.data.writeInt16 (this.y, 14);
    this.data.writeUInt16(this.width, 16);
    this.data.writeUInt16(this.height, 18);
    this.data.writeUInt16(this.border_width, 20);
    this.data.writeUInt8 (this.override_redirect, 22);
  }
  ConfigureNotify.fromBuffer = function (child, code, detail, buffer, offset) {
    var event_window = child.server.resources[buffer.readUInt32(offset)]
      , e = new this(
               child.server.resources[buffer.readUInt32(offset + 4)] // Window
            , {
                  event_window: event_window
                , above_sibling: child.server.resources[buffer.readUInt32(offset + 8)]
                , x: buffer.readInt16(offset + 12)
                , y: buffer.readInt16(offset + 14)
                , width: buffer.readUInt16(offset + 16)
                , height: buffer.readUInt16(offset + 18)
                , border_width: buffer.readUInt16(offset + 20)
                , override_redirect: buffer.readUInt8(offset + 22)
              }
          );
    return e;
  }

  function ClientMessage (window, data) {
    this.constructor.super_.call(this, window, data);
  }
  util.inherits(ClientMessage, Event);
  module.exports.prototypes.push(ClientMessage);
  ClientMessage.prototype.writeData = function (buffer, offset) {
    console.log(this.window, this.window.id, this.window.id.toString(16));
    this.data.writeUInt32(this.window.id, 0);
    this.data.writeUInt32(this.data_type, 4);
    this.message.copy(this.data, 8);
  }
  ClientMessage.fromBuffer = function (child, code, detail, buffer, offset) { 
    return new this(
        child.server.resources[buffer.readUInt32(offset)]
      , {
            detail: detail
          , data_type: buffer.readUInt32(offset + 4)
          , message: buffer.slice(offset + 8, offset + 24)
        }
    );
  }

  module.exports.map = module.exports.prototypes
    .reduce(
        function (o, proto) {
          if (~event_opcodes.indexOf(proto.name))
            o[proto.name] = proto;
          return o;
        }
      , {}
    );

  module.exports.fromBuffer = function (server, buffer, offset) {
    var code    = buffer.readUInt8(offset)
      , name    = event_opcodes[code - 2]
      , detail  = buffer.readUInt8(offset + 1)
      , req     = { sequence: buffer.readUInt16(offset + 2) }
      , data    = buffer.slice(offset + 4, offset + 32);
    data.endian = buffer.endian;
    var event_type = module.exports.map[name];
    var ret = event_type && event_type.fromBuffer && event_type.fromBuffer(
      server, code, detail, buffer, offset + 4
    );
    console.log(ret);
    return ret;
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
