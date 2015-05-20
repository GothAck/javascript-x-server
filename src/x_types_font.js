import * as fs from './fs';
import EndianBuffer from './endianbuffer';
import loadCSSFont from './loadcssfont';
import { MustImplementError } from './common';

export class CharInfo {
  constructor(char) {
    this.char = char;
  }
  length = 12;
  writeBuffer(buffer, offset) {
    buffer.writeInt16(this.char.left,            offset      );
    buffer.writeInt16(this.char.right,           offset  +  2);
    buffer.writeInt16(this.char.width,           offset  +  4);
    buffer.writeInt16(this.char.ascent,          offset  +  6);
    buffer.writeInt16(this.char.descent,         offset  +  8);
    buffer.writeUInt16(this.char.attribues || 0, offset  + 10);
    return offset + this.length;
  }
}

export class FontInfo {
  constructor(font) {
    this.font = font;
  }
  length = 16;
  writeBuffer(buffer, offset) {
    buffer.writeUInt16(this.font.min_char_or_byte2   , offset     );
    buffer.writeUInt16(this.font.max_char_or_byte2   , offset + 2 );
    buffer.writeUInt16(this.font.default_char        , offset + 4 );
    var props = Object.keys(this.font.properties);
    buffer.writeUInt16(props.length                  , offset + 6 );
    buffer.writeUInt8 (this.font.draw_direction      , offset + 8 );
    buffer.writeUInt8 (this.font.min_byte1           , offset + 9 );
    buffer.writeUInt8 (this.font.max_byte1           , offset + 10 );
    buffer.writeUInt8 (true                          , offset + 11 );
    var accelerators = this.font.bdf_accelerators || this.font.accelerators;
    buffer.writeInt16 (accelerators.fontAscent       , offset + 12 );
    buffer.writeInt16 (accelerators.fontDecent      , offset + 14 );
    return offset + this.length;
  }
}

export class FontProp {
  constructor(atom, data) {
    this.atom = atom;
    this.data = data;
  }
  length = 8;
  writeBuffer(buffer, offset) {
    buffer.writeUInt32(this.atom, offset    );
    buffer.writeInt32 (this.data, offset + 4);
    return offset + this.length;
  }
}

export class Font {
  static factory(meta: mixed, file_name: string, name: string): Font {
    switch (meta.type) {
      case 'ttf':
      case 'woff':
        return new VectorFont(meta, file_name, name);
      case 'pcf':
        return new PCFFont(meta, file_name, name);
      default:
        throw new Error(`Invalid font type ${meta.type}`);
    }
  }
  constructor(meta, file_name, name) {
    this.meta = meta;
    this.type = meta.type;
    this.file_name = file_name;
    this.css_name = file_name.replace(/\./g, '_');
    this.name = name;
    this.original_type = file_name.match(/\.([^.]+)$/)[1];
  }
  static error_code = 7;

  loadData(callback) {
    throw new MustImplementError('Font', 'loadData');
  }

  loadDataAsync() {
    console.warn('TODO: migrate all to Font.loadDataAsync');
    return new Promise((res, rej) => {
      this.loadData((err) => {
        if (err) {
          return rej(err);
        }
        res();
      });
    });
  }

  close() {}

  destroy() {}
}

export class PCFCharacter {
  constructor(left, right, width, ascent, descent, attrs) {
    this.left       = left;
    this.right      = right;
    this.width      = width;
    this.ascent     = ascent;
    this.descent    = descent;
    this.attributes = attrs;
  }

  get height() {
    // height = bytes.length / ((width_bits + remainder_of padding_in_bits) / 8);
    return this.data.length / ((this.width + ((((this.pad * 2) || 1) * 8) % this.width)) / 8);
  }

  toCharInfo() {
    return new CharInfo(this);
  }

  toPixels() {
    var row_pad_byte    = (this.pad  * 2) || 1
      , row_data_byte   = (this.bits * 2) || 1
      , row_data_func   = 'readUInt' + (row_data_byte * 8)
      , row_byte_length = (this.width + ((row_pad_byte * 8) % this.width)) / 8
      , pixels          = [];
    row_byte_length += (row_byte_length % row_pad_byte) ? row_pad_byte - (row_byte_length % row_pad_byte) : 0;
    console.log(row_pad_byte, row_data_byte, row_byte_length);
    row: for (var row_offset = 0; row_offset < this.data.length; row_offset += row_byte_length) {
      byte: for (var byte_offset = 0; byte_offset < row_byte_length; byte_offset += row_data_byte) {
        var _byte_offset = this.lsbyte ? byte_offset : row_byte_length - 1 - byte_offset;
        var data = this.data[row_data_func](row_offset + _byte_offset);
        bit: for (var bit_offset = 0; bit_offset < (row_data_byte * 8); bit_offset ++) {
          var _bit_offset = this.lsbit ? (row_data_byte * 8) - 1 - bit_offset : bit_offset;
          if ((byte_offset * 8) + bit_offset >= this.width) {
            console.log('rar');
            break byte;
          }
          pixels.push((Math.pow(2, _bit_offset) & data) && 1);
        }
      }
    }
    return pixels;
  }

  drawTo(context, x, y, red, green, blue) {
    var image = context.getImageData(x + this.left, y - this.ascent, this.width, this.height)
      , pixels = this.toPixels();
    pixels.forEach(function (value, i) {
      i = i * 4;
      if (value) {
        image.data[i    ] = red;
        image.data[i + 1] = green;
        image.data[i + 2] = blue;
      }
      image.data[i + 3] = 0xff;
    });
    context.putImageData(image, x + this.left, y - this.ascent);
  }
}

export class PCFTable {
  constructor(parent, type, format, data) {
    var self = this;
    this.parent = parent;
    this.type = type;
    this.format = format;
    this.data = data;
    switch (type) {
      case 'properties':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        this.count = this.data.readInt32(4);
        this.props = [];
        var offset = 8;
        for (var i = 0; i < this.count; i ++) {
          this.props.push([
              this.data.readInt32(offset + (i * 9)    )
            , !! this.data.readInt8 (offset + (i * 9) + 4)
            , this.data.readInt32(offset + (i * 9) + 5)
          ]);
        }
        offset += i * 9;
        offset = offset + ( (offset & 3) === 0 ? 0 : (4 - (offset & 3)) );
        var string_length = this.data.readInt32(offset);
        offset += 4;
        this.parent.properties = this.props.reverse().reduce(function (p, n) {
          var val = n[2];
          if (n[1]) {// String value
            val = self.data.toString('ascii', offset + n[2], offset + string_length - 1)
            string_length = n[2];
          }
          p[self.data.toString('ascii', offset + n[0], offset + string_length - 1)] = val;
          string_length = n[0];
          return p;
        }, {});
      break;
      case 'bdf_accelerators':
        var bdf = true;
      case 'accelerators':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        var accel = {}
        if (bdf)
          this.parent.bdf_accelerators = accel;
        else
          this.parent.accelerators = accel;
        accel.noOverlap = !! this.data.readUInt8(4);
        accel.constantMetrics = !! this.data.readUInt8(5);
        accel.terminalFont = !! this.data.readUInt8(6);
        accel.constantWidth = !! this.data.readUInt8(7);
        accel.inkInside = !! this.data.readUInt8(8);
        accel.inkMetrics = !! this.data.readUInt8(9);
        accel.drawDirection = !! this.data.readUInt8(10);
        accel.padding = this.data.readUInt8(11);
        accel.fontAscent = this.data.readUInt32(12);
        accel.fontDecent = this.data.readUInt32(16);
        accel.maxOverlap = this.data.readUInt32(20);
        var offset = 24;
        // Uncompressed Metrics
        accel.minbounds = new PCFCharacter(
            this.data.readInt16 (offset     ) // Left
          , this.data.readInt16 (offset +  2) // Right
          , this.data.readInt16 (offset +  4) // Width
          , this.data.readInt16 (offset +  6) // Ascent
          , this.data.readInt16 (offset +  8) // Descent
          , this.data.readUInt16(offset + 10) // Attributes
        );
        offset = 36;
        accel.maxbounds = new PCFCharacter(
            this.data.readInt16 (offset     ) // Left
          , this.data.readInt16 (offset +  2) // Right
          , this.data.readInt16 (offset +  4) // Width
          , this.data.readInt16 (offset +  6) // Ascent
          , this.data.readInt16 (offset +  8) // Descent
          , this.data.readUInt16(offset + 10) // Attributes
        )
        if (this.format & 0x100) {//Ink bounds
          var offset = 48;
          // Uncompressed Metrics
          accel.ink_minbounds = new PCFCharacter(
              this.data.readInt16 (offset     ) // Left
            , this.data.readInt16 (offset +  2) // Right
            , this.data.readInt16 (offset +  4) // Width
            , this.data.readInt16 (offset +  6) // Ascent
            , this.data.readInt16 (offset +  8) // Descent
            , this.data.readUInt16(offset + 10) // Attributes
          )
          offset = 60;
          accel.ink_maxbounds = new PCFCharacter(
              this.data.readInt16 (offset     ) // Left
            , this.data.readInt16 (offset +  2) // Right
            , this.data.readInt16 (offset +  4) // Width
            , this.data.readInt16 (offset +  6) // Ascent
            , this.data.readInt16 (offset +  8) // Descent
            , this.data.readUInt16(offset + 10) // Attributes
          )
        } else {
          accel.ink_minbounds = accel.minbounds;
          accel.ink_maxbounds = accel.maxbounds;
        }
      break;
      case 'ink_metrics':
        var ink = true;
      case 'metrics':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        if (this.format & 0x100) { // Compressed
          this.count = this.data.readUInt16(4);
          var offset = 6;
          for (var i = 0; i < this.count; i ++)
            ['left', 'right', 'width', 'ascent', 'descent'].forEach(function (name, index) {
              this[((ink && 'ink_') || '') + name] = self.data.readUInt8(offset) - 0x80;
              offset ++;
            }.bind(this.parent.getOrNewCharacter(i)));
        } else {
          this.count = this.data.readUInt32(4);
          var offset = 8;
          for (var i = 0; i < this.count; i ++) {
            var char = this.parent.getOrNewCharacter(i);
            ['left', 'right', 'width', 'ascent', 'descent'].forEach(function (name, index) {
              this[((ink && 'ink_') || '') + name] = self.data.readInt16(offset);
              offset += 2;
            }.bind(char));
            char.attributes = this.data.readUInt16(offset);
            offset += 2;
          }
        }
      break;
      case 'bitmaps':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        this.glyph_count = data.readUInt32(4);
        this.offsets = [];
        var offset = 4;
        for (var i = 0; i < this.glyph_count; i ++)
          this.offsets.push(this.data.readUInt32(offset += 4));
        this.bitmap_sizes = [];
        for (var i = 0; i < 4; i ++)
          this.bitmap_sizes.push(this.data.readUInt32(offset += 4));
        offset += 4;
        for (var i = 0; i < this.glyph_count; i ++) {
          this.parent.characters[i].data = this.data.slice(offset + this.offsets[i], offset + this.offsets[i + 1]);
          this.parent.characters[i].pad  = this.format & 3;
          this.parent.characters[i].bits = (this.format >> 4) & 3;
          this.parent.characters[i].lsbyte = !!(this.format & 4);
          this.parent.characters[i].lsbit = !!(this.format & 8);
        }
      break;
      case 'bdf_encodings':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        this.parent.min_char_or_byte2 = this.data.readUInt16(4);
        this.parent.max_char_or_byte2 = this.data.readUInt16(6);
        this.parent.min_byte1 = this.data.readUInt16(8);
        this.parent.max_byte1 = this.data.readUInt16(10);
        this.parent.default_char = this.data.readUInt16(12);
        this.parent.glyphindeces = [];
        var offset = 14
          , max = (this.parent.max_char_or_byte2 - this.parent.min_char_or_byte2 + 1)
            * (this.parent.max_byte1 - this.parent.min_byte1 + 1);
        for (var i = 0; i < max; i++)
          this.parent.glyphindeces.push(this.data.readUInt16(offset + (i * 2)));
      break;
      case 'swidths':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        this.parent.swidths = []
        var offset = 8
          , max = this.data.readUInt32(4);
        for (var i = 0; i < max; i ++)
          this.parent.swidths.push(this.data.readUInt32(offset + (i * 4)));
      break;
      case 'glyph_names':
        if (this.format !== data.readUInt32(0))
          throw new Error('Formats do not match', this.format, data.readUInt32(0));
        this.data.endian = !(this.format & (1 << 2) && this.format & (1 << 3));
        this.glyph_count = data.readUInt32(4);
        this.offsets = [];
        var offset = 4;
        for (var i = 0; i < this.glyph_count; i ++)
          this.offsets.push(this.data.readUInt32(offset += 4));
        this.string_size = this.data.readUInt32(offset += 4);
        offset += 4;
        var string = this.data.toString('ascii', offset, offset + this.string_size);
        this.strings = [];
        for (var i = 0; i < this.glyph_count; i ++)
          this.strings.push(string.slice(this.offsets[i], (this.offsets[i + 1] && (this.offsets[i + 1] - 1)) || this.string_size));
        this.parent.names = {};
        for (var i = 0; i < this.glyph_count; i ++)
          this.parent.names[this.strings[i]] = this.parent.characters[i];
      break;
      default:
        throw new Error('Invalid table type ' + this.type);
    }
    delete this.data;
  }
}

  var _pcf_tables = [
      'properties', 'accelerators', 'metrics'
    , 'bitmaps', 'ink_metrics', 'bdf_encodings'
    , 'swidths', 'glyph_names', 'bdf_accelerators'
  ];
export class PCFFont extends Font {
  loadData(callback) {
    var self = this
      , path = 'fonts/' + this.file_name;
    fs.readFile(path, (err, data) => {
      if (err)
        return callback(err);
      self.data = new EndianBuffer(data);
      this.data.endian = true; // Little endian
      if (! (this.data.readUInt8(0) === 1 && this.data.toString('ascii', 1, 4) === 'fcp'))
        throw new Error('Not pcf');
      var tables = this.data.readUInt32(4) * 16;
      this.tables = [];
      this.characters = [];
      for (var i = 0 + 8; i < tables + 8; i += 16) {
        var type_id = this.data.readUInt32(i)
          , type    = _pcf_tables.filter(function (type, index) { return type_id === 1 << index })[0]
          , format = this.data.readUInt32(i +  4)
          , size   = this.data.readUInt32(i +  8)
          , offset = this.data.readUInt32(i + 12)
          , end    = offset + size;
        console.log(type_id, type, size, offset, end, this.data.length);
        this.tables.push(new PCFTable(this, type, format, this.data.slice(offset, end)));
      }
      for (var i = 0; i < this.tables.length; i ++) {
        delete this.tables[i].parent;
        delete this.tables[i];
      }
      delete this.data;
      
      callback();
    });
  }

  getOrNewCharacter(index) {
    if (this.characters[index])
      return this.characters[index];
    return this.characters[index] = new PCFCharacter;
  }

  getChar(index) {
    // index == index || -1 for min -2 for max
    if (index === -1)
      return (this.bdf_accelerators || this.accelerators).maxbounds
    if (index === -2)
      return (this.bdf_accelerators || this.accelerators).minbounds
    return this.characters[index]
  }
  
  toFontInfo() {
    return new FontInfo(this);
  }

  drawTo(string, context, x, y, red, green, blue) {
    for (var i = 0; i < string.length; i ++) {
      var char = this.characters[string.charCodeAt(i)];
      if (char) {
        char.drawTo(context, x, y, red, green, blue);
        x += char.width;
      }
    }
    return x;
  }
}

export class VectorCharacter {
  constructor(data) {
    Object.keys(data).forEach(function (key) {
      this[key] = data[key];
    }, this);
  }

  toCharInfo() {
    return new CharInfo(this);
  }
}

export class VectorFont extends Font {
  constructor(meta, file_name, name) {
    super(meta, file_name, name);  
    Object.keys(meta).forEach(function (key) {
      this[key] = meta[key];
    }, this);
    this.characters = this.characters.map(function (data) {
      return new VectorCharacter(data);
    });
    ['bdf_accelerators', 'accelerators'].forEach(function (key_a) {
      var obj = this[key_a];
      if (obj)
        ['minbounds', 'maxbounds'].forEach(function (key) {
          obj[key] = new VectorCharacter(obj[key]);
        });
    }, this);
  }
  
  loadData(callback) {
    this.constructor.call(this);
    var height = this.getChar(-1);
    height = height.ascent + height.descent - 1;
    if (! $('style#' + this.css_name).length)
      loadCSSFont('fonts/' + this.file_name, this.type, height, 'font_' + this.name, this.css_name, callback);
  }

  close() {
    $('style#' + this.css_name).remove();
  }

  get height() {
    var _ = this.getChar(-2);
    return _.ascent + _.descent - 1;
  }

  get width() {
    var _ = this.getChar(-1);
    return _.width;
  }

  getChar(index) {
    var char;
    // index == index || -1 for min -2 for max
    if (index === -2)
      char = (this.bdf_accelerators || this.accelerators).maxbounds
    else if (index === -1)
      char = (this.bdf_accelerators || this.accelerators).minbounds
    else
      char = this.characters[index];
    return char;
  }

  toFontInfo() {
    return new FontInfo(this);
  }
}
