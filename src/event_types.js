import * as EndianBuffer from 'endianbuffer';

export var prototypes = [];

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
  export class XEvent {
    constructor(window_client_req, data) {
      if (this.constructor === XEvent) {
        throw new Error('Cannot instantiate an Event object directly, use subprototypes');
      }
      var owner_obj = window_client_req.owner || window_client_req;
      this.sequence = (owner_obj.sequence_sent || owner_obj.sequence || 0) & 0xffff;
      if (window_client_req.owner)
        this.window = window_client_req;
      Object.keys(data).forEach(function (key) {
        this[key] = data[key];
      }, this);
      this.data = new EndianBuffer(28);
      this.data.endian = owner_obj.endian;
      this.endian = owner_obj.endian;
      // this.length = 32;
    }
    writeBuffer(buffer, offset) {
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
    toBuffer() {
      var buffer = new EndianBuffer(this.length);
      buffer.endian = this.endian;
      this.writeBuffer(buffer, 0);
      return buffer;
    }
    testReady() {
      return true;
    }
    get length() {
      return this.data.length + 4;
    }
    get type() {
      return this.constructor.name;
    }
    get code() {
      var opcode = event_opcodes.indexOf(this.constructor.name);
      if (~ opcode)
        return opcode + 2;
      throw new Error('This event object has an invalid "name"!');
    }
    set code(code) {
      if (typeof code === 'number')
        code = event_opcodes[code - 2];
      if (!code)
        throw new Error('Invalid opcode number');
      if (this.constructor.name !== code) {
        Object.defineProperty(this, 'constructor', {
            value: exports.map[code]
          , enumerable: false
        });
        this.__proto__ = exports.map[code].prototype;
      }
    }
  }
  prototypes.push(XEvent);

  /*
   * Event Prototypes
   */

  // Expose
  export class Expose extends XEvent {
    constructor(child_window, data) {
      super(child_window, data);
      this.child_window = child_window;
      ['x', 'y', 'width', 'height'].forEach(function (key) {
        if (typeof this[key] === 'undefined')
          this[key] = child_window[key];
      }, this);
      this.x = 0;
      this.y = 0;
    }
    writeData(buffer, offset) {
      this.data.writeUInt32(this.window.id, 0);
      this.data.writeUInt16(this.x, 4);
      this.data.writeUInt16(this.y, 6);
      this.data.writeUInt16(this.child_window.width, 8);
      this.data.writeUInt16(this.child_window.height, 10);
      this.data.writeUInt16(this.count, 12);
    }
    get dom_events() { return ['Exposure']; }
  }
  prototypes.push(Expose);

  //NoExposure
  export class NoExposure extends XEvent {
    constructor(window, data) {
      super(window, data);
    }
    writeData(buffer, offset) {
      this.data.writeUInt32(this.window.id, 0);
      this.data.writeUInt16(this.minor, 4);
      this.data.writeUInt8(this.major, 6);
    }
  }
  prototypes.push(NoExposure);

  // DestroyNotify
  export class DestroyNotify extends XEvent {
    constructor(window, data) { // event, window, data
      super(window, data)
      this.window = window;
    }
    dom_events = ['StructureNotify', 'SubstructureNotify'];
    writeData(buffer, offset) {
      this.data.writeUInt32((this.event_window || this.window).id, 0);
      this.data.writeUInt32(this.window.id, 4);
    }
    testReady() {
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
  }
  prototypes.push(DestroyNotify);

  // MapNotify
  export class MapNotify extends XEvent {
    constructor(window, data) { // event, window, data
      super(window, data);
      this.window = window;
    }
    dom_events = ['StructureNotify', 'SubstructureNotify'];
    writeData(buffer, offset) {
      this.data.writeUInt32((this.event_window || this.window).id, 0);
      this.data.writeUInt32(this.window.id, 4);
      this.data.writeUInt8(this.window.override_redirect ? 1 : 0, 8);
    }
    testReady() {
      switch (this.event_type) {
        case 'StructureNotify':
          return this.event_window === this.window;
        case 'SubstructureNotify':
          return this.window.isChildOf(this.event_window);
      }
      return false;
    }
  }
  prototypes.push(MapNotify);

  // MapRequest
  export class MapRequest extends XEvent {
    constructor(window, data) {
      super(window, data);
      this.window = window;
    }
    dom_events = ['SubstructureRedirect'];
    writeData(buffer, offset) {
      this.data.writeUInt32(this.window.parent.id, 0);
      this.data.writeUInt32(this.window.id, 4);
    }
  }
  prototypes.push(MapRequest);

  // UnmapNotify
  export class UnmapNotify extends XEvent {
    constructor(window, data) {
      super(window, data);
      this.window = window;
    }
    dom_events = ['StructureNotify'];
    writeData(buffer, offset) {
      this.data.writeUInt32((this.event_window || this.window).id, 0);
      this.data.writeUInt32(this.window.id, 4);
      this.data.writeUInt8(this.from_configure, 8)
    }
  }
  prototypes.push(UnmapNotify);

  export class ReparentNotify extends XEvent {
    constructor(window, data) {
      super(window, data);
    }
    dom_events = ['StructureNotify'];
    writeData(buffer, offset) {
      this.data.writeUInt32(this.event_window.id, 0);
      this.data.writeUInt32(this.window.id, 4);
      this.data.writeUInt32(this.new_parent.id, 8);
      this.data.writeInt16(this.window.x, 12);
      this.data.writeInt16(this.window.y, 14);
      this.data.writeUInt8(this.window.override_redirect, 16);
    }
    testReady() {
      switch (this.event_type) {
        case 'StructureNotify':
          return this.event_window === this.window;
        case 'SubstructureNotify':
          return this.window.isChildOf(this.event_window);
      }
      return false;
    }
  }
  prototypes.push(ReparentNotify);

  // PropertyNotify
  export class PropertyNotify extends XEvent {
    constructor(window, data) {
      super(window, data);
      this.window = window;
    }
    dom_events = ['PropertyNotify'];
    writeData(buffer, offset) {
      this.data.writeUInt32(this.window.id, 0);
      this.data.writeUInt32(this.atom, 4);
      this.data.writeUInt32(this.timestamp, 8);
      this.data.writeUInt8(~~this.deleted, 12);
    }
  }
  prototypes.push(PropertyNotify);

  export class Event_WindowInputDevicePointer extends XEvent {
    constructor(window, data) {
      super(window, data);
      this.same_screen = true;
      this.btn_state = window.owner.server.btn_state = data.btn_state
    }
    writeData(buffer, offset) {
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
  }

  export class KeyPress extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
      this.detail = data.keycode;
    }
    static dom_events = ['keydown'];
    static grab = 'keyboard';
  }
  prototypes.push(KeyPress);

  export class KeyRelease extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
      this.detail = data.keycode;
    }
    static dom_events = ['keyup'];
    static grab = 'keyboard';
  }
  prototypes.push(KeyRelease);

  export class ButtonPress extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
      this.detail = data.button;
    }
    dom_events = ['ButtonPress'];
    static dom_events = ['mousedown'];
    static grab = 'pointer';
  }
  prototypes.push(ButtonPress);

  export class ButtonRelease extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
      this.detail = data.button;
    }
    dom_events = ['ButtonRelease'];
    static dom_events = ['mouseup'];
    static grab = 'pointer';
  }
  prototypes.push(ButtonRelease);

  export class MotionNotify extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
      this.detail = 0; // TODO: Add PointerMotionHint
    }
    dom_events = ['MotionNotify', 'ButtonMotion'];
    static dom_events = ['mousemove'];
    static grab = 'pointer';
    testReady() {
      switch (this.event_type) {
        case 'MotionNotify':
          return true;
        case 'ButtonMotion':
          return !!this.window.owner.server.buttons;
      }
      return false;
    }
  }
  prototypes.push(MotionNotify);

  export class EnterNotify extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
    }
    static dom_events = ['mouseover'];
  }
  prototypes.push(EnterNotify);

  export class LeaveNotify extends Event_WindowInputDevicePointer {
    constructor(window, data) {
      super(window, data);
    }
    static dom_events = ['mouseout'];
  }
  prototypes.push(LeaveNotify);

  export class ConfigureNotify extends XEvent {
    constructor(window, data) {
      super(window, data);
      this.event_window = window;
      this.window = data && (data.child || window);
    }
    writeData(buffer, offset) {
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
    static fromBuffer(child, code, detail, buffer, offset) {
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
  }
  prototypes.push(ConfigureNotify);

  export class ClientMessage extends XEvent {
    constructor(window, data) {
      super(window, data);
    }
    writeData(buffer, offset) {
      console.log(this.window, this.window.id, this.window.id.toString(16));
      this.data.writeUInt32(this.window.id, 0);
      this.data.writeUInt32(this.data_type, 4);
      this.message.copy(this.data, 8);
    }
    static fromBuffer(child, code, detail, buffer, offset) { 
      return new this(
          child.server.resources[buffer.readUInt32(offset)]
        , {
              detail: detail
            , data_type: buffer.readUInt32(offset + 4)
            , message: buffer.slice(offset + 8, offset + 24)
          }
      );
    }
  }
  prototypes.push(ClientMessage);


  exports.map = prototypes
    .reduce(
        function (o, proto) {
          if (~event_opcodes.indexOf(proto.name))
            o[proto.name] = proto;
          return o;
        }
      , {}
    );

  export function fromBuffer(server, buffer, offset) {
    var code    = buffer.readUInt8(offset)
      , name    = event_opcodes[code - 2]
      , detail  = buffer.readUInt8(offset + 1)
      , req     = { sequence: buffer.readUInt16(offset + 2) }
      , data    = buffer.slice(offset + 4, offset + 32);
    data.endian = buffer.endian;
    var event_type = exports.map[name];
    var ret = event_type && event_type.fromBuffer && event_type.fromBuffer(
      server, code, detail, buffer, offset + 4
    );
    console.log(ret);
    return ret;
  }

  var implemented = Object.keys(exports.map);
  console.log(
      'Missing these event objects:'
    , event_opcodes.filter(function (name, index) {
        return name && !(~implemented.indexOf(name));
      })
  );
