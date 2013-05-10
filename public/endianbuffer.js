define('endianbuffer', function () {
  function EndianBuffer (buf) {
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

  EndianBuffer.prototype.__defineGetter__('length', function () {
    return this.buffer.byteLength;
  });

  EndianBuffer.prototype.copy = function (buffer, t_start, s_start, s_end) {
    t_start = t_start || 0;
    s_start = s_start || 0;
    s_end = s_end || Math.min(this.length, buffer.length);
    var length = s_end - s_start
      , src_arr = new Uint8Array(this.buffer, s_start, length)
      , dst_arr = new Uint8Array(buffer.buffer, t_start, length)
    dst_arr.set(src_arr);
    return length;
  }

  EndianBuffer.prototype.slice = function (start, end) {
    start = start || 0;
    end = end || this.length;
    var newb = new EndianBuffer(this.buffer.slice(start, end));
    newb.endian = this.endian;
    return newb;
  }

  EndianBuffer.prototype.toString = function (type, from, to) {
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
  };

  (function (EndianBuffer) {
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

  EndianBuffer.prototype.write = function (string, offset, length, encoding) {
    offset = offset || 0;
    length = Math.min(string.length, (this.buffer.byteLength - offset), length);
    encoding = encoding || 'ascii';
    if (encoding !== 'ascii')
      throw new Error('Only ascii implemented');
    var arr = new Uint8Array(this.buffer, offset, length);
    for (var i = 0; i < length; i ++)
      arr[i] = string.charCodeAt(i);
    return length;
  }

  EndianBuffer.prototype.fill = function (value, start, end) {
    value = value || 0;
    start = start || 0;
    end = end || 0;
    var arr = new Uint8Array(this.buffer, start, end - start);
    for (var i = 0; i < arr.length; i++)
      arr[i] = value;
  }
  return EndianBuffer;
});
