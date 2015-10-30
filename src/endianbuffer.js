export default class EndianBuffer {
  constructor(buf) {
    this.endian = false;
    if (typeof buf === 'number') {
      this.buffer = new ArrayBuffer(buf);
    } else if (buf instanceof ArrayBuffer) {
      this.buffer = buf;
    } else if (buf instanceof EndianBuffer) {
      this.buffer = new ArrayBuffer(buf.length);
      buf.copy(this);
    } else if (typeof buf === 'string') {
      this.buffer = new ArrayBuffer(buf.length / 2);
    }
    this.dataview = new DataView(this.buffer, 0);
    if (typeof buf === 'string')
      for (var i = 0; i < buf.length; i += 2)
        this.writeUInt8(parseInt(buf.slice(i, i + 2), 16), i / 2);
  }

  get length() {
    return this.buffer.byteLength;
  }

  copy(buffer, t_start, s_start, s_end) {
    t_start = t_start || 0;
    s_start = s_start || 0;
    s_end = s_end || Math.min(this.length, buffer.length);
    var length = s_end - s_start
      , src_arr = new Uint8Array(this.buffer, s_start, length)
      , dst_arr = new Uint8Array(buffer.buffer, t_start, length)
    dst_arr.set(src_arr);
    return length;
  }

  slice(start, end) {
    start = start || 0;
    end = end || this.length;
    var newb = new (this.constructor)(this.buffer.slice(start, end));
    newb.endian = this.endian;
    return newb;
  }

  toString(type, from, to) {
    switch (type) {
      case 'ascii':
        if ((!from) || (!to) || (to - from > 2000))
          console.log('break');
        var arr = new Uint8Array(this.buffer.slice(from, to))
          , str = '';
        for (var i = 0; i < arr.length; i++)
          str += String.fromCharCode(arr[i]);
        return str;
      case '2charb':
        if (((to - from) ^ 2) !== 0)
          throw new Error('String length should be multiple of two!');
        var arr = new Uint8Array(this.buffer.slice(from, to))
          , str = '';
        for (var i = 0; i < arr.length; i += 2)
          str += String.fromCharCode( (arr[i * 2] << 8) + arr[(i * 2) + 1] );
        return str;
      case 'hex':
        var arr = new Uint8Array(this.buffer.slice(from, to))
          , str = '';
        for (var i = 0; i < arr.length; i++)
          str += (arr[i] < 16 ? '0' : '') + arr[i].toString(16);
        return str;
      default:
        return null;
    }
  }

  write(string, offset, length, encoding) {
    offset = offset || 0;
    if (length === null)
      length = Infinity;
    length = Math.min(string.length, (this.buffer.byteLength - offset), length);
    encoding = encoding || 'ascii';
    if (encoding !== 'ascii')
      throw new Error('Only ascii implemented');
    var arr = new Uint8Array(this.buffer, offset, length);
    for (var i = 0; i < length; i ++)
      arr[i] = string.charCodeAt(i);
    return length;
  }

  fill(value, start, end) {
    value = value || 0;
    start = start || 0;
    end = end || 0;
    var arr = new Uint8Array(this.buffer, start, end - start);
    for (var i = 0; i < arr.length; i++)
      arr[i] = value;
  }
  
  static ensure(obj_arr) {
    var Constructor = this;
    if (Array.isArray(obj_arr)) {
      obj_arr.forEach(function (v, i, a) {
        if (v instanceof ArrayBuffer)
          a[i] = new Constructor(v);
      });
    } else {
      var a = obj_arr;
      Object.keys(obj_arr).forEach(function (i) {
        var v = obj_arr[i];
        if (v instanceof ArrayBuffer)
          a[i] = new Constructor(v);
      });
    }
  }
}

;(function (EndianBuffer) {
  var keys = ['Int8', 'Uint8', 'Int16', 'Uint16', 'Int32', 'Uint32', 'Float32', 'Float64'];
  keys.forEach(function (key) {
    EndianBuffer.prototype['read' + key.replace('int', 'Int')] = function (offset) {
      return this.dataview['get' + key](offset, this.endian)
    }
    EndianBuffer.prototype['write' + key.replace('int', 'Int')] = function (value, offset) {
      return this.dataview['set' + key](offset, value, this.endian)
    }
  });
})(EndianBuffer);


export class CursorBuffer extends EndianBuffer {
  static lengths = new Map([
    ['Int8', 1], ['Uint8', 1],
    ['Int16', 2], ['Uint16', 2],
    ['Int32', 4], ['Uint32', 4],
    ['Float32', 4], ['Float64', 8],
  ]);

  constructor(buf) {
    super(buf);
    this.cursor = 0;
  }

  moveCursor(by) {
    this.cursor += by;
  }
}

;(function (CursorBuffer) {
  var keys = ['Int8', 'Uint8', 'Int16', 'Uint16', 'Int32', 'Uint32', 'Float32', 'Float64'];
  CursorBuffer.lengths.forEach(function (key_length, key) {
    CursorBuffer.prototype['read' + key.replace('int', 'Int')] = function (offset) {
      var val = this.dataview['get' + key](this.cursor, this.endian);
      this.moveCursor(key_length);
      return val;
    }
    CursorBuffer.prototype['write' + key.replace('int', 'Int')] = function (value, offset) {
      this.dataview['set' + key](this.cursor, value, this.endian);
      this.moveCursor(key_length);
    }
  });
})(CursorBuffer);

type EnumIterable = Array<number> | Set<number>;

class Enum extends Set {
  static _values: Map<number, string> = new Map();

  constructor(values?: ?EnumIterable) {
    super();
    if (values) {
      for (val of values) {
        this.add(val);
      }
    }
  }

  getFirst(): ?string {
    var out = null;
    for (let v of this) {
      out = v;
      break;
    }
    return out;
  }

  decode(value: number): boolean {
    if (this._values.has(value)) {
      this.add(this._values.get(value));
      return true;
    }
    return false;
  }

  encode(): ?number {
    // TODO: Performance, reverse the hash once?
    let out = null;
    if (this.size === 1 && this._values.size) {
      let first = this.getFirst();
      if (first === null) {
        for (let [value, name] of this._values) {
          if (name === first) {
            out = value;
            break;
          }
        }
      }
    }
    return out;
  }
}

export class ValueEnum extends Enum {}

export class BitEnum extends Enum {
  static _bits: Map<number, string> = new Map()

  decode(value: number): boolean {
    if (super.decode(value)) {
      return true;
    }
    for (let [bit, bit_value] of this._bits) {
      if (value & Math.pow(bit, 2)) {
        this.add(bit_value);
      }
    }
  }

  encode(): ?number {
    let out = super.encode();
    if (out !== null) {
      return out;
    }
    out = 0;
    for (let [bit, bit_value] of this._bits) {
      if (this.has(bit_value)) {
        out |= Math.pow(bit, 2);
      }
    }
  }
}
