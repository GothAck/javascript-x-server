import * as fs from './fs';
import EndianBuffer from './endianbuffer';
import * as x_types from './x_types';
import XServerClient from './x_client';
import * as keymap from './keymap';


var default_atoms = [
    'PRIMARY'
  , 'SECONDARY'
  , 'ARC'
  , 'ATOM'
  , 'BITMAP'
  , 'CARDINAL'
  , 'COLORMAP'
  , 'CURSOR'
  , 'CUT_BUFFER0'
  , 'CUT_BUFFER1'
  , 'CUT_BUFFER2'
  , 'CUT_BUFFER3'
  , 'CUT_BUFFER4'
  , 'CUT_BUFFER5'
  , 'CUT_BUFFER6'
  , 'CUT_BUFFER7'
  , 'DRAWABLE'
  , 'FONT'
  , 'INTEGER'
  , 'PIXMAP'
  , 'POINT'
  , 'RECTANGLE'
  , 'RESOURCE_MANAGER'
  , 'RGB_COLOR_MAP'
  , 'RGB_BEST_MAP'
  , 'RGB_BLUE_MAP'
  , 'RGB_DEFAULT_MAP'
  , 'RGB_GRAY_MAP'
  , 'RGB_GREEN_MAP'
  , 'RGB_RED_MAP'
  , 'STRING'
  , 'VISUALID'
  , 'WINDOW'
  , 'WM_COMMAND'
  , 'WM_HINTS'
  , 'WM_CLIENT_MACHINE'
  , 'WM_ICON_NAME'
  , 'WM_ICON_SIZE'
  , 'WM_NAME'
  , 'WM_NORMAL_HINTS'
  , 'WM_SIZE_HINTS'
  , 'WM_ZOOM_HINTS'
  , 'MIN_SPACE'
  , 'NORM_SPACE'
  , 'MAX_SPACE'
  , 'END_SPACE'
  , 'SUPERSCRIPT_X'
  , 'SUPERSCRIPT_Y'
  , 'SUBSCRIPT_X'
  , 'SUBSCRIPT_Y'
  , 'UNDERLINE_POSITION'
  , 'UNDERLINE_THICKNESS'
  , 'STRIKEOUT_ASCENT'
  , 'STRIKEOUT_DESCENT'
  , 'ITALIC_ANGLE'
  , 'X_HEIGHT'
  , 'QUAD_WIDTH'
  , 'WEIGHT'
  , 'POINT_SIZE'
  , 'RESOLUTION'
  , 'COPYRIGHT'
  , 'NOTICE'
  , 'FONT_NAME'
  , 'FAMILY_NAME'
  , 'FULL_NAME'
  , 'CAP_HEIGHT'
  , 'WM_CLASS'
  , 'WM_TRANSIENT_FOR'
];

export default class XServer {
  constructor(id, sendBuffer, screen_elem) {
    Object.defineProperty(this, 'server', {
        enumerable: false
      , value: this
    });
    this.id = id;
    this.access_control = true;
    this.allowed_hosts = [
        new x_types.InternetHost('127.0.0.1'),
        new x_types.InternetV6Host('::1'),
    ];
    this.updateAllowedHostsLookup();

    this.sendBuffer = sendBuffer;
    this.protocol_major = 11;
    this.protocol_minor = 0;
    this.release = 11300000;
    this.vendor = 'JavaScript X';
    this.maximum_request_length = 0xffff;
    this.event_cache = [];
    this.grab = null;
    this.grab_buffer = [];
    this.grab_pointer = null;
    this.grab_keyboard = null;
    this.motion_buffer = [];
    this.motion_buffer_size = 255;
    this.buttons = 0;
    this.input_focus = null;
    this.input_focus_revert = 0;
    this.keymap = keymap.maps.gb.clone();
    this.resource_id_mask = 0x001fffff;
    this.resource_id_bases = [];
    var res_base = this.resource_id_mask + 1;
    var res_id = 0;
    while (!(res_id & 0xE0000000)) {
      this.resource_id_bases.push(res_id += res_base);
    }
    
    this.formats = new x_types.ExtrasArray();
    this.formats.push(
        new x_types.Format(0x01, 0x01, 0x20)
      , new x_types.Format(0x04, 0x08, 0x20)
      , new x_types.Format(0x08, 0x08, 0x20)
      , new x_types.Format(0x0f, 0x10, 0x20)
      , new x_types.Format(0x10, 0x10, 0x20)
      , new x_types.Format(0x18, 0x20, 0x20)
      , new x_types.Format(0x20, 0x20, 0x20)
    );
    this.screens = new x_types.ExtrasArray();
    this.screens.push(
        this.screen = new x_types.Screen(
            this
          , 0x00000026 // root
          , 0x00000022 // def colormap
          , 0x00ffffff // white
          , 0x00000000 // black
          , 0x00000000 // current input masks
          , 800 // width px
          , 600 // height px
          , Math.round(800 / (96 / 25.4)) // width mm
          , Math.round(600 / (96 / 25.4)) // height mm
          , 0x0001 // min maps
          , 0x0001 // max maps
          , 0x20 // root visual
          , 2 // backing stores 0 Never, 1 WhenMapped, 2 Always
          , 1 // save unders
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
    );
    screen_elem.parentNode.replaceChild(
      this.screen.element, screen_elem)
    this.atoms = default_atoms.slice();
    this.atom_owners = [];
    this.resources = new Map();
    this.resources.set(0x00000022, new x_types.ColorMap(
        0x00000022
      , (rgb, type) => {
          rgb = [
              (rgb & 0x000000ff)
            , (rgb & 0x0000ff00) >> 8
            , (rgb & 0x00ff0000) >> 16
          ];
          switch (type) {
            case 'hex':
              return rgb.reduce(function (str, v) { v = v.toString(16); return str + (v.length < 2 ? '0' : '') + v }, '');
            default:
              return rgb;
          }
        }
    ));
    this.resources.set(0x00000026, this.root = new x_types.Window(
        this
      , 0x00000026
      , 0x18 // depth 24
      , 0, 0
      , this.screen.width_px, this.screen.height_px
      , 0, 1, 0
    ));
    this.root.parent = {
      element: this.screens.get(0).element,
      owner: this,
      children: [this.root]
    };
    this.font_path = 'fonts';
    this.fonts_dir = new Map();
    this.fonts_scale = new Map();
    this.fonts_cache = new Map();

    fs.readFile(this.font_path + '/fonts.dir', 'utf8', (err, file) => {
      if (err)
        throw new Error('No fonts.dir');
      file = file.split('\n');
      file.pop();
      var count = file.shift() ^ 0;
      if (count !== file.length)
        throw new Error('Invalid length of fonts.dir');
      file.forEach((line) => {
        var match = line.match(/^(".*"|[^ ]*) (.*)$/);
        this.fonts_dir.set(match[2], match[1]);
      });
    });

    this.clients = new Map();
    var c = this.resources.get(0x00000026).canvas.getContext('2d')
      , img = new Image;
    img.onload = () => {
      c.rect(0, 0, c.canvas.width, c.canvas.height);
      c.fillStyle = c.createPattern(img, 'repeat');
      c.fill();
    }
    img.src = "/check.png";

    this.resources.get(0x00000026).map();

    this.mouseX = this.mouseY = 0;
    var self = this;
  }

  get clients_array() {
    return Array.from(this.clients.values());
  }

  get resources_array() {
    return Array.from(this.resources.values());
  }

  getFormatByDepth(depth) {
    return this.formats.filter((format) => format.depth === depth).get(0);
  }

  newClient(id, host, port, host_type) {
    host = new x_types.Host(host, host_type);
    host.port = port;
    if (! (~ this.allowed_hosts.lookup.indexOf(host.toString())))
      throw new Error('FIXME: Host not allowed');
    var client = new XServerClient(this, id, this.resource_id_bases.shift(), this.resource_id_mask, host);
    this.clients.set(id, client);
    return client;
  }

  disconnect(id) {
    if (!id) {
      this.screen.off('');
      for (let client of this.clients.values()) {
        client.disconnect();
      }
    } // Disconnect whole server
    if (!this.clients.has(id)) {
      throw new Error('Invalid client! Disconnected?');
    }

    if (this.grab && this.grab.id !== id) {
      return this.grab_buffer.push([this, 'disconnect', id]);
    }
    var client = this.clients.get(id);
    this.resource_id_bases.push(client.resource_id_base);
    client.disconnect();
  }
  
  sendEvent() {}

  screenEvent(event, capture) {
    var x_event = event.detail;
    if (capture) {
      switch (x_event.constructor.grab) {
        case 'keyboard':
          if (this.grab_keyboard) {
            //TODO: owner_event
            x_event.event_window = event.target.xob;
            x_event.event_type = event.type;
            this.grab_keyboard.onEvent(x_event);
            event.stopPropagation();
          }
        case 'pointer':
          if (this.grab_pointer) {
            console.log('GrabPointer Event', x_event, event.target.xob.id, event);
            //TODO: owner_event
            x_event.event_window = event.target.xob;
            x_event.event_type = event.type;
            this.grab_pointer.onEvent(x_event);
            event.stopPropagation();
          }
      }
    } else {
      console.warn(x_event, x_event.stop_propagation);
    }
  }

  write(client, data) {
    if (! this.clients.has(client.id)) {
      throw new Error('Invalid client! Disconnected?');
    }
    if (! data) {
      return console.warn('Empty data');
    }
    if (data instanceof x_types.WorkReply) {
      return this.sendBuffer(data, client, true);
    }
    if (! (data instanceof EndianBuffer)) {
      throw new Error('Not a buffer! ' + data.constructor.name);
    }
    this.sendBuffer(data.buffer, client);
  }

  processRequest(message) {
    var client = this.clients.get(message.id);
    if (this.grab && this.grab !== client)
      return this.grab_buffer.push([this, 'processRequest', message]);
    client.processRequest(message).catch((e) => {
      console.error(e.stack);
    });
  }

  getResource(id, Type, allowed_values) {
    var resource = this.resources.get(id);
    allowed_values = Array.isArray(allowed_values) ? 
      allowed_values : Array.prototype.slice.call(arguments, 2);
    if (~ allowed_values.indexOf(id))
      return id;
    if (Type && !(resource instanceof Type))
      throw new x_types.Error({}, Type.error_code || 1, id);
    return resource;
  }
  
  putResource(resource) {
    var owner = resource.owner;
    console.warn('server.putResource', resource.id, resource);
    if (((~ owner.resource_id_mask) & owner.resource_id_base) !== owner.resource_id_base) {
      throw new x_types.Error({}, 14 /* IDChoise */, resource.id); 
    }
    if (this.resources.has(resource.id)) {
      throw new x_types.Error({}, 14 /* IDChoice */, resource.id);
    }
    this.resources.set(resource.id, resource);
    return resource;
  }
  
  freeResource(id, Type) {
    var resource = this.resources.get(id);
    console.warn('server.freeResource', id, resource);
    if (Type && !(resource instanceof Type))
      throw new x_types.Error(
          {},
          Type.error_code || 1,
          id,
          `Resource at ${id} (${resource}) is not an instance of ${Type.name}`);
    this.resources.delete(id);
  }
  
  resolveAtom(id) {
    switch (typeof id) {
      case 'number':
      break;
      case 'string':
      break;
      case 'object':
        if (id instanceof x_types.Atom)
          return this.atoms[x_types.atom.id]
        else 
      break;
      default:
        throw new Error('trying to resolve something that is not a number, string or Atom');
    }
  }
  
  getAtom(id, dont_throw) {
    if ('string' === typeof id) {
      if (~ this.atoms.indexOf(id))
        return this.atoms.indexOf(id) + 1;
      if (dont_throw)
        return 0;
      throw new x_types.Error({}, 5);
    } else {
      if ('string' === typeof this.atoms[id - 1])
        return this.atoms[id];
      if (dont_throw)
        return '';
      throw new x_types.Error({}, 5);
    }
  }

  putAtom(id, atom, only_if_exists) {
    if (this.atoms[id])
      throw new x_types.Error({}, 14 /* IDChoice */, atom.id);
    return this.atoms[atom.id] = atom;
  }
  
  freeAtom(id) {
    var atom = this.atoms[id];
    if (!(atom instanceof x_types.Atom))
      throw new x_types.Error({}, 14 /* IDChoice */);
    delete this.atoms[id];
  }

  flushGrabBuffer() {
    this.grab_buffer.splice(0)
      .forEach(function (item) {
        var self = item[0]
          , func = item[1]
          , args = item.slice(2);
        self[func].apply(self, args);
      });
  }

  listFonts(pattern) {
    var re = new RegExp('^' + pattern.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1").replace(/\\([*?])/g, '.$1') + '$', 'i');
    var fonts = [];
    for (let name of this.fonts_dir.keys()) {
      if (re.test(name)) {
        fonts.push(name);
      }
    }
    return fonts;
  }

  resolveFont(name) {
    var resolved_name;
    if (!this.fonts_dir.has(name)) {
      if (/[*?]/.test(name)) {
        var names = this.listFonts(name);
        if (names && names.length) {
          resolved_name = [names[0], this.fonts_dir.get(names[0])];
        }
      }
    }
    return resolved_name || [name, this.fonts_dir.get(name)];
  }

  async loadFontAsync(resolved_name, server_name) {
    if (this.fonts_cache.has(resolved_name)) {
      return this.fonts_cache.get(resolved_name);
    }
    this.grab = 'loadFont';
    var meta = await fs.readFileAsync('fonts/' + resolved_name + '.meta.json', 'utf8');
    var font = x_types.Font.factory(
      JSON.parse(meta),
      resolved_name,
      server_name
    );

    await font.loadDataAsync();

    this.fonts_cache.set(resolved_name, font);
    this.grab = null;

    return font;
  }

  loadFont(resolved_name, server_name, callback) {
    this.loadFontAsync(resolved_name, server_name).then(
      (font) => callback(null, font),
      (err) => callback(err));
  }

  openFont(client, fid, name) {
    var self = this
      , resolved_name = this.resolveFont(name);
    if (resolved_name[1]) {
      this.grab = 'openFont';
      this.loadFont(resolved_name[1], resolved_name[0], function (err, font) {
        if (err) {
          console.error(err);
        }
        font.id = fid;
        font.owner = client;
        if (err)
          font.error = err;
        else
          self.putResource(font);
        console.log('XServer.openFont callback', err, font);
        self.grab = false;
        self.flushGrabBuffer();
      });
      return;
    }
    console.log('Name not resolved', name);
    this.grab = false;
    this.flushGrabBuffer();

  }

  encodeString(str) {
    var out_str = '';
    if (typeof str !== 'string')
      return str;
    for (var i = 0; i < str.length; i ++) {
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

  updateAllowedHostsLookup() {
    this.allowed_hosts.lookup = this.allowed_hosts.map(function (host) {
      return host.toString();
    });
  }

  insertAllowedHost(host) {
    if (!(host instanceof x_types.Host))
      throw new Error('Requires x_types.Host subprototype')
    if (~ this.allowed_hosts.lookup.indexOf(host.toString()))
      return null;
    var index = this.allowed_hosts.push(host);
    this.updateAllowedHostsLookup();
    return index;
  }

  deleteAllowedHost(host) {
    if (!(host instanceof x_types.Host))
      throw new Error('Requires x_types.Host subprototype')
    var index = this.allowed_hosts.lookup.indexOf(host.toString());
    if (!~ index)
      return null;
    this.allowed_hosts.splice(index, 1);
    this.updateAllowedHostsLookup();
    return index;
  }
}
