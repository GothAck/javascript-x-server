import {ValueEnum, BitEnum, CursorBuffer} from "./endianbuffer";

export class XTypeBuffer extends CursorBuffer {
  readBOOL() {
    return this.readUInt8();
  }

  writeBOOL() {
    this.writeUInt8(...arguments);
  }

  readBYTE() {
    return this.readUInt8();
  }

  writeBYTE() {
    this.writeUInt8(...arguments);
  }

  readCARD8() {
    return this.readUInt8();
  }

  writeCARD8() {
    this.writeUInt8(...arguments);
  }

  readINT8() {
    return this.readInt8();
  }

  writeINT8() {
    this.writeInt8(...arguments);
  }

  readCARD16() {
    return this.readUInt16();
  }

  writeCARD16() {
    this.writeUInt16(...arguments);
  }

  readINT16() {
    return this.readInt16();
  }

  writeINT16() {
    this.writeInt16(...arguments);
  }

  readCARD32() {
    return this.readUInt32();
  }

  writeCARD32() {
    this.writeUInt32(...arguments);
  }

  readINT32() {
    return this.readInt32();
  }

  writeINT32() {
    this.writeInt32(...arguments);
  }

  readVISUALID() {
    return this.readCARD32();
  }

  writeVISUALID() {
    this.writeCARD32(...arguments);
  }

  readTIMESTAMP() {
    return this.readCARD32();
  }

  writeTIMESTAMP() {
    this.writeCARD32(...arguments);
  }

  readKEYSYM() {
    return this.readCARD32();
  }

  writeKEYSYM() {
    this.writeCARD32(...arguments);
  }

  readKEYCODE() {
    return this.readCARD8();
  }

  writeKEYCODE() {
    this.writeCARD8(...arguments);
  }

  readBUTTON() {
    return this.readCARD8();
  }

  writeBUTTON() {
    this.writeCARD8(...arguments);
  }

  readWINDOW() {
    return this.readCARD32();
  }

  writeWINDOW() {
    this.writeCARD32(...arguments);
  }

  readPIXMAP() {
    return this.readCARD32();
  }

  writePIXMAP() {
    this.writeCARD32(...arguments);
  }

  readCURSOR() {
    return this.readCARD32();
  }

  writeCURSOR() {
    this.writeCARD32(...arguments);
  }

  readFONT() {
    return this.readCARD32();
  }

  writeFONT() {
    this.writeCARD32(...arguments);
  }

  readGCONTEXT() {
    return this.readCARD32();
  }

  writeGCONTEXT() {
    this.writeCARD32(...arguments);
  }

  readCOLORMAP() {
    return this.readCARD32();
  }

  writeCOLORMAP() {
    this.writeCARD32(...arguments);
  }

  readATOM() {
    return this.readCARD32();
  }

  writeATOM() {
    this.writeCARD32(...arguments);
  }

  readDRAWABLE() {
    return this.readCARD32();
  }

  writeDRAWABLE() {
    this.writeCARD32(...arguments);
  }

  readFONTABLE() {
    return this.readCARD32();
  }

  writeFONTABLE() {
    this.writeCARD32(...arguments);
  }

  static xids = new Map([
    ["WINDOW", null],
    ["PIXMAP", null],
    ["CURSOR", null],
    ["FONT", null],
    ["GCONTEXT", null],
    ["COLORMAP", null],
    ["ATOM", null],
    ["DRAWABLE", new Set(["WINDOW", "PIXMAP"])],
    ["FONTABLE", new Set(["FONT", "GCONTEXT"])]
  ]);

  readCHAR2B() {
    var obj = {};
    obj.byte1 = this.readCARD8();
    obj.byte2 = this.readCARD8();
    return obj;
  }

  writeCHAR2B(obj) {
    this.writeCARD8(obj.byte1);
    this.writeCARD8(obj.byte2);
  }

  readPOINT() {
    var obj = {};
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    return obj;
  }

  writePOINT(obj) {
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
  }

  readRECTANGLE() {
    var obj = {};
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  writeRECTANGLE(obj) {
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  readARC() {
    var obj = {};
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.angle1 = this.readINT16();
    obj.angle2 = this.readINT16();
    return obj;
  }

  writeARC(obj) {
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeINT16(obj.angle1);
    this.writeINT16(obj.angle2);
  }

  readFORMAT() {
    var obj = {};
    obj.depth = this.readCARD8();
    obj.bits_per_pixel = this.readCARD8();
    obj.scanline_pad = this.readCARD8();
    this.moveCursor(5);
    return obj;
  }

  writeFORMAT(obj) {
    this.writeCARD8(obj.depth);
    this.writeCARD8(obj.bits_per_pixel);
    this.writeCARD8(obj.scanline_pad);
    this.moveCursor(5);
  }

  readVISUALTYPE() {
    var obj = {};
    obj.visual_id = this.readVISUALID();
    obj.class = this.readCARD8();
    obj.bits_per_rgb_value = this.readCARD8();
    obj.colormap_entries = this.readCARD16();
    obj.red_mask = this.readCARD32();
    obj.green_mask = this.readCARD32();
    obj.blue_mask = this.readCARD32();
    this.moveCursor(4);
    return obj;
  }

  writeVISUALTYPE(obj) {
    this.writeVISUALID(obj.visual_id);
    this.writeCARD8(obj.class);
    this.writeCARD8(obj.bits_per_rgb_value);
    this.writeCARD16(obj.colormap_entries);
    this.writeCARD32(obj.red_mask);
    this.writeCARD32(obj.green_mask);
    this.writeCARD32(obj.blue_mask);
    this.moveCursor(4);
  }

  readDEPTH() {
    var obj = {};
    obj.depth = this.readCARD8();
    this.moveCursor(1);
    obj.visuals_len = this.readCARD16();
    this.moveCursor(4);
    var visuals_length = obj.visuals_len;
    obj.visuals = [];

    for (let i = 0; i < visuals_length; i++) {
      obj.visuals.push(this.readVISUALTYPE());
    }

    return obj;
  }

  writeDEPTH(obj) {
    obj.visuals_len = obj.visuals.length;
    this.writeCARD8(obj.depth);
    this.moveCursor(1);
    this.writeCARD16(obj.visuals_len);
    this.moveCursor(4);
    var visuals_length = obj.visuals_len;

    for (let val of obj.visuals) {
      this.writeVISUALTYPE(val);
    }
  }

  readSCREEN() {
    var obj = {};
    obj.root = this.readWINDOW();
    obj.default_colormap = this.readCOLORMAP();
    obj.white_pixel = this.readCARD32();
    obj.black_pixel = this.readCARD32();
    obj.current_input_masks = this.readCARD32();
    obj.width_in_pixels = this.readCARD16();
    obj.height_in_pixels = this.readCARD16();
    obj.width_in_millimeters = this.readCARD16();
    obj.height_in_millimeters = this.readCARD16();
    obj.min_installed_maps = this.readCARD16();
    obj.max_installed_maps = this.readCARD16();
    obj.root_visual = this.readVISUALID();
    obj.backing_stores = this.readBYTE();
    obj.save_unders = this.readBOOL();
    obj.root_depth = this.readCARD8();
    obj.allowed_depths_len = this.readCARD8();
    var allowed_depths_length = obj.allowed_depths_len;
    obj.allowed_depths = [];

    for (let i = 0; i < allowed_depths_length; i++) {
      obj.allowed_depths.push(this.readDEPTH());
    }

    return obj;
  }

  writeSCREEN(obj) {
    obj.allowed_depths_len = obj.allowed_depths.length;
    this.writeWINDOW(obj.root);
    this.writeCOLORMAP(obj.default_colormap);
    this.writeCARD32(obj.white_pixel);
    this.writeCARD32(obj.black_pixel);
    this.writeCARD32(obj.current_input_masks);
    this.writeCARD16(obj.width_in_pixels);
    this.writeCARD16(obj.height_in_pixels);
    this.writeCARD16(obj.width_in_millimeters);
    this.writeCARD16(obj.height_in_millimeters);
    this.writeCARD16(obj.min_installed_maps);
    this.writeCARD16(obj.max_installed_maps);
    this.writeVISUALID(obj.root_visual);
    this.writeBYTE(obj.backing_stores);
    this.writeBOOL(obj.save_unders);
    this.writeCARD8(obj.root_depth);
    this.writeCARD8(obj.allowed_depths_len);
    var allowed_depths_length = obj.allowed_depths_len;

    for (let val of obj.allowed_depths) {
      this.writeDEPTH(val);
    }
  }

  readSetupRequest() {
    var obj = {};
    obj.byte_order = this.readCARD8();
    obj.endian = obj.byte_order !== 66;
    this.endian = obj.endian;
    this.moveCursor(1);
    obj.protocol_major_version = this.readCARD16();
    obj.protocol_minor_version = this.readCARD16();
    obj.authorization_protocol_name_len = this.readCARD16();
    obj.authorization_protocol_data_len = this.readCARD16();
    this.moveCursor(2);
    var authorization_protocol_name_length = obj.authorization_protocol_name_len;
    obj.authorization_protocol_name = [];

    for (let i = 0; i < authorization_protocol_name_length; i++) {
      obj.authorization_protocol_name.push(this.readchar());
    }

    obj.authorization_protocol_name = obj.authorization_protocol_name.join("");
    var authorization_protocol_data_length = obj.authorization_protocol_data_len;
    obj.authorization_protocol_data = [];

    for (let i = 0; i < authorization_protocol_data_length; i++) {
      obj.authorization_protocol_data.push(this.readchar());
    }

    obj.authorization_protocol_data = obj.authorization_protocol_data.join("");
    return obj;
  }

  writeSetupRequest(obj) {
    obj.authorization_protocol_name_len = obj.authorization_protocol_name.length;
    obj.authorization_protocol_data_len = obj.authorization_protocol_data.length;
    this.writeCARD8(obj.byte_order);
    this.moveCursor(1);
    this.writeCARD16(obj.protocol_major_version);
    this.writeCARD16(obj.protocol_minor_version);
    this.writeCARD16(obj.authorization_protocol_name_len);
    this.writeCARD16(obj.authorization_protocol_data_len);
    this.moveCursor(2);
    var authorization_protocol_name_length = obj.authorization_protocol_name_len;

    for (let val of obj.authorization_protocol_name) {
      this.writechar(val);
    }

    var authorization_protocol_data_length = obj.authorization_protocol_data_len;

    for (let val of obj.authorization_protocol_data) {
      this.writechar(val);
    }
  }

  readSetupFailed() {
    var obj = {};
    obj.status = this.readCARD8();
    obj.reason_len = this.readCARD8();
    obj.protocol_major_version = this.readCARD16();
    obj.protocol_minor_version = this.readCARD16();
    obj.length = this.readCARD16();
    var reason_length = obj.reason_len;
    obj.reason = [];

    for (let i = 0; i < reason_length; i++) {
      obj.reason.push(this.readchar());
    }

    obj.reason = obj.reason.join("");
    return obj;
  }

  writeSetupFailed(obj) {
    obj.reason_len = obj.reason.length;
    this.writeCARD8(obj.status);
    this.writeCARD8(obj.reason_len);
    this.writeCARD16(obj.protocol_major_version);
    this.writeCARD16(obj.protocol_minor_version);
    this.writeCARD16(obj.length);
    var reason_length = obj.reason_len;

    for (let val of obj.reason) {
      this.writechar(val);
    }
  }

  readSetupAuthenticate() {
    var obj = {};
    obj.status = this.readCARD8();
    this.moveCursor(5);
    obj.length = this.readCARD16();
    var reason_length = (obj.length * 4);
    obj.reason = [];

    for (let i = 0; i < reason_length; i++) {
      obj.reason.push(this.readchar());
    }

    obj.reason = obj.reason.join("");
    return obj;
  }

  writeSetupAuthenticate(obj) {
    obj.reason_len = obj.reason.length;
    this.writeCARD8(obj.status);
    this.moveCursor(5);
    this.writeCARD16(obj.length);
    var reason_length = (obj.length * 4);

    for (let val of obj.reason) {
      this.writechar(val);
    }
  }

  readSetup() {
    var obj = {};
    obj.status = this.readCARD8();
    this.moveCursor(1);
    obj.protocol_major_version = this.readCARD16();
    obj.protocol_minor_version = this.readCARD16();
    obj.length = this.readCARD16();
    obj.release_number = this.readCARD32();
    obj.resource_id_base = this.readCARD32();
    obj.resource_id_mask = this.readCARD32();
    obj.motion_buffer_size = this.readCARD32();
    obj.vendor_len = this.readCARD16();
    obj.maximum_request_length = this.readCARD16();
    obj.roots_len = this.readCARD8();
    obj.pixmap_formats_len = this.readCARD8();
    obj.image_byte_order = this.readCARD8();
    obj.bitmap_format_bit_order = this.readCARD8();
    obj.bitmap_format_scanline_unit = this.readCARD8();
    obj.bitmap_format_scanline_pad = this.readCARD8();
    obj.min_keycode = this.readKEYCODE();
    obj.max_keycode = this.readKEYCODE();
    this.moveCursor(4);
    var vendor_length = obj.vendor_len;
    obj.vendor = [];

    for (let i = 0; i < vendor_length; i++) {
      obj.vendor.push(this.readchar());
    }

    obj.vendor = obj.vendor.join("");
    var pixmap_formats_length = obj.pixmap_formats_len;
    obj.pixmap_formats = [];

    for (let i = 0; i < pixmap_formats_length; i++) {
      obj.pixmap_formats.push(this.readFORMAT());
    }

    var roots_length = obj.roots_len;
    obj.roots = [];

    for (let i = 0; i < roots_length; i++) {
      obj.roots.push(this.readSCREEN());
    }

    return obj;
  }

  writeSetup(obj) {
    obj.vendor_len = obj.vendor.length;
    obj.pixmap_formats_len = obj.pixmap_formats.length;
    obj.roots_len = obj.roots.length;
    this.writeCARD8(obj.status);
    this.moveCursor(1);
    this.writeCARD16(obj.protocol_major_version);
    this.writeCARD16(obj.protocol_minor_version);
    this.writeCARD16(obj.length);
    this.writeCARD32(obj.release_number);
    this.writeCARD32(obj.resource_id_base);
    this.writeCARD32(obj.resource_id_mask);
    this.writeCARD32(obj.motion_buffer_size);
    this.writeCARD16(obj.vendor_len);
    this.writeCARD16(obj.maximum_request_length);
    this.writeCARD8(obj.roots_len);
    this.writeCARD8(obj.pixmap_formats_len);
    this.writeCARD8(obj.image_byte_order);
    this.writeCARD8(obj.bitmap_format_bit_order);
    this.writeCARD8(obj.bitmap_format_scanline_unit);
    this.writeCARD8(obj.bitmap_format_scanline_pad);
    this.writeKEYCODE(obj.min_keycode);
    this.writeKEYCODE(obj.max_keycode);
    this.moveCursor(4);
    var vendor_length = obj.vendor_len;

    for (let val of obj.vendor) {
      this.writechar(val);
    }

    var pixmap_formats_length = obj.pixmap_formats_len;

    for (let val of obj.pixmap_formats) {
      this.writeFORMAT(val);
    }

    var roots_length = obj.roots_len;

    for (let val of obj.roots) {
      this.writeSCREEN(val);
    }
  }

  readTIMECOORD() {
    var obj = {};
    obj.time = this.readTIMESTAMP();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    return obj;
  }

  writeTIMECOORD(obj) {
    this.writeTIMESTAMP(obj.time);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
  }

  readFONTPROP() {
    var obj = {};
    obj.name = this.readATOM();
    obj.value = this.readCARD32();
    return obj;
  }

  writeFONTPROP(obj) {
    this.writeATOM(obj.name);
    this.writeCARD32(obj.value);
  }

  readCHARINFO() {
    var obj = {};
    obj.left_side_bearing = this.readINT16();
    obj.right_side_bearing = this.readINT16();
    obj.character_width = this.readINT16();
    obj.ascent = this.readINT16();
    obj.descent = this.readINT16();
    obj.attributes = this.readCARD16();
    return obj;
  }

  writeCHARINFO(obj) {
    this.writeINT16(obj.left_side_bearing);
    this.writeINT16(obj.right_side_bearing);
    this.writeINT16(obj.character_width);
    this.writeINT16(obj.ascent);
    this.writeINT16(obj.descent);
    this.writeCARD16(obj.attributes);
  }

  readSTR() {
    var obj = {};
    obj.name_len = this.readCARD8();
    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  writeSTR(obj) {
    obj.name_len = obj.name.length;
    this.writeCARD8(obj.name_len);
    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  readSEGMENT() {
    var obj = {};
    obj.x1 = this.readINT16();
    obj.y1 = this.readINT16();
    obj.x2 = this.readINT16();
    obj.y2 = this.readINT16();
    return obj;
  }

  writeSEGMENT(obj) {
    this.writeINT16(obj.x1);
    this.writeINT16(obj.y1);
    this.writeINT16(obj.x2);
    this.writeINT16(obj.y2);
  }

  readCOLORITEM() {
    var obj = {};
    obj.pixel = this.readCARD32();
    obj.red = this.readCARD16();
    obj.green = this.readCARD16();
    obj.blue = this.readCARD16();
    obj.flags = this.readBYTE();
    this.moveCursor(1);
    return obj;
  }

  writeCOLORITEM(obj) {
    this.writeCARD32(obj.pixel);
    this.writeCARD16(obj.red);
    this.writeCARD16(obj.green);
    this.writeCARD16(obj.blue);
    this.writeBYTE(obj.flags);
    this.moveCursor(1);
  }

  readRGB() {
    var obj = {};
    obj.red = this.readCARD16();
    obj.green = this.readCARD16();
    obj.blue = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  writeRGB(obj) {
    this.writeCARD16(obj.red);
    this.writeCARD16(obj.green);
    this.writeCARD16(obj.blue);
    this.moveCursor(2);
  }

  readHOST() {
    var obj = {};
    obj.family = this.readCARD8();
    this.moveCursor(1);
    obj.address_len = this.readCARD16();
    var address_length = obj.address_len;
    obj.address = [];

    for (let i = 0; i < address_length; i++) {
      obj.address.push(this.readBYTE());
    }

    return obj;
  }

  writeHOST(obj) {
    obj.address_len = obj.address.length;
    this.writeCARD8(obj.family);
    this.moveCursor(1);
    this.writeCARD16(obj.address_len);
    var address_length = obj.address_len;

    for (let val of obj.address) {
      this.writeBYTE(val);
    }
  }

  static enums = new Map([
    ["VisualClass", VisualClassEnum],
    ["EventMask", EventMaskEnum],
    ["BackingStore", BackingStoreEnum],
    ["ImageOrder", ImageOrderEnum],
    ["ModMask", ModMaskEnum],
    ["KeyButMask", KeyButMaskEnum],
    ["Window", WindowEnum],
    ["ButtonMask", ButtonMaskEnum],
    ["Motion", MotionEnum],
    ["NotifyDetail", NotifyDetailEnum],
    ["NotifyMode", NotifyModeEnum],
    ["Visibility", VisibilityEnum],
    ["Place", PlaceEnum],
    ["Property", PropertyEnum],
    ["Time", TimeEnum],
    ["ColormapState", ColormapStateEnum],
    ["Colormap", ColormapEnum],
    ["Mapping", MappingEnum],
    ["WindowClass", WindowClassEnum],
    ["CW", CWEnum],
    ["BackPixmap", BackPixmapEnum],
    ["Gravity", GravityEnum],
    ["MapState", MapStateEnum],
    ["SetMode", SetModeEnum],
    ["ConfigWindow", ConfigWindowEnum],
    ["StackMode", StackModeEnum],
    ["Circulate", CirculateEnum],
    ["PropMode", PropModeEnum],
    ["GetPropertyType", GetPropertyTypeEnum],
    ["SendEventDest", SendEventDestEnum],
    ["GrabMode", GrabModeEnum],
    ["GrabStatus", GrabStatusEnum],
    ["Cursor", CursorEnum],
    ["ButtonIndex", ButtonIndexEnum],
    ["Grab", GrabEnum],
    ["Allow", AllowEnum],
    ["InputFocus", InputFocusEnum],
    ["FontDraw", FontDrawEnum],
    ["GC", GCEnum],
    ["GX", GXEnum],
    ["LineStyle", LineStyleEnum],
    ["CapStyle", CapStyleEnum],
    ["JoinStyle", JoinStyleEnum],
    ["FillStyle", FillStyleEnum],
    ["FillRule", FillRuleEnum],
    ["SubwindowMode", SubwindowModeEnum],
    ["ArcMode", ArcModeEnum],
    ["ClipOrdering", ClipOrderingEnum],
    ["CoordMode", CoordModeEnum],
    ["PolyShape", PolyShapeEnum],
    ["ImageFormat", ImageFormatEnum],
    ["ColormapAlloc", ColormapAllocEnum],
    ["ColorFlag", ColorFlagEnum],
    ["Pixmap", PixmapEnum],
    ["Font", FontEnum],
    ["QueryShapeOf", QueryShapeOfEnum],
    ["KB", KBEnum],
    ["LedMode", LedModeEnum],
    ["AutoRepeatMode", AutoRepeatModeEnum],
    ["Blanking", BlankingEnum],
    ["Exposures", ExposuresEnum],
    ["HostMode", HostModeEnum],
    ["Family", FamilyEnum],
    ["AccessControl", AccessControlEnum],
    ["CloseDown", CloseDownEnum],
    ["Kill", KillEnum],
    ["ScreenSaver", ScreenSaverEnum],
    ["MappingStatus", MappingStatusEnum],
    ["MapIndex", MapIndexEnum]
  ]);

  event_readKeyPress() {
    var obj = {};
    obj.detail = this.readKEYCODE();
    obj.time = this.readTIMESTAMP();
    obj.root = this.readWINDOW();
    obj.event = this.readWINDOW();
    obj.child = this.readWINDOW();
    obj.root_x = this.readINT16();
    obj.root_y = this.readINT16();
    obj.event_x = this.readINT16();
    obj.event_y = this.readINT16();
    obj.state = this.readCARD16();
    obj.same_screen = this.readBOOL();
    this.moveCursor(1);
    return obj;
  }

  event_writeKeyPress(obj) {
    this.writeKEYCODE(obj.detail);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.root);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.child);
    this.writeINT16(obj.root_x);
    this.writeINT16(obj.root_y);
    this.writeINT16(obj.event_x);
    this.writeINT16(obj.event_y);
    this.writeCARD16(obj.state);
    this.writeBOOL(obj.same_screen);
    this.moveCursor(1);
  }

  event_readButtonPress() {
    var obj = {};
    obj.detail = this.readBUTTON();
    obj.time = this.readTIMESTAMP();
    obj.root = this.readWINDOW();
    obj.event = this.readWINDOW();
    obj.child = this.readWINDOW();
    obj.root_x = this.readINT16();
    obj.root_y = this.readINT16();
    obj.event_x = this.readINT16();
    obj.event_y = this.readINT16();
    obj.state = this.readCARD16();
    obj.same_screen = this.readBOOL();
    this.moveCursor(1);
    return obj;
  }

  event_writeButtonPress(obj) {
    this.writeBUTTON(obj.detail);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.root);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.child);
    this.writeINT16(obj.root_x);
    this.writeINT16(obj.root_y);
    this.writeINT16(obj.event_x);
    this.writeINT16(obj.event_y);
    this.writeCARD16(obj.state);
    this.writeBOOL(obj.same_screen);
    this.moveCursor(1);
  }

  event_readMotionNotify() {
    var obj = {};
    obj.detail = this.readBYTE();
    obj.time = this.readTIMESTAMP();
    obj.root = this.readWINDOW();
    obj.event = this.readWINDOW();
    obj.child = this.readWINDOW();
    obj.root_x = this.readINT16();
    obj.root_y = this.readINT16();
    obj.event_x = this.readINT16();
    obj.event_y = this.readINT16();
    obj.state = this.readCARD16();
    obj.same_screen = this.readBOOL();
    this.moveCursor(1);
    return obj;
  }

  event_writeMotionNotify(obj) {
    this.writeBYTE(obj.detail);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.root);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.child);
    this.writeINT16(obj.root_x);
    this.writeINT16(obj.root_y);
    this.writeINT16(obj.event_x);
    this.writeINT16(obj.event_y);
    this.writeCARD16(obj.state);
    this.writeBOOL(obj.same_screen);
    this.moveCursor(1);
  }

  event_readEnterNotify() {
    var obj = {};
    obj.detail = this.readBYTE();
    obj.time = this.readTIMESTAMP();
    obj.root = this.readWINDOW();
    obj.event = this.readWINDOW();
    obj.child = this.readWINDOW();
    obj.root_x = this.readINT16();
    obj.root_y = this.readINT16();
    obj.event_x = this.readINT16();
    obj.event_y = this.readINT16();
    obj.state = this.readCARD16();
    obj.mode = this.readBYTE();
    obj.same_screen_focus = this.readBYTE();
    return obj;
  }

  event_writeEnterNotify(obj) {
    this.writeBYTE(obj.detail);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.root);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.child);
    this.writeINT16(obj.root_x);
    this.writeINT16(obj.root_y);
    this.writeINT16(obj.event_x);
    this.writeINT16(obj.event_y);
    this.writeCARD16(obj.state);
    this.writeBYTE(obj.mode);
    this.writeBYTE(obj.same_screen_focus);
  }

  event_readFocusIn() {
    var obj = {};
    obj.detail = this.readBYTE();
    obj.event = this.readWINDOW();
    obj.mode = this.readBYTE();
    this.moveCursor(3);
    return obj;
  }

  event_writeFocusIn(obj) {
    this.writeBYTE(obj.detail);
    this.writeWINDOW(obj.event);
    this.writeBYTE(obj.mode);
    this.moveCursor(3);
  }

  event_readKeymapNotify() {
    var obj = {};
    var keys_length = 31;
    obj.keys = [];

    for (let i = 0; i < keys_length; i++) {
      obj.keys.push(this.readCARD8());
    }

    return obj;
  }

  event_writeKeymapNotify(obj) {
    obj.keys_len = obj.keys.length;
    var keys_length = 31;

    for (let val of obj.keys) {
      this.writeCARD8(val);
    }
  }

  event_readExpose() {
    var obj = {};
    this.moveCursor(1);
    obj.window = this.readWINDOW();
    obj.x = this.readCARD16();
    obj.y = this.readCARD16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.count = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  event_writeExpose(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.window);
    this.writeCARD16(obj.x);
    this.writeCARD16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.count);
    this.moveCursor(2);
  }

  event_readGraphicsExposure() {
    var obj = {};
    this.moveCursor(1);
    obj.drawable = this.readDRAWABLE();
    obj.x = this.readCARD16();
    obj.y = this.readCARD16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.minor_opcode = this.readCARD16();
    obj.count = this.readCARD16();
    obj.major_opcode = this.readCARD8();
    this.moveCursor(3);
    return obj;
  }

  event_writeGraphicsExposure(obj) {
    this.moveCursor(1);
    this.writeDRAWABLE(obj.drawable);
    this.writeCARD16(obj.x);
    this.writeCARD16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.minor_opcode);
    this.writeCARD16(obj.count);
    this.writeCARD8(obj.major_opcode);
    this.moveCursor(3);
  }

  event_readNoExposure() {
    var obj = {};
    this.moveCursor(1);
    obj.drawable = this.readDRAWABLE();
    obj.minor_opcode = this.readCARD16();
    obj.major_opcode = this.readCARD8();
    this.moveCursor(1);
    return obj;
  }

  event_writeNoExposure(obj) {
    this.moveCursor(1);
    this.writeDRAWABLE(obj.drawable);
    this.writeCARD16(obj.minor_opcode);
    this.writeCARD8(obj.major_opcode);
    this.moveCursor(1);
  }

  event_readVisibilityNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.window = this.readWINDOW();
    obj.state = this.readBYTE();
    this.moveCursor(3);
    return obj;
  }

  event_writeVisibilityNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.window);
    this.writeBYTE(obj.state);
    this.moveCursor(3);
  }

  event_readCreateNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.parent = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.border_width = this.readCARD16();
    obj.override_redirect = this.readBOOL();
    this.moveCursor(1);
    return obj;
  }

  event_writeCreateNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.parent);
    this.writeWINDOW(obj.window);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.border_width);
    this.writeBOOL(obj.override_redirect);
    this.moveCursor(1);
  }

  event_readDestroyNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    return obj;
  }

  event_writeDestroyNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
  }

  event_readUnmapNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.from_configure = this.readBOOL();
    this.moveCursor(3);
    return obj;
  }

  event_writeUnmapNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
    this.writeBOOL(obj.from_configure);
    this.moveCursor(3);
  }

  event_readMapNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.override_redirect = this.readBOOL();
    this.moveCursor(3);
    return obj;
  }

  event_writeMapNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
    this.writeBOOL(obj.override_redirect);
    this.moveCursor(3);
  }

  event_readMapRequest() {
    var obj = {};
    this.moveCursor(1);
    obj.parent = this.readWINDOW();
    obj.window = this.readWINDOW();
    return obj;
  }

  event_writeMapRequest(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.parent);
    this.writeWINDOW(obj.window);
  }

  event_readReparentNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.parent = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.override_redirect = this.readBOOL();
    this.moveCursor(3);
    return obj;
  }

  event_writeReparentNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
    this.writeWINDOW(obj.parent);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeBOOL(obj.override_redirect);
    this.moveCursor(3);
  }

  event_readConfigureNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.above_sibling = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.border_width = this.readCARD16();
    obj.override_redirect = this.readBOOL();
    this.moveCursor(1);
    return obj;
  }

  event_writeConfigureNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
    this.writeWINDOW(obj.above_sibling);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.border_width);
    this.writeBOOL(obj.override_redirect);
    this.moveCursor(1);
  }

  event_readConfigureRequest() {
    var obj = {};
    obj.stack_mode = this.readBYTE();
    obj.parent = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.sibling = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.border_width = this.readCARD16();
    obj.value_mask = this.readCARD16();
    return obj;
  }

  event_writeConfigureRequest(obj) {
    this.writeBYTE(obj.stack_mode);
    this.writeWINDOW(obj.parent);
    this.writeWINDOW(obj.window);
    this.writeWINDOW(obj.sibling);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.border_width);
    this.writeCARD16(obj.value_mask);
  }

  event_readGravityNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    return obj;
  }

  event_writeGravityNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
  }

  event_readResizeRequest() {
    var obj = {};
    this.moveCursor(1);
    obj.window = this.readWINDOW();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  event_writeResizeRequest(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.window);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  event_readCirculateNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.event = this.readWINDOW();
    obj.window = this.readWINDOW();
    this.moveCursor(4);
    obj.place = this.readBYTE();
    this.moveCursor(3);
    return obj;
  }

  event_writeCirculateNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.event);
    this.writeWINDOW(obj.window);
    this.moveCursor(4);
    this.writeBYTE(obj.place);
    this.moveCursor(3);
  }

  event_readPropertyNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.window = this.readWINDOW();
    obj.atom = this.readATOM();
    obj.time = this.readTIMESTAMP();
    obj.state = this.readBYTE();
    this.moveCursor(3);
    return obj;
  }

  event_writePropertyNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.window);
    this.writeATOM(obj.atom);
    this.writeTIMESTAMP(obj.time);
    this.writeBYTE(obj.state);
    this.moveCursor(3);
  }

  event_readSelectionClear() {
    var obj = {};
    this.moveCursor(1);
    obj.time = this.readTIMESTAMP();
    obj.owner = this.readWINDOW();
    obj.selection = this.readATOM();
    return obj;
  }

  event_writeSelectionClear(obj) {
    this.moveCursor(1);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.owner);
    this.writeATOM(obj.selection);
  }

  event_readSelectionRequest() {
    var obj = {};
    this.moveCursor(1);
    obj.time = this.readTIMESTAMP();
    obj.owner = this.readWINDOW();
    obj.requestor = this.readWINDOW();
    obj.selection = this.readATOM();
    obj.target = this.readATOM();
    obj.property = this.readATOM();
    return obj;
  }

  event_writeSelectionRequest(obj) {
    this.moveCursor(1);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.owner);
    this.writeWINDOW(obj.requestor);
    this.writeATOM(obj.selection);
    this.writeATOM(obj.target);
    this.writeATOM(obj.property);
  }

  event_readSelectionNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.time = this.readTIMESTAMP();
    obj.requestor = this.readWINDOW();
    obj.selection = this.readATOM();
    obj.target = this.readATOM();
    obj.property = this.readATOM();
    return obj;
  }

  event_writeSelectionNotify(obj) {
    this.moveCursor(1);
    this.writeTIMESTAMP(obj.time);
    this.writeWINDOW(obj.requestor);
    this.writeATOM(obj.selection);
    this.writeATOM(obj.target);
    this.writeATOM(obj.property);
  }

  event_readColormapNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.window = this.readWINDOW();
    obj.colormap = this.readCOLORMAP();
    obj.new = this.readBOOL();
    obj.state = this.readBYTE();
    this.moveCursor(2);
    return obj;
  }

  event_writeColormapNotify(obj) {
    this.moveCursor(1);
    this.writeWINDOW(obj.window);
    this.writeCOLORMAP(obj.colormap);
    this.writeBOOL(obj.new);
    this.writeBYTE(obj.state);
    this.moveCursor(2);
  }

  event_readClientMessage() {
    var obj = {};
    obj.format = this.readCARD8();
    obj.window = this.readWINDOW();
    obj.type = this.readATOM();
    obj.data = this.readClientMessageData();
    return obj;
  }

  event_writeClientMessage(obj) {
    this.writeCARD8(obj.format);
    this.writeWINDOW(obj.window);
    this.writeATOM(obj.type);
    this.writeClientMessageData(obj.data);
  }

  event_readMappingNotify() {
    var obj = {};
    this.moveCursor(1);
    obj.request = this.readBYTE();
    obj.first_keycode = this.readKEYCODE();
    obj.count = this.readCARD8();
    this.moveCursor(1);
    return obj;
  }

  event_writeMappingNotify(obj) {
    this.moveCursor(1);
    this.writeBYTE(obj.request);
    this.writeKEYCODE(obj.first_keycode);
    this.writeCARD8(obj.count);
    this.moveCursor(1);
  }

  event_readKeyRelease() {
    return this.event_readKeyPress();
  }

  event_writeKeyRelease() {
    this.event_writeKeyPress(...arguments);
  }

  event_readButtonRelease() {
    return this.event_readButtonPress();
  }

  event_writeButtonRelease() {
    this.event_writeButtonPress(...arguments);
  }

  event_readLeaveNotify() {
    return this.event_readEnterNotify();
  }

  event_writeLeaveNotify() {
    this.event_writeEnterNotify(...arguments);
  }

  event_readFocusOut() {
    return this.event_readFocusIn();
  }

  event_writeFocusOut() {
    this.event_writeFocusIn(...arguments);
  }

  event_readCirculateRequest() {
    return this.event_readCirculateNotify();
  }

  event_writeCirculateRequest() {
    this.event_writeCirculateNotify(...arguments);
  }

  static event_numbers = new Map([
    [2, "KeyPress"],
    [4, "ButtonPress"],
    [6, "MotionNotify"],
    [7, "EnterNotify"],
    [9, "FocusIn"],
    [11, "KeymapNotify"],
    [12, "Expose"],
    [13, "GraphicsExposure"],
    [14, "NoExposure"],
    [15, "VisibilityNotify"],
    [16, "CreateNotify"],
    [17, "DestroyNotify"],
    [18, "UnmapNotify"],
    [19, "MapNotify"],
    [20, "MapRequest"],
    [21, "ReparentNotify"],
    [22, "ConfigureNotify"],
    [23, "ConfigureRequest"],
    [24, "GravityNotify"],
    [25, "ResizeRequest"],
    [26, "CirculateNotify"],
    [28, "PropertyNotify"],
    [29, "SelectionClear"],
    [30, "SelectionRequest"],
    [31, "SelectionNotify"],
    [32, "ColormapNotify"],
    [33, "ClientMessage"],
    [34, "MappingNotify"],
    [3, "KeyRelease"],
    [5, "ButtonRelease"],
    [8, "LeaveNotify"],
    [10, "FocusOut"],
    [27, "CirculateRequest"]
  ]);

  error_readRequest() {
    var obj = {};
    obj.bad_value = this.readCARD32();
    obj.minor_opcode = this.readCARD16();
    obj.major_opcode = this.readCARD8();
    this.moveCursor(1);
    return obj;
  }

  error_writeRequest(obj) {
    this.writeCARD32(obj.bad_value);
    this.writeCARD16(obj.minor_opcode);
    this.writeCARD8(obj.major_opcode);
    this.moveCursor(1);
  }

  error_readValue() {
    var obj = {};
    obj.bad_value = this.readCARD32();
    obj.minor_opcode = this.readCARD16();
    obj.major_opcode = this.readCARD8();
    this.moveCursor(1);
    return obj;
  }

  error_writeValue(obj) {
    this.writeCARD32(obj.bad_value);
    this.writeCARD16(obj.minor_opcode);
    this.writeCARD8(obj.major_opcode);
    this.moveCursor(1);
  }

  error_readWindow() {
    return this.error_readValue();
  }

  error_writeWindow() {
    this.error_writeValue(...arguments);
  }

  error_readPixmap() {
    return this.error_readValue();
  }

  error_writePixmap() {
    this.error_writeValue(...arguments);
  }

  error_readAtom() {
    return this.error_readValue();
  }

  error_writeAtom() {
    this.error_writeValue(...arguments);
  }

  error_readCursor() {
    return this.error_readValue();
  }

  error_writeCursor() {
    this.error_writeValue(...arguments);
  }

  error_readFont() {
    return this.error_readValue();
  }

  error_writeFont() {
    this.error_writeValue(...arguments);
  }

  error_readMatch() {
    return this.error_readRequest();
  }

  error_writeMatch() {
    this.error_writeRequest(...arguments);
  }

  error_readDrawable() {
    return this.error_readValue();
  }

  error_writeDrawable() {
    this.error_writeValue(...arguments);
  }

  error_readAccess() {
    return this.error_readRequest();
  }

  error_writeAccess() {
    this.error_writeRequest(...arguments);
  }

  error_readAlloc() {
    return this.error_readRequest();
  }

  error_writeAlloc() {
    this.error_writeRequest(...arguments);
  }

  error_readColormap() {
    return this.error_readValue();
  }

  error_writeColormap() {
    this.error_writeValue(...arguments);
  }

  error_readGContext() {
    return this.error_readValue();
  }

  error_writeGContext() {
    this.error_writeValue(...arguments);
  }

  error_readIDChoice() {
    return this.error_readValue();
  }

  error_writeIDChoice() {
    this.error_writeValue(...arguments);
  }

  error_readName() {
    return this.error_readRequest();
  }

  error_writeName() {
    this.error_writeRequest(...arguments);
  }

  error_readLength() {
    return this.error_readRequest();
  }

  error_writeLength() {
    this.error_writeRequest(...arguments);
  }

  error_readImplementation() {
    return this.error_readRequest();
  }

  error_writeImplementation() {
    this.error_writeRequest(...arguments);
  }

  static error_numbers = new Map([
    [1, "Request"],
    [2, "Value"],
    [3, "Window"],
    [4, "Pixmap"],
    [5, "Atom"],
    [6, "Cursor"],
    [7, "Font"],
    [8, "Match"],
    [9, "Drawable"],
    [10, "Access"],
    [11, "Alloc"],
    [12, "Colormap"],
    [13, "GContext"],
    [14, "IDChoice"],
    [15, "Name"],
    [16, "Length"],
    [17, "Implementation"]
  ]);

  request_readCreateWindow() {
    var obj = {};
    obj.depth = this.readCARD8();
    this.moveCursor(2);
    obj.wid = this.readWINDOW();
    obj.parent = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.border_width = this.readCARD16();
    obj.class = this.readCARD16();
    obj.visual = this.readVISUALID();
    obj.value_mask = (new CWEnum()).decode(this.readCARD32());
    var value = new Map();
    obj.value = value;

    for (let field of obj.value_mask) {
      value.set(field, this.readCARD32());
    }

    return obj;
  }

  request_writeCreateWindow(obj) {
    this.writeCARD8(obj.depth);
    this.moveCursor(2);
    this.writeWINDOW(obj.wid);
    this.writeWINDOW(obj.parent);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.border_width);
    this.writeCARD16(obj.class);
    this.writeVISUALID(obj.visual);
    var value = obj.value;
    var value_enum = new CWEnum(value.keys());
    this.writeCARD32(value_enum.encode());

    for (let field of value_enum) {
      this.writeCARD32(value.get(field));
    }
  }

  request_readChangeWindowAttributes() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.value_mask = (new CWEnum()).decode(this.readCARD32());
    var value = new Map();
    obj.value = value;

    for (let field of obj.value_mask) {
      value.set(field, this.readCARD32());
    }

    return obj;
  }

  request_writeChangeWindowAttributes(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    var value = obj.value;
    var value_enum = new CWEnum(value.keys());
    this.writeCARD32(value_enum.encode());

    for (let field of value_enum) {
      this.writeCARD32(value.get(field));
    }
  }

  request_readGetWindowAttributes() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeGetWindowAttributes(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  reply_readGetWindowAttributes() {
    var obj = {};
    obj.backing_store = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.visual = this.readVISUALID();
    obj.class = this.readCARD16();
    obj.bit_gravity = this.readCARD8();
    obj.win_gravity = this.readCARD8();
    obj.backing_planes = this.readCARD32();
    obj.backing_pixel = this.readCARD32();
    obj.save_under = this.readBOOL();
    obj.map_is_installed = this.readBOOL();
    obj.map_state = this.readCARD8();
    obj.override_redirect = this.readBOOL();
    obj.colormap = this.readCOLORMAP();
    obj.all_event_masks = this.readCARD32();
    obj.your_event_mask = this.readCARD32();
    obj.do_not_propagate_mask = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  reply_writeGetWindowAttributes(obj) {
    this.writeCARD8(obj.backing_store);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeVISUALID(obj.visual);
    this.writeCARD16(obj.class);
    this.writeCARD8(obj.bit_gravity);
    this.writeCARD8(obj.win_gravity);
    this.writeCARD32(obj.backing_planes);
    this.writeCARD32(obj.backing_pixel);
    this.writeBOOL(obj.save_under);
    this.writeBOOL(obj.map_is_installed);
    this.writeCARD8(obj.map_state);
    this.writeBOOL(obj.override_redirect);
    this.writeCOLORMAP(obj.colormap);
    this.writeCARD32(obj.all_event_masks);
    this.writeCARD32(obj.your_event_mask);
    this.writeCARD16(obj.do_not_propagate_mask);
    this.moveCursor(2);
  }

  request_readDestroyWindow() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeDestroyWindow(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readDestroySubwindows() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeDestroySubwindows(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readChangeSaveSet() {
    var obj = {};
    obj.mode = this.readBYTE();
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeChangeSaveSet(obj) {
    this.writeBYTE(obj.mode);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readReparentWindow() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.parent = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    return obj;
  }

  request_writeReparentWindow(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeWINDOW(obj.parent);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
  }

  request_readMapWindow() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeMapWindow(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readMapSubwindows() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeMapSubwindows(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readUnmapWindow() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeUnmapWindow(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readUnmapSubwindows() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeUnmapSubwindows(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readConfigureWindow() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.value_mask = this.readCARD16();
    this.moveCursor(2);
    obj.value_mask = (new ConfigWindowEnum()).decode(this.readCARD16());
    this.moveCursor(2);
    var value = new Map();
    obj.value = value;

    for (let field of obj.value_mask) {
      value.set(field, this.readCARD32());
    }

    return obj;
  }

  request_writeConfigureWindow(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeCARD16(obj.value_mask);
    this.moveCursor(2);
    var value = obj.value;
    var value_enum = new ConfigWindowEnum(value.keys());
    this.writeCARD16(value_enum.encode());
    this.moveCursor(2);

    for (let field of value_enum) {
      this.writeCARD32(value.get(field));
    }
  }

  request_readCirculateWindow() {
    var obj = {};
    obj.direction = this.readCARD8();
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeCirculateWindow(obj) {
    this.writeCARD8(obj.direction);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  request_readGetGeometry() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    return obj;
  }

  request_writeGetGeometry(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
  }

  reply_readGetGeometry() {
    var obj = {};
    obj.depth = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.root = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.border_width = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  reply_writeGetGeometry(obj) {
    this.writeCARD8(obj.depth);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeWINDOW(obj.root);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD16(obj.border_width);
    this.moveCursor(2);
  }

  request_readQueryTree() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeQueryTree(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  reply_readQueryTree() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.root = this.readWINDOW();
    obj.parent = this.readWINDOW();
    obj.children_len = this.readCARD16();
    this.moveCursor(14);
    var children_length = obj.children_len;
    obj.children = [];

    for (let i = 0; i < children_length; i++) {
      obj.children.push(this.readWINDOW());
    }

    return obj;
  }

  reply_writeQueryTree(obj) {
    obj.children_len = obj.children.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeWINDOW(obj.root);
    this.writeWINDOW(obj.parent);
    this.writeCARD16(obj.children_len);
    this.moveCursor(14);
    var children_length = obj.children_len;

    for (let val of obj.children) {
      this.writeWINDOW(val);
    }
  }

  request_readInternAtom() {
    var obj = {};
    obj.only_if_exists = this.readBOOL();
    this.moveCursor(2);
    obj.name_len = this.readCARD16();
    this.moveCursor(2);
    obj.name = this.readSTRING8();
    return obj;
  }

  request_writeInternAtom(obj) {
    this.writeBOOL(obj.only_if_exists);
    this.moveCursor(2);
    this.writeCARD16(obj.name_len);
    this.moveCursor(2);
    this.writeSTRING8(obj.name);
  }

  reply_readInternAtom() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.atom = this.readATOM();
    return obj;
  }

  reply_writeInternAtom(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeATOM(obj.atom);
  }

  request_readGetAtomName() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.atom = this.readATOM();
    return obj;
  }

  request_writeGetAtomName(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeATOM(obj.atom);
  }

  reply_readGetAtomName() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.name_len = this.readCARD16();
    this.moveCursor(22);
    obj.name = this.readSTRING8();
    return obj;
  }

  reply_writeGetAtomName(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.name_len);
    this.moveCursor(22);
    this.writeSTRING8(obj.name);
  }

  request_readChangeProperty() {
    var obj = {};
    obj.mode = this.readCARD8();
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.property = this.readATOM();
    obj.type = this.readATOM();
    obj.format = this.readCARD8();
    this.moveCursor(3);
    obj.data_len = this.readCARD32();
    var data_length = ((obj.data_len * obj.format) / 8);
    obj.data = this.cursorSlice(data_length);
    return obj;
  }

  request_writeChangeProperty(obj) {
    obj.data_len = obj.data.length;
    this.writeCARD8(obj.mode);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeATOM(obj.property);
    this.writeATOM(obj.type);
    this.writeCARD8(obj.format);
    this.moveCursor(3);
    this.writeCARD32(obj.data_len);
    this.cursorWriteBuffer(obj.data);
  }

  request_readDeleteProperty() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.property = this.readATOM();
    return obj;
  }

  request_writeDeleteProperty(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeATOM(obj.property);
  }

  request_readGetProperty() {
    var obj = {};
    obj.delete = this.readBOOL();
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.property = this.readATOM();
    obj.type = this.readATOM();
    obj.long_offset = this.readCARD32();
    obj.long_length = this.readCARD32();
    return obj;
  }

  request_writeGetProperty(obj) {
    this.writeBOOL(obj.delete);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeATOM(obj.property);
    this.writeATOM(obj.type);
    this.writeCARD32(obj.long_offset);
    this.writeCARD32(obj.long_length);
  }

  reply_readGetProperty() {
    var obj = {};
    obj.format = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.type = this.readATOM();
    obj.bytes_after = this.readCARD32();
    obj.value_len = this.readCARD32();
    this.moveCursor(12);
    var value_length = (obj.value_len * (obj.format / 8));
    obj.value = this.cursorSlice(value_length);
    return obj;
  }

  reply_writeGetProperty(obj) {
    obj.value_len = obj.value.length;
    this.writeCARD8(obj.format);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeATOM(obj.type);
    this.writeCARD32(obj.bytes_after);
    this.writeCARD32(obj.value_len);
    this.moveCursor(12);
    this.cursorWriteBuffer(obj.value);
  }

  request_readListProperties() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeListProperties(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  reply_readListProperties() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.atoms_len = this.readCARD16();
    this.moveCursor(22);
    var atoms_length = obj.atoms_len;
    obj.atoms = [];

    for (let i = 0; i < atoms_length; i++) {
      obj.atoms.push(this.readATOM());
    }

    return obj;
  }

  reply_writeListProperties(obj) {
    obj.atoms_len = obj.atoms.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.atoms_len);
    this.moveCursor(22);
    var atoms_length = obj.atoms_len;

    for (let val of obj.atoms) {
      this.writeATOM(val);
    }
  }

  request_readSetSelectionOwner() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.owner = this.readWINDOW();
    obj.selection = this.readATOM();
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeSetSelectionOwner(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.owner);
    this.writeATOM(obj.selection);
    this.writeTIMESTAMP(obj.time);
  }

  request_readGetSelectionOwner() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.selection = this.readATOM();
    return obj;
  }

  request_writeGetSelectionOwner(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeATOM(obj.selection);
  }

  reply_readGetSelectionOwner() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.owner = this.readWINDOW();
    return obj;
  }

  reply_writeGetSelectionOwner(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeWINDOW(obj.owner);
  }

  request_readConvertSelection() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.requestor = this.readWINDOW();
    obj.selection = this.readATOM();
    obj.target = this.readATOM();
    obj.property = this.readATOM();
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeConvertSelection(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.requestor);
    this.writeATOM(obj.selection);
    this.writeATOM(obj.target);
    this.writeATOM(obj.property);
    this.writeTIMESTAMP(obj.time);
  }

  request_readSendEvent() {
    var obj = {};
    obj.propagate = this.readBOOL();
    this.moveCursor(2);
    obj.destination = this.readWINDOW();
    obj.event_mask = this.readCARD32();
    var event_length = 32;
    obj.event = [];

    for (let i = 0; i < event_length; i++) {
      obj.event.push(this.readchar());
    }

    obj.event = obj.event.join("");
    return obj;
  }

  request_writeSendEvent(obj) {
    obj.event_len = obj.event.length;
    this.writeBOOL(obj.propagate);
    this.moveCursor(2);
    this.writeWINDOW(obj.destination);
    this.writeCARD32(obj.event_mask);
    var event_length = 32;

    for (let val of obj.event) {
      this.writechar(val);
    }
  }

  request_readGrabPointer() {
    var obj = {};
    obj.owner_events = this.readBOOL();
    this.moveCursor(2);
    obj.grab_window = this.readWINDOW();
    obj.event_mask = this.readCARD16();
    obj.pointer_mode = this.readBYTE();
    obj.keyboard_mode = this.readBYTE();
    obj.confine_to = this.readWINDOW();
    obj.cursor = this.readCURSOR();
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeGrabPointer(obj) {
    this.writeBOOL(obj.owner_events);
    this.moveCursor(2);
    this.writeWINDOW(obj.grab_window);
    this.writeCARD16(obj.event_mask);
    this.writeBYTE(obj.pointer_mode);
    this.writeBYTE(obj.keyboard_mode);
    this.writeWINDOW(obj.confine_to);
    this.writeCURSOR(obj.cursor);
    this.writeTIMESTAMP(obj.time);
  }

  reply_readGrabPointer() {
    var obj = {};
    obj.status = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    return obj;
  }

  reply_writeGrabPointer(obj) {
    this.writeBYTE(obj.status);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
  }

  request_readUngrabPointer() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeUngrabPointer(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeTIMESTAMP(obj.time);
  }

  request_readGrabButton() {
    var obj = {};
    obj.owner_events = this.readBOOL();
    this.moveCursor(2);
    obj.grab_window = this.readWINDOW();
    obj.event_mask = this.readCARD16();
    obj.pointer_mode = this.readCARD8();
    obj.keyboard_mode = this.readCARD8();
    obj.confine_to = this.readWINDOW();
    obj.cursor = this.readCURSOR();
    obj.button = this.readCARD8();
    this.moveCursor(1);
    obj.modifiers = this.readCARD16();
    return obj;
  }

  request_writeGrabButton(obj) {
    this.writeBOOL(obj.owner_events);
    this.moveCursor(2);
    this.writeWINDOW(obj.grab_window);
    this.writeCARD16(obj.event_mask);
    this.writeCARD8(obj.pointer_mode);
    this.writeCARD8(obj.keyboard_mode);
    this.writeWINDOW(obj.confine_to);
    this.writeCURSOR(obj.cursor);
    this.writeCARD8(obj.button);
    this.moveCursor(1);
    this.writeCARD16(obj.modifiers);
  }

  request_readUngrabButton() {
    var obj = {};
    obj.button = this.readCARD8();
    this.moveCursor(2);
    obj.grab_window = this.readWINDOW();
    obj.modifiers = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  request_writeUngrabButton(obj) {
    this.writeCARD8(obj.button);
    this.moveCursor(2);
    this.writeWINDOW(obj.grab_window);
    this.writeCARD16(obj.modifiers);
    this.moveCursor(2);
  }

  request_readChangeActivePointerGrab() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cursor = this.readCURSOR();
    obj.time = this.readTIMESTAMP();
    obj.event_mask = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  request_writeChangeActivePointerGrab(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCURSOR(obj.cursor);
    this.writeTIMESTAMP(obj.time);
    this.writeCARD16(obj.event_mask);
    this.moveCursor(2);
  }

  request_readGrabKeyboard() {
    var obj = {};
    obj.owner_events = this.readBOOL();
    this.moveCursor(2);
    obj.grab_window = this.readWINDOW();
    obj.time = this.readTIMESTAMP();
    obj.pointer_mode = this.readBYTE();
    obj.keyboard_mode = this.readBYTE();
    this.moveCursor(2);
    return obj;
  }

  request_writeGrabKeyboard(obj) {
    this.writeBOOL(obj.owner_events);
    this.moveCursor(2);
    this.writeWINDOW(obj.grab_window);
    this.writeTIMESTAMP(obj.time);
    this.writeBYTE(obj.pointer_mode);
    this.writeBYTE(obj.keyboard_mode);
    this.moveCursor(2);
  }

  reply_readGrabKeyboard() {
    var obj = {};
    obj.status = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    return obj;
  }

  reply_writeGrabKeyboard(obj) {
    this.writeBYTE(obj.status);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
  }

  request_readUngrabKeyboard() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeUngrabKeyboard(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeTIMESTAMP(obj.time);
  }

  request_readGrabKey() {
    var obj = {};
    obj.owner_events = this.readBOOL();
    this.moveCursor(2);
    obj.grab_window = this.readWINDOW();
    obj.modifiers = this.readCARD16();
    obj.key = this.readKEYCODE();
    obj.pointer_mode = this.readCARD8();
    obj.keyboard_mode = this.readCARD8();
    this.moveCursor(3);
    return obj;
  }

  request_writeGrabKey(obj) {
    this.writeBOOL(obj.owner_events);
    this.moveCursor(2);
    this.writeWINDOW(obj.grab_window);
    this.writeCARD16(obj.modifiers);
    this.writeKEYCODE(obj.key);
    this.writeCARD8(obj.pointer_mode);
    this.writeCARD8(obj.keyboard_mode);
    this.moveCursor(3);
  }

  request_readUngrabKey() {
    var obj = {};
    obj.key = this.readKEYCODE();
    this.moveCursor(2);
    obj.grab_window = this.readWINDOW();
    obj.modifiers = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  request_writeUngrabKey(obj) {
    this.writeKEYCODE(obj.key);
    this.moveCursor(2);
    this.writeWINDOW(obj.grab_window);
    this.writeCARD16(obj.modifiers);
    this.moveCursor(2);
  }

  request_readAllowEvents() {
    var obj = {};
    obj.mode = this.readCARD8();
    this.moveCursor(2);
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeAllowEvents(obj) {
    this.writeCARD8(obj.mode);
    this.moveCursor(2);
    this.writeTIMESTAMP(obj.time);
  }

  request_readGrabServer() {
    return {};
  }

  request_writeGrabServer(obj) {}

  request_readUngrabServer() {
    return {};
  }

  request_writeUngrabServer(obj) {}

  request_readQueryPointer() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeQueryPointer(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  reply_readQueryPointer() {
    var obj = {};
    obj.same_screen = this.readBOOL();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.root = this.readWINDOW();
    obj.child = this.readWINDOW();
    obj.root_x = this.readINT16();
    obj.root_y = this.readINT16();
    obj.win_x = this.readINT16();
    obj.win_y = this.readINT16();
    obj.mask = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  reply_writeQueryPointer(obj) {
    this.writeBOOL(obj.same_screen);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeWINDOW(obj.root);
    this.writeWINDOW(obj.child);
    this.writeINT16(obj.root_x);
    this.writeINT16(obj.root_y);
    this.writeINT16(obj.win_x);
    this.writeINT16(obj.win_y);
    this.writeCARD16(obj.mask);
    this.moveCursor(2);
  }

  request_readGetMotionEvents() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.start = this.readTIMESTAMP();
    obj.stop = this.readTIMESTAMP();
    return obj;
  }

  request_writeGetMotionEvents(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeTIMESTAMP(obj.start);
    this.writeTIMESTAMP(obj.stop);
  }

  reply_readGetMotionEvents() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.events_len = this.readCARD32();
    this.moveCursor(20);
    var events_length = obj.events_len;
    obj.events = [];

    for (let i = 0; i < events_length; i++) {
      obj.events.push(this.readTIMECOORD());
    }

    return obj;
  }

  reply_writeGetMotionEvents(obj) {
    obj.events_len = obj.events.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD32(obj.events_len);
    this.moveCursor(20);
    var events_length = obj.events_len;

    for (let val of obj.events) {
      this.writeTIMECOORD(val);
    }
  }

  request_readTranslateCoordinates() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.src_window = this.readWINDOW();
    obj.dst_window = this.readWINDOW();
    obj.src_x = this.readINT16();
    obj.src_y = this.readINT16();
    return obj;
  }

  request_writeTranslateCoordinates(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.src_window);
    this.writeWINDOW(obj.dst_window);
    this.writeINT16(obj.src_x);
    this.writeINT16(obj.src_y);
  }

  reply_readTranslateCoordinates() {
    var obj = {};
    obj.same_screen = this.readBOOL();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.child = this.readWINDOW();
    obj.dst_x = this.readINT16();
    obj.dst_y = this.readINT16();
    return obj;
  }

  reply_writeTranslateCoordinates(obj) {
    this.writeBOOL(obj.same_screen);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeWINDOW(obj.child);
    this.writeINT16(obj.dst_x);
    this.writeINT16(obj.dst_y);
  }

  request_readWarpPointer() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.src_window = this.readWINDOW();
    obj.dst_window = this.readWINDOW();
    obj.src_x = this.readINT16();
    obj.src_y = this.readINT16();
    obj.src_width = this.readCARD16();
    obj.src_height = this.readCARD16();
    obj.dst_x = this.readINT16();
    obj.dst_y = this.readINT16();
    return obj;
  }

  request_writeWarpPointer(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.src_window);
    this.writeWINDOW(obj.dst_window);
    this.writeINT16(obj.src_x);
    this.writeINT16(obj.src_y);
    this.writeCARD16(obj.src_width);
    this.writeCARD16(obj.src_height);
    this.writeINT16(obj.dst_x);
    this.writeINT16(obj.dst_y);
  }

  request_readSetInputFocus() {
    var obj = {};
    obj.revert_to = this.readCARD8();
    this.moveCursor(2);
    obj.focus = this.readWINDOW();
    obj.time = this.readTIMESTAMP();
    return obj;
  }

  request_writeSetInputFocus(obj) {
    this.writeCARD8(obj.revert_to);
    this.moveCursor(2);
    this.writeWINDOW(obj.focus);
    this.writeTIMESTAMP(obj.time);
  }

  request_readGetInputFocus() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetInputFocus(obj) {
    this.moveCursor(2);
  }

  reply_readGetInputFocus() {
    var obj = {};
    obj.revert_to = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.focus = this.readWINDOW();
    return obj;
  }

  reply_writeGetInputFocus(obj) {
    this.writeCARD8(obj.revert_to);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeWINDOW(obj.focus);
  }

  request_readQueryKeymap() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeQueryKeymap(obj) {
    this.moveCursor(2);
  }

  reply_readQueryKeymap() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    var keys_length = 32;
    obj.keys = [];

    for (let i = 0; i < keys_length; i++) {
      obj.keys.push(this.readCARD8());
    }

    return obj;
  }

  reply_writeQueryKeymap(obj) {
    obj.keys_len = obj.keys.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    var keys_length = 32;

    for (let val of obj.keys) {
      this.writeCARD8(val);
    }
  }

  request_readOpenFont() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.fid = this.readFONT();
    obj.name_len = this.readCARD16();
    this.moveCursor(2);
    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  request_writeOpenFont(obj) {
    obj.name_len = obj.name.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeFONT(obj.fid);
    this.writeCARD16(obj.name_len);
    this.moveCursor(2);
    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  request_readCloseFont() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.font = this.readFONT();
    return obj;
  }

  request_writeCloseFont(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeFONT(obj.font);
  }

  request_readQueryFont() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.font = this.readFONTABLE();
    return obj;
  }

  request_writeQueryFont(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeFONTABLE(obj.font);
  }

  reply_readQueryFont() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.min_bounds = this.readCHARINFO();
    this.moveCursor(4);
    obj.max_bounds = this.readCHARINFO();
    this.moveCursor(4);
    obj.min_char_or_byte2 = this.readCARD16();
    obj.max_char_or_byte2 = this.readCARD16();
    obj.default_char = this.readCARD16();
    obj.properties_len = this.readCARD16();
    obj.draw_direction = this.readBYTE();
    obj.min_byte1 = this.readCARD8();
    obj.max_byte1 = this.readCARD8();
    obj.all_chars_exist = this.readBOOL();
    obj.font_ascent = this.readINT16();
    obj.font_descent = this.readINT16();
    obj.char_infos_len = this.readCARD32();
    var properties_length = obj.properties_len;
    obj.properties = [];

    for (let i = 0; i < properties_length; i++) {
      obj.properties.push(this.readFONTPROP());
    }

    var char_infos_length = obj.char_infos_len;
    obj.char_infos = [];

    for (let i = 0; i < char_infos_length; i++) {
      obj.char_infos.push(this.readCHARINFO());
    }

    return obj;
  }

  reply_writeQueryFont(obj) {
    obj.properties_len = obj.properties.length;
    obj.char_infos_len = obj.char_infos.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCHARINFO(obj.min_bounds);
    this.moveCursor(4);
    this.writeCHARINFO(obj.max_bounds);
    this.moveCursor(4);
    this.writeCARD16(obj.min_char_or_byte2);
    this.writeCARD16(obj.max_char_or_byte2);
    this.writeCARD16(obj.default_char);
    this.writeCARD16(obj.properties_len);
    this.writeBYTE(obj.draw_direction);
    this.writeCARD8(obj.min_byte1);
    this.writeCARD8(obj.max_byte1);
    this.writeBOOL(obj.all_chars_exist);
    this.writeINT16(obj.font_ascent);
    this.writeINT16(obj.font_descent);
    this.writeCARD32(obj.char_infos_len);
    var properties_length = obj.properties_len;

    for (let val of obj.properties) {
      this.writeFONTPROP(val);
    }

    var char_infos_length = obj.char_infos_len;

    for (let val of obj.char_infos) {
      this.writeCHARINFO(val);
    }
  }

  request_readQueryTextExtents() {
    var obj = {};
    obj.odd_length = this.readBOOL();
    this.moveCursor(2);
    obj.font = this.readFONTABLE();
    obj.string = [];

    while (this.cursor < this.length) {
      obj.string.push(this.readCHAR2B());
    }

    return obj;
  }

  request_writeQueryTextExtents(obj) {
    obj.string_len = obj.string.length;
    obj.odd_length = (obj.string_len & 1);
    this.moveCursor(2);
    this.writeFONTABLE(obj.font);
    var string_length;

    for (let val of obj.string) {
      this.writeCHAR2B(val);
    }
  }

  reply_readQueryTextExtents() {
    var obj = {};
    obj.draw_direction = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.font_ascent = this.readINT16();
    obj.font_descent = this.readINT16();
    obj.overall_ascent = this.readINT16();
    obj.overall_descent = this.readINT16();
    obj.overall_width = this.readINT32();
    obj.overall_left = this.readINT32();
    obj.overall_right = this.readINT32();
    return obj;
  }

  reply_writeQueryTextExtents(obj) {
    this.writeBYTE(obj.draw_direction);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeINT16(obj.font_ascent);
    this.writeINT16(obj.font_descent);
    this.writeINT16(obj.overall_ascent);
    this.writeINT16(obj.overall_descent);
    this.writeINT32(obj.overall_width);
    this.writeINT32(obj.overall_left);
    this.writeINT32(obj.overall_right);
  }

  request_readListFonts() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.max_names = this.readCARD16();
    obj.pattern_len = this.readCARD16();
    var pattern_length = obj.pattern_len;
    obj.pattern = [];

    for (let i = 0; i < pattern_length; i++) {
      obj.pattern.push(this.readchar());
    }

    obj.pattern = obj.pattern.join("");
    return obj;
  }

  request_writeListFonts(obj) {
    obj.pattern_len = obj.pattern.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCARD16(obj.max_names);
    this.writeCARD16(obj.pattern_len);
    var pattern_length = obj.pattern_len;

    for (let val of obj.pattern) {
      this.writechar(val);
    }
  }

  reply_readListFonts() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.names_len = this.readCARD16();
    this.moveCursor(22);
    var names_length = obj.names_len;
    obj.names = [];

    for (let i = 0; i < names_length; i++) {
      obj.names.push(this.readSTR());
    }

    return obj;
  }

  reply_writeListFonts(obj) {
    obj.names_len = obj.names.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.names_len);
    this.moveCursor(22);
    var names_length = obj.names_len;

    for (let val of obj.names) {
      this.writeSTR(val);
    }
  }

  request_readListFontsWithInfo() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.max_names = this.readCARD16();
    obj.pattern_len = this.readCARD16();
    var pattern_length = obj.pattern_len;
    obj.pattern = [];

    for (let i = 0; i < pattern_length; i++) {
      obj.pattern.push(this.readchar());
    }

    obj.pattern = obj.pattern.join("");
    return obj;
  }

  request_writeListFontsWithInfo(obj) {
    obj.pattern_len = obj.pattern.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCARD16(obj.max_names);
    this.writeCARD16(obj.pattern_len);
    var pattern_length = obj.pattern_len;

    for (let val of obj.pattern) {
      this.writechar(val);
    }
  }

  reply_readListFontsWithInfo() {
    var obj = {};
    obj.name_len = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.min_bounds = this.readCHARINFO();
    this.moveCursor(4);
    obj.max_bounds = this.readCHARINFO();
    this.moveCursor(4);
    obj.min_char_or_byte2 = this.readCARD16();
    obj.max_char_or_byte2 = this.readCARD16();
    obj.default_char = this.readCARD16();
    obj.properties_len = this.readCARD16();
    obj.draw_direction = this.readBYTE();
    obj.min_byte1 = this.readCARD8();
    obj.max_byte1 = this.readCARD8();
    obj.all_chars_exist = this.readBOOL();
    obj.font_ascent = this.readINT16();
    obj.font_descent = this.readINT16();
    obj.replies_hint = this.readCARD32();
    var properties_length = obj.properties_len;
    obj.properties = [];

    for (let i = 0; i < properties_length; i++) {
      obj.properties.push(this.readFONTPROP());
    }

    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  reply_writeListFontsWithInfo(obj) {
    obj.properties_len = obj.properties.length;
    obj.name_len = obj.name.length;
    this.writeCARD8(obj.name_len);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCHARINFO(obj.min_bounds);
    this.moveCursor(4);
    this.writeCHARINFO(obj.max_bounds);
    this.moveCursor(4);
    this.writeCARD16(obj.min_char_or_byte2);
    this.writeCARD16(obj.max_char_or_byte2);
    this.writeCARD16(obj.default_char);
    this.writeCARD16(obj.properties_len);
    this.writeBYTE(obj.draw_direction);
    this.writeCARD8(obj.min_byte1);
    this.writeCARD8(obj.max_byte1);
    this.writeBOOL(obj.all_chars_exist);
    this.writeINT16(obj.font_ascent);
    this.writeINT16(obj.font_descent);
    this.writeCARD32(obj.replies_hint);
    var properties_length = obj.properties_len;

    for (let val of obj.properties) {
      this.writeFONTPROP(val);
    }

    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  request_readSetFontPath() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.font_qty = this.readCARD16();
    this.moveCursor(2);
    var font_length = obj.font_qty;
    obj.font = [];

    for (let i = 0; i < font_length; i++) {
      obj.font.push(this.readSTR());
    }

    return obj;
  }

  request_writeSetFontPath(obj) {
    obj.font_len = obj.font.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCARD16(obj.font_qty);
    this.moveCursor(2);
    var font_length = obj.font_qty;

    for (let val of obj.font) {
      this.writeSTR(val);
    }
  }

  request_readGetFontPath() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetFontPath(obj) {
    this.moveCursor(2);
  }

  reply_readGetFontPath() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.path_len = this.readCARD16();
    this.moveCursor(22);
    var path_length = obj.path_len;
    obj.path = [];

    for (let i = 0; i < path_length; i++) {
      obj.path.push(this.readSTR());
    }

    return obj;
  }

  reply_writeGetFontPath(obj) {
    obj.path_len = obj.path.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.path_len);
    this.moveCursor(22);
    var path_length = obj.path_len;

    for (let val of obj.path) {
      this.writeSTR(val);
    }
  }

  request_readCreatePixmap() {
    var obj = {};
    obj.depth = this.readCARD8();
    this.moveCursor(2);
    obj.pid = this.readPIXMAP();
    obj.drawable = this.readDRAWABLE();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  request_writeCreatePixmap(obj) {
    this.writeCARD8(obj.depth);
    this.moveCursor(2);
    this.writePIXMAP(obj.pid);
    this.writeDRAWABLE(obj.drawable);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  request_readFreePixmap() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.pixmap = this.readPIXMAP();
    return obj;
  }

  request_writeFreePixmap(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writePIXMAP(obj.pixmap);
  }

  request_readCreateGC() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cid = this.readGCONTEXT();
    obj.drawable = this.readDRAWABLE();
    obj.value_mask = (new GCEnum()).decode(this.readCARD32());
    var value = new Map();
    obj.value = value;

    for (let field of obj.value_mask) {
      value.set(field, this.readCARD32());
    }

    return obj;
  }

  request_writeCreateGC(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeGCONTEXT(obj.cid);
    this.writeDRAWABLE(obj.drawable);
    var value = obj.value;
    var value_enum = new GCEnum(value.keys());
    this.writeCARD32(value_enum.encode());

    for (let field of value_enum) {
      this.writeCARD32(value.get(field));
    }
  }

  request_readChangeGC() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.gc = this.readGCONTEXT();
    obj.value_mask = (new GCEnum()).decode(this.readCARD32());
    var value = new Map();
    obj.value = value;

    for (let field of obj.value_mask) {
      value.set(field, this.readCARD32());
    }

    return obj;
  }

  request_writeChangeGC(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeGCONTEXT(obj.gc);
    var value = obj.value;
    var value_enum = new GCEnum(value.keys());
    this.writeCARD32(value_enum.encode());

    for (let field of value_enum) {
      this.writeCARD32(value.get(field));
    }
  }

  request_readCopyGC() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.src_gc = this.readGCONTEXT();
    obj.dst_gc = this.readGCONTEXT();
    obj.value_mask = this.readCARD32();
    return obj;
  }

  request_writeCopyGC(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeGCONTEXT(obj.src_gc);
    this.writeGCONTEXT(obj.dst_gc);
    this.writeCARD32(obj.value_mask);
  }

  request_readSetDashes() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.gc = this.readGCONTEXT();
    obj.dash_offset = this.readCARD16();
    obj.dashes_len = this.readCARD16();
    var dashes_length = obj.dashes_len;
    obj.dashes = [];

    for (let i = 0; i < dashes_length; i++) {
      obj.dashes.push(this.readCARD8());
    }

    return obj;
  }

  request_writeSetDashes(obj) {
    obj.dashes_len = obj.dashes.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeGCONTEXT(obj.gc);
    this.writeCARD16(obj.dash_offset);
    this.writeCARD16(obj.dashes_len);
    var dashes_length = obj.dashes_len;

    for (let val of obj.dashes) {
      this.writeCARD8(val);
    }
  }

  request_readSetClipRectangles() {
    var obj = {};
    obj.ordering = this.readBYTE();
    this.moveCursor(2);
    obj.gc = this.readGCONTEXT();
    obj.clip_x_origin = this.readINT16();
    obj.clip_y_origin = this.readINT16();
    obj.rectangles = [];

    while (this.cursor < this.length) {
      obj.rectangles.push(this.readRECTANGLE());
    }

    return obj;
  }

  request_writeSetClipRectangles(obj) {
    obj.rectangles_len = obj.rectangles.length;
    this.writeBYTE(obj.ordering);
    this.moveCursor(2);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.clip_x_origin);
    this.writeINT16(obj.clip_y_origin);
    var rectangles_length;

    for (let val of obj.rectangles) {
      this.writeRECTANGLE(val);
    }
  }

  request_readFreeGC() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.gc = this.readGCONTEXT();
    return obj;
  }

  request_writeFreeGC(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeGCONTEXT(obj.gc);
  }

  request_readClearArea() {
    var obj = {};
    obj.exposures = this.readBOOL();
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  request_writeClearArea(obj) {
    this.writeBOOL(obj.exposures);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  request_readCopyArea() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.src_drawable = this.readDRAWABLE();
    obj.dst_drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.src_x = this.readINT16();
    obj.src_y = this.readINT16();
    obj.dst_x = this.readINT16();
    obj.dst_y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  request_writeCopyArea(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.src_drawable);
    this.writeDRAWABLE(obj.dst_drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.src_x);
    this.writeINT16(obj.src_y);
    this.writeINT16(obj.dst_x);
    this.writeINT16(obj.dst_y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  request_readCopyPlane() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.src_drawable = this.readDRAWABLE();
    obj.dst_drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.src_x = this.readINT16();
    obj.src_y = this.readINT16();
    obj.dst_x = this.readINT16();
    obj.dst_y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.bit_plane = this.readCARD32();
    return obj;
  }

  request_writeCopyPlane(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.src_drawable);
    this.writeDRAWABLE(obj.dst_drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.src_x);
    this.writeINT16(obj.src_y);
    this.writeINT16(obj.dst_x);
    this.writeINT16(obj.dst_y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD32(obj.bit_plane);
  }

  request_readPolyPoint() {
    var obj = {};
    obj.coordinate_mode = this.readBYTE();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.points = [];

    while (this.cursor < this.length) {
      obj.points.push(this.readPOINT());
    }

    return obj;
  }

  request_writePolyPoint(obj) {
    obj.points_len = obj.points.length;
    this.writeBYTE(obj.coordinate_mode);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var points_length;

    for (let val of obj.points) {
      this.writePOINT(val);
    }
  }

  request_readPolyLine() {
    var obj = {};
    obj.coordinate_mode = this.readBYTE();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.points = [];

    while (this.cursor < this.length) {
      obj.points.push(this.readPOINT());
    }

    return obj;
  }

  request_writePolyLine(obj) {
    obj.points_len = obj.points.length;
    this.writeBYTE(obj.coordinate_mode);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var points_length;

    for (let val of obj.points) {
      this.writePOINT(val);
    }
  }

  request_readPolySegment() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.segments = [];

    while (this.cursor < this.length) {
      obj.segments.push(this.readSEGMENT());
    }

    return obj;
  }

  request_writePolySegment(obj) {
    obj.segments_len = obj.segments.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var segments_length;

    for (let val of obj.segments) {
      this.writeSEGMENT(val);
    }
  }

  request_readPolyRectangle() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.rectangles = [];

    while (this.cursor < this.length) {
      obj.rectangles.push(this.readRECTANGLE());
    }

    return obj;
  }

  request_writePolyRectangle(obj) {
    obj.rectangles_len = obj.rectangles.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var rectangles_length;

    for (let val of obj.rectangles) {
      this.writeRECTANGLE(val);
    }
  }

  request_readPolyArc() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.arcs = [];

    while (this.cursor < this.length) {
      obj.arcs.push(this.readARC());
    }

    return obj;
  }

  request_writePolyArc(obj) {
    obj.arcs_len = obj.arcs.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var arcs_length;

    for (let val of obj.arcs) {
      this.writeARC(val);
    }
  }

  request_readFillPoly() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.shape = this.readCARD8();
    obj.coordinate_mode = this.readCARD8();
    this.moveCursor(2);
    obj.points = [];

    while (this.cursor < this.length) {
      obj.points.push(this.readPOINT());
    }

    return obj;
  }

  request_writeFillPoly(obj) {
    obj.points_len = obj.points.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeCARD8(obj.shape);
    this.writeCARD8(obj.coordinate_mode);
    this.moveCursor(2);
    var points_length;

    for (let val of obj.points) {
      this.writePOINT(val);
    }
  }

  request_readPolyFillRectangle() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.rectangles = [];

    while (this.cursor < this.length) {
      obj.rectangles.push(this.readRECTANGLE());
    }

    return obj;
  }

  request_writePolyFillRectangle(obj) {
    obj.rectangles_len = obj.rectangles.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var rectangles_length;

    for (let val of obj.rectangles) {
      this.writeRECTANGLE(val);
    }
  }

  request_readPolyFillArc() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.arcs = [];

    while (this.cursor < this.length) {
      obj.arcs.push(this.readARC());
    }

    return obj;
  }

  request_writePolyFillArc(obj) {
    obj.arcs_len = obj.arcs.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    var arcs_length;

    for (let val of obj.arcs) {
      this.writeARC(val);
    }
  }

  request_readPutImage() {
    var obj = {};
    obj.format = this.readCARD8();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.dst_x = this.readINT16();
    obj.dst_y = this.readINT16();
    obj.left_pad = this.readCARD8();
    obj.depth = this.readCARD8();
    this.moveCursor(2);
    obj.data = [];

    while (this.cursor < this.length) {
      obj.data.push(this.readBYTE());
    }

    return obj;
  }

  request_writePutImage(obj) {
    obj.data_len = obj.data.length;
    this.writeCARD8(obj.format);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeINT16(obj.dst_x);
    this.writeINT16(obj.dst_y);
    this.writeCARD8(obj.left_pad);
    this.writeCARD8(obj.depth);
    this.moveCursor(2);
    var data_length;

    for (let val of obj.data) {
      this.writeBYTE(val);
    }
  }

  request_readGetImage() {
    var obj = {};
    obj.format = this.readCARD8();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    obj.plane_mask = this.readCARD32();
    return obj;
  }

  request_writeGetImage(obj) {
    this.writeCARD8(obj.format);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
    this.writeCARD32(obj.plane_mask);
  }

  reply_readGetImage() {
    var obj = {};
    obj.depth = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.visual = this.readVISUALID();
    this.moveCursor(20);
    var data_length = (obj.length * 4);
    obj.data = [];

    for (let i = 0; i < data_length; i++) {
      obj.data.push(this.readBYTE());
    }

    return obj;
  }

  reply_writeGetImage(obj) {
    obj.data_len = obj.data.length;
    this.writeCARD8(obj.depth);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeVISUALID(obj.visual);
    this.moveCursor(20);
    var data_length = (obj.length * 4);

    for (let val of obj.data) {
      this.writeBYTE(val);
    }
  }

  request_readPolyText8() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.items = [];

    while (this.cursor < this.length) {
      obj.items.push(this.readBYTE());
    }

    return obj;
  }

  request_writePolyText8(obj) {
    obj.items_len = obj.items.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    var items_length;

    for (let val of obj.items) {
      this.writeBYTE(val);
    }
  }

  request_readPolyText16() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    obj.items = [];

    while (this.cursor < this.length) {
      obj.items.push(this.readBYTE());
    }

    return obj;
  }

  request_writePolyText16(obj) {
    obj.items_len = obj.items.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    var items_length;

    for (let val of obj.items) {
      this.writeBYTE(val);
    }
  }

  request_readImageText8() {
    var obj = {};
    obj.string_len = this.readBYTE();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    var string_length = obj.string_len;
    obj.string = [];

    for (let i = 0; i < string_length; i++) {
      obj.string.push(this.readchar());
    }

    obj.string = obj.string.join("");
    return obj;
  }

  request_writeImageText8(obj) {
    obj.string_len = obj.string.length;
    this.writeBYTE(obj.string_len);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    var string_length = obj.string_len;

    for (let val of obj.string) {
      this.writechar(val);
    }
  }

  request_readImageText16() {
    var obj = {};
    obj.string_len = this.readBYTE();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.gc = this.readGCONTEXT();
    obj.x = this.readINT16();
    obj.y = this.readINT16();
    var string_length = obj.string_len;
    obj.string = [];

    for (let i = 0; i < string_length; i++) {
      obj.string.push(this.readCHAR2B());
    }

    return obj;
  }

  request_writeImageText16(obj) {
    obj.string_len = obj.string.length;
    this.writeBYTE(obj.string_len);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeGCONTEXT(obj.gc);
    this.writeINT16(obj.x);
    this.writeINT16(obj.y);
    var string_length = obj.string_len;

    for (let val of obj.string) {
      this.writeCHAR2B(val);
    }
  }

  request_readCreateColormap() {
    var obj = {};
    obj.alloc = this.readBYTE();
    this.moveCursor(2);
    obj.mid = this.readCOLORMAP();
    obj.window = this.readWINDOW();
    obj.visual = this.readVISUALID();
    return obj;
  }

  request_writeCreateColormap(obj) {
    this.writeBYTE(obj.alloc);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.mid);
    this.writeWINDOW(obj.window);
    this.writeVISUALID(obj.visual);
  }

  request_readFreeColormap() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    return obj;
  }

  request_writeFreeColormap(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
  }

  request_readCopyColormapAndFree() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.mid = this.readCOLORMAP();
    obj.src_cmap = this.readCOLORMAP();
    return obj;
  }

  request_writeCopyColormapAndFree(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.mid);
    this.writeCOLORMAP(obj.src_cmap);
  }

  request_readInstallColormap() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    return obj;
  }

  request_writeInstallColormap(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
  }

  request_readUninstallColormap() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    return obj;
  }

  request_writeUninstallColormap(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
  }

  request_readListInstalledColormaps() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    return obj;
  }

  request_writeListInstalledColormaps(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
  }

  reply_readListInstalledColormaps() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.cmaps_len = this.readCARD16();
    this.moveCursor(22);
    var cmaps_length = obj.cmaps_len;
    obj.cmaps = [];

    for (let i = 0; i < cmaps_length; i++) {
      obj.cmaps.push(this.readCOLORMAP());
    }

    return obj;
  }

  reply_writeListInstalledColormaps(obj) {
    obj.cmaps_len = obj.cmaps.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.cmaps_len);
    this.moveCursor(22);
    var cmaps_length = obj.cmaps_len;

    for (let val of obj.cmaps) {
      this.writeCOLORMAP(val);
    }
  }

  request_readAllocColor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.red = this.readCARD16();
    obj.green = this.readCARD16();
    obj.blue = this.readCARD16();
    this.moveCursor(2);
    return obj;
  }

  request_writeAllocColor(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD16(obj.red);
    this.writeCARD16(obj.green);
    this.writeCARD16(obj.blue);
    this.moveCursor(2);
  }

  reply_readAllocColor() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.red = this.readCARD16();
    obj.green = this.readCARD16();
    obj.blue = this.readCARD16();
    this.moveCursor(2);
    obj.pixel = this.readCARD32();
    return obj;
  }

  reply_writeAllocColor(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.red);
    this.writeCARD16(obj.green);
    this.writeCARD16(obj.blue);
    this.moveCursor(2);
    this.writeCARD32(obj.pixel);
  }

  request_readAllocNamedColor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.name_len = this.readCARD16();
    this.moveCursor(2);
    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  request_writeAllocNamedColor(obj) {
    obj.name_len = obj.name.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD16(obj.name_len);
    this.moveCursor(2);
    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  reply_readAllocNamedColor() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.pixel = this.readCARD32();
    obj.exact_red = this.readCARD16();
    obj.exact_green = this.readCARD16();
    obj.exact_blue = this.readCARD16();
    obj.visual_red = this.readCARD16();
    obj.visual_green = this.readCARD16();
    obj.visual_blue = this.readCARD16();
    return obj;
  }

  reply_writeAllocNamedColor(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD32(obj.pixel);
    this.writeCARD16(obj.exact_red);
    this.writeCARD16(obj.exact_green);
    this.writeCARD16(obj.exact_blue);
    this.writeCARD16(obj.visual_red);
    this.writeCARD16(obj.visual_green);
    this.writeCARD16(obj.visual_blue);
  }

  request_readAllocColorCells() {
    var obj = {};
    obj.contiguous = this.readBOOL();
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.colors = this.readCARD16();
    obj.planes = this.readCARD16();
    return obj;
  }

  request_writeAllocColorCells(obj) {
    this.writeBOOL(obj.contiguous);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD16(obj.colors);
    this.writeCARD16(obj.planes);
  }

  reply_readAllocColorCells() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.pixels_len = this.readCARD16();
    obj.masks_len = this.readCARD16();
    this.moveCursor(20);
    var pixels_length = obj.pixels_len;
    obj.pixels = [];

    for (let i = 0; i < pixels_length; i++) {
      obj.pixels.push(this.readCARD32());
    }

    var masks_length = obj.masks_len;
    obj.masks = [];

    for (let i = 0; i < masks_length; i++) {
      obj.masks.push(this.readCARD32());
    }

    return obj;
  }

  reply_writeAllocColorCells(obj) {
    obj.pixels_len = obj.pixels.length;
    obj.masks_len = obj.masks.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.pixels_len);
    this.writeCARD16(obj.masks_len);
    this.moveCursor(20);
    var pixels_length = obj.pixels_len;

    for (let val of obj.pixels) {
      this.writeCARD32(val);
    }

    var masks_length = obj.masks_len;

    for (let val of obj.masks) {
      this.writeCARD32(val);
    }
  }

  request_readAllocColorPlanes() {
    var obj = {};
    obj.contiguous = this.readBOOL();
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.colors = this.readCARD16();
    obj.reds = this.readCARD16();
    obj.greens = this.readCARD16();
    obj.blues = this.readCARD16();
    return obj;
  }

  request_writeAllocColorPlanes(obj) {
    this.writeBOOL(obj.contiguous);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD16(obj.colors);
    this.writeCARD16(obj.reds);
    this.writeCARD16(obj.greens);
    this.writeCARD16(obj.blues);
  }

  reply_readAllocColorPlanes() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.pixels_len = this.readCARD16();
    this.moveCursor(2);
    obj.red_mask = this.readCARD32();
    obj.green_mask = this.readCARD32();
    obj.blue_mask = this.readCARD32();
    this.moveCursor(8);
    var pixels_length = obj.pixels_len;
    obj.pixels = [];

    for (let i = 0; i < pixels_length; i++) {
      obj.pixels.push(this.readCARD32());
    }

    return obj;
  }

  reply_writeAllocColorPlanes(obj) {
    obj.pixels_len = obj.pixels.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.pixels_len);
    this.moveCursor(2);
    this.writeCARD32(obj.red_mask);
    this.writeCARD32(obj.green_mask);
    this.writeCARD32(obj.blue_mask);
    this.moveCursor(8);
    var pixels_length = obj.pixels_len;

    for (let val of obj.pixels) {
      this.writeCARD32(val);
    }
  }

  request_readFreeColors() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.plane_mask = this.readCARD32();
    obj.pixels = [];

    while (this.cursor < this.length) {
      obj.pixels.push(this.readCARD32());
    }

    return obj;
  }

  request_writeFreeColors(obj) {
    obj.pixels_len = obj.pixels.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD32(obj.plane_mask);
    var pixels_length;

    for (let val of obj.pixels) {
      this.writeCARD32(val);
    }
  }

  request_readStoreColors() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.items = [];

    while (this.cursor < this.length) {
      obj.items.push(this.readCOLORITEM());
    }

    return obj;
  }

  request_writeStoreColors(obj) {
    obj.items_len = obj.items.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    var items_length;

    for (let val of obj.items) {
      this.writeCOLORITEM(val);
    }
  }

  request_readStoreNamedColor() {
    var obj = {};
    obj.flags = this.readCARD8();
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.pixel = this.readCARD32();
    obj.name_len = this.readCARD16();
    this.moveCursor(2);
    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  request_writeStoreNamedColor(obj) {
    obj.name_len = obj.name.length;
    this.writeCARD8(obj.flags);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD32(obj.pixel);
    this.writeCARD16(obj.name_len);
    this.moveCursor(2);
    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  request_readQueryColors() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.pixels = [];

    while (this.cursor < this.length) {
      obj.pixels.push(this.readCARD32());
    }

    return obj;
  }

  request_writeQueryColors(obj) {
    obj.pixels_len = obj.pixels.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    var pixels_length;

    for (let val of obj.pixels) {
      this.writeCARD32(val);
    }
  }

  reply_readQueryColors() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.colors_len = this.readCARD16();
    this.moveCursor(22);
    var colors_length = obj.colors_len;
    obj.colors = [];

    for (let i = 0; i < colors_length; i++) {
      obj.colors.push(this.readRGB());
    }

    return obj;
  }

  reply_writeQueryColors(obj) {
    obj.colors_len = obj.colors.length;
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.colors_len);
    this.moveCursor(22);
    var colors_length = obj.colors_len;

    for (let val of obj.colors) {
      this.writeRGB(val);
    }
  }

  request_readLookupColor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cmap = this.readCOLORMAP();
    obj.name_len = this.readCARD16();
    this.moveCursor(2);
    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  request_writeLookupColor(obj) {
    obj.name_len = obj.name.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCOLORMAP(obj.cmap);
    this.writeCARD16(obj.name_len);
    this.moveCursor(2);
    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  reply_readLookupColor() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.exact_red = this.readCARD16();
    obj.exact_green = this.readCARD16();
    obj.exact_blue = this.readCARD16();
    obj.visual_red = this.readCARD16();
    obj.visual_green = this.readCARD16();
    obj.visual_blue = this.readCARD16();
    return obj;
  }

  reply_writeLookupColor(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.exact_red);
    this.writeCARD16(obj.exact_green);
    this.writeCARD16(obj.exact_blue);
    this.writeCARD16(obj.visual_red);
    this.writeCARD16(obj.visual_green);
    this.writeCARD16(obj.visual_blue);
  }

  request_readCreateCursor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cid = this.readCURSOR();
    obj.source = this.readPIXMAP();
    obj.mask = this.readPIXMAP();
    obj.fore_red = this.readCARD16();
    obj.fore_green = this.readCARD16();
    obj.fore_blue = this.readCARD16();
    obj.back_red = this.readCARD16();
    obj.back_green = this.readCARD16();
    obj.back_blue = this.readCARD16();
    obj.x = this.readCARD16();
    obj.y = this.readCARD16();
    return obj;
  }

  request_writeCreateCursor(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCURSOR(obj.cid);
    this.writePIXMAP(obj.source);
    this.writePIXMAP(obj.mask);
    this.writeCARD16(obj.fore_red);
    this.writeCARD16(obj.fore_green);
    this.writeCARD16(obj.fore_blue);
    this.writeCARD16(obj.back_red);
    this.writeCARD16(obj.back_green);
    this.writeCARD16(obj.back_blue);
    this.writeCARD16(obj.x);
    this.writeCARD16(obj.y);
  }

  request_readCreateGlyphCursor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cid = this.readCURSOR();
    obj.source_font = this.readFONT();
    obj.mask_font = this.readFONT();
    obj.source_char = this.readCARD16();
    obj.mask_char = this.readCARD16();
    obj.fore_red = this.readCARD16();
    obj.fore_green = this.readCARD16();
    obj.fore_blue = this.readCARD16();
    obj.back_red = this.readCARD16();
    obj.back_green = this.readCARD16();
    obj.back_blue = this.readCARD16();
    return obj;
  }

  request_writeCreateGlyphCursor(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCURSOR(obj.cid);
    this.writeFONT(obj.source_font);
    this.writeFONT(obj.mask_font);
    this.writeCARD16(obj.source_char);
    this.writeCARD16(obj.mask_char);
    this.writeCARD16(obj.fore_red);
    this.writeCARD16(obj.fore_green);
    this.writeCARD16(obj.fore_blue);
    this.writeCARD16(obj.back_red);
    this.writeCARD16(obj.back_green);
    this.writeCARD16(obj.back_blue);
  }

  request_readFreeCursor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cursor = this.readCURSOR();
    return obj;
  }

  request_writeFreeCursor(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCURSOR(obj.cursor);
  }

  request_readRecolorCursor() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.cursor = this.readCURSOR();
    obj.fore_red = this.readCARD16();
    obj.fore_green = this.readCARD16();
    obj.fore_blue = this.readCARD16();
    obj.back_red = this.readCARD16();
    obj.back_green = this.readCARD16();
    obj.back_blue = this.readCARD16();
    return obj;
  }

  request_writeRecolorCursor(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCURSOR(obj.cursor);
    this.writeCARD16(obj.fore_red);
    this.writeCARD16(obj.fore_green);
    this.writeCARD16(obj.fore_blue);
    this.writeCARD16(obj.back_red);
    this.writeCARD16(obj.back_green);
    this.writeCARD16(obj.back_blue);
  }

  request_readQueryBestSize() {
    var obj = {};
    obj.class = this.readCARD8();
    this.moveCursor(2);
    obj.drawable = this.readDRAWABLE();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  request_writeQueryBestSize(obj) {
    this.writeCARD8(obj.class);
    this.moveCursor(2);
    this.writeDRAWABLE(obj.drawable);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  reply_readQueryBestSize() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.width = this.readCARD16();
    obj.height = this.readCARD16();
    return obj;
  }

  reply_writeQueryBestSize(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.width);
    this.writeCARD16(obj.height);
  }

  request_readQueryExtension() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.name_len = this.readCARD16();
    this.moveCursor(2);
    var name_length = obj.name_len;
    obj.name = [];

    for (let i = 0; i < name_length; i++) {
      obj.name.push(this.readchar());
    }

    obj.name = obj.name.join("");
    return obj;
  }

  request_writeQueryExtension(obj) {
    obj.name_len = obj.name.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCARD16(obj.name_len);
    this.moveCursor(2);
    var name_length = obj.name_len;

    for (let val of obj.name) {
      this.writechar(val);
    }
  }

  reply_readQueryExtension() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.present = this.readBOOL();
    obj.major_opcode = this.readCARD8();
    obj.first_event = this.readCARD8();
    obj.first_error = this.readCARD8();
    return obj;
  }

  reply_writeQueryExtension(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeBOOL(obj.present);
    this.writeCARD8(obj.major_opcode);
    this.writeCARD8(obj.first_event);
    this.writeCARD8(obj.first_error);
  }

  request_readListExtensions() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeListExtensions(obj) {
    this.moveCursor(2);
  }

  reply_readListExtensions() {
    var obj = {};
    obj.names_len = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    this.moveCursor(24);
    var names_length = obj.names_len;
    obj.names = [];

    for (let i = 0; i < names_length; i++) {
      obj.names.push(this.readSTR());
    }

    return obj;
  }

  reply_writeListExtensions(obj) {
    obj.names_len = obj.names.length;
    this.writeCARD8(obj.names_len);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.moveCursor(24);
    var names_length = obj.names_len;

    for (let val of obj.names) {
      this.writeSTR(val);
    }
  }

  request_readChangeKeyboardMapping() {
    var obj = {};
    obj.keycode_count = this.readCARD8();
    this.moveCursor(2);
    obj.first_keycode = this.readKEYCODE();
    obj.keysyms_per_keycode = this.readCARD8();
    this.moveCursor(2);
    var keysyms_length = (obj.keycode_count * obj.keysyms_per_keycode);
    obj.keysyms = [];

    for (let i = 0; i < keysyms_length; i++) {
      obj.keysyms.push(this.readKEYSYM());
    }

    return obj;
  }

  request_writeChangeKeyboardMapping(obj) {
    obj.keysyms_len = obj.keysyms.length;
    this.writeCARD8(obj.keycode_count);
    this.moveCursor(2);
    this.writeKEYCODE(obj.first_keycode);
    this.writeCARD8(obj.keysyms_per_keycode);
    this.moveCursor(2);
    var keysyms_length = (obj.keycode_count * obj.keysyms_per_keycode);

    for (let val of obj.keysyms) {
      this.writeKEYSYM(val);
    }
  }

  request_readGetKeyboardMapping() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.first_keycode = this.readKEYCODE();
    obj.count = this.readCARD8();
    return obj;
  }

  request_writeGetKeyboardMapping(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeKEYCODE(obj.first_keycode);
    this.writeCARD8(obj.count);
  }

  reply_readGetKeyboardMapping() {
    var obj = {};
    obj.keysyms_per_keycode = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    this.moveCursor(24);
    var keysyms_length = obj.length;
    obj.keysyms = [];

    for (let i = 0; i < keysyms_length; i++) {
      obj.keysyms.push(this.readKEYSYM());
    }

    return obj;
  }

  reply_writeGetKeyboardMapping(obj) {
    obj.keysyms_len = obj.keysyms.length;
    this.writeBYTE(obj.keysyms_per_keycode);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.moveCursor(24);
    var keysyms_length = obj.length;

    for (let val of obj.keysyms) {
      this.writeKEYSYM(val);
    }
  }

  request_readChangeKeyboardControl() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.value_mask = (new KBEnum()).decode(this.readCARD32());
    var value = new Map();
    obj.value = value;

    for (let field of obj.value_mask) {
      value.set(field, this.readCARD32());
    }

    return obj;
  }

  request_writeChangeKeyboardControl(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    var value = obj.value;
    var value_enum = new KBEnum(value.keys());
    this.writeCARD32(value_enum.encode());

    for (let field of value_enum) {
      this.writeCARD32(value.get(field));
    }
  }

  request_readGetKeyboardControl() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetKeyboardControl(obj) {
    this.moveCursor(2);
  }

  reply_readGetKeyboardControl() {
    var obj = {};
    obj.global_auto_repeat = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.led_mask = this.readCARD32();
    obj.key_click_percent = this.readCARD8();
    obj.bell_percent = this.readCARD8();
    obj.bell_pitch = this.readCARD16();
    obj.bell_duration = this.readCARD16();
    this.moveCursor(2);
    var auto_repeats_length = 32;
    obj.auto_repeats = [];

    for (let i = 0; i < auto_repeats_length; i++) {
      obj.auto_repeats.push(this.readCARD8());
    }

    return obj;
  }

  reply_writeGetKeyboardControl(obj) {
    obj.auto_repeats_len = obj.auto_repeats.length;
    this.writeBYTE(obj.global_auto_repeat);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD32(obj.led_mask);
    this.writeCARD8(obj.key_click_percent);
    this.writeCARD8(obj.bell_percent);
    this.writeCARD16(obj.bell_pitch);
    this.writeCARD16(obj.bell_duration);
    this.moveCursor(2);
    var auto_repeats_length = 32;

    for (let val of obj.auto_repeats) {
      this.writeCARD8(val);
    }
  }

  request_readBell() {
    var obj = {};
    obj.percent = this.readINT8();
    this.moveCursor(2);
    return obj;
  }

  request_writeBell(obj) {
    this.writeINT8(obj.percent);
    this.moveCursor(2);
  }

  request_readChangePointerControl() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.acceleration_numerator = this.readINT16();
    obj.acceleration_denominator = this.readINT16();
    obj.threshold = this.readINT16();
    obj.do_acceleration = this.readBOOL();
    obj.do_threshold = this.readBOOL();
    return obj;
  }

  request_writeChangePointerControl(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeINT16(obj.acceleration_numerator);
    this.writeINT16(obj.acceleration_denominator);
    this.writeINT16(obj.threshold);
    this.writeBOOL(obj.do_acceleration);
    this.writeBOOL(obj.do_threshold);
  }

  request_readGetPointerControl() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetPointerControl(obj) {
    this.moveCursor(2);
  }

  reply_readGetPointerControl() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.acceleration_numerator = this.readCARD16();
    obj.acceleration_denominator = this.readCARD16();
    obj.threshold = this.readCARD16();
    this.moveCursor(18);
    return obj;
  }

  reply_writeGetPointerControl(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.acceleration_numerator);
    this.writeCARD16(obj.acceleration_denominator);
    this.writeCARD16(obj.threshold);
    this.moveCursor(18);
  }

  request_readSetScreenSaver() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.timeout = this.readINT16();
    obj.interval = this.readINT16();
    obj.prefer_blanking = this.readCARD8();
    obj.allow_exposures = this.readCARD8();
    return obj;
  }

  request_writeSetScreenSaver(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeINT16(obj.timeout);
    this.writeINT16(obj.interval);
    this.writeCARD8(obj.prefer_blanking);
    this.writeCARD8(obj.allow_exposures);
  }

  request_readGetScreenSaver() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetScreenSaver(obj) {
    this.moveCursor(2);
  }

  reply_readGetScreenSaver() {
    var obj = {};
    this.moveCursor(1);
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.timeout = this.readCARD16();
    obj.interval = this.readCARD16();
    obj.prefer_blanking = this.readBYTE();
    obj.allow_exposures = this.readBYTE();
    this.moveCursor(18);
    return obj;
  }

  reply_writeGetScreenSaver(obj) {
    this.moveCursor(1);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.timeout);
    this.writeCARD16(obj.interval);
    this.writeBYTE(obj.prefer_blanking);
    this.writeBYTE(obj.allow_exposures);
    this.moveCursor(18);
  }

  request_readChangeHosts() {
    var obj = {};
    obj.mode = this.readCARD8();
    this.moveCursor(2);
    obj.family = this.readCARD8();
    this.moveCursor(1);
    obj.address_len = this.readCARD16();
    var address_length = obj.address_len;
    obj.address = [];

    for (let i = 0; i < address_length; i++) {
      obj.address.push(this.readBYTE());
    }

    return obj;
  }

  request_writeChangeHosts(obj) {
    obj.address_len = obj.address.length;
    this.writeCARD8(obj.mode);
    this.moveCursor(2);
    this.writeCARD8(obj.family);
    this.moveCursor(1);
    this.writeCARD16(obj.address_len);
    var address_length = obj.address_len;

    for (let val of obj.address) {
      this.writeBYTE(val);
    }
  }

  request_readListHosts() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeListHosts(obj) {
    this.moveCursor(2);
  }

  reply_readListHosts() {
    var obj = {};
    obj.mode = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    obj.hosts_len = this.readCARD16();
    this.moveCursor(22);
    var hosts_length = obj.hosts_len;
    obj.hosts = [];

    for (let i = 0; i < hosts_length; i++) {
      obj.hosts.push(this.readHOST());
    }

    return obj;
  }

  reply_writeListHosts(obj) {
    obj.hosts_len = obj.hosts.length;
    this.writeBYTE(obj.mode);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.writeCARD16(obj.hosts_len);
    this.moveCursor(22);
    var hosts_length = obj.hosts_len;

    for (let val of obj.hosts) {
      this.writeHOST(val);
    }
  }

  request_readSetAccessControl() {
    var obj = {};
    obj.mode = this.readCARD8();
    this.moveCursor(2);
    return obj;
  }

  request_writeSetAccessControl(obj) {
    this.writeCARD8(obj.mode);
    this.moveCursor(2);
  }

  request_readSetCloseDownMode() {
    var obj = {};
    obj.mode = this.readCARD8();
    this.moveCursor(2);
    return obj;
  }

  request_writeSetCloseDownMode(obj) {
    this.writeCARD8(obj.mode);
    this.moveCursor(2);
  }

  request_readKillClient() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.resource = this.readCARD32();
    return obj;
  }

  request_writeKillClient(obj) {
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeCARD32(obj.resource);
  }

  request_readRotateProperties() {
    var obj = {};
    this.moveCursor(1);
    this.moveCursor(2);
    obj.window = this.readWINDOW();
    obj.atoms_len = this.readCARD16();
    obj.delta = this.readINT16();
    var atoms_length = obj.atoms_len;
    obj.atoms = [];

    for (let i = 0; i < atoms_length; i++) {
      obj.atoms.push(this.readATOM());
    }

    return obj;
  }

  request_writeRotateProperties(obj) {
    obj.atoms_len = obj.atoms.length;
    this.moveCursor(1);
    this.moveCursor(2);
    this.writeWINDOW(obj.window);
    this.writeCARD16(obj.atoms_len);
    this.writeINT16(obj.delta);
    var atoms_length = obj.atoms_len;

    for (let val of obj.atoms) {
      this.writeATOM(val);
    }
  }

  request_readForceScreenSaver() {
    var obj = {};
    obj.mode = this.readCARD8();
    this.moveCursor(2);
    return obj;
  }

  request_writeForceScreenSaver(obj) {
    this.writeCARD8(obj.mode);
    this.moveCursor(2);
  }

  request_readSetPointerMapping() {
    var obj = {};
    obj.map_len = this.readCARD8();
    this.moveCursor(2);
    var map_length = obj.map_len;
    obj.map = [];

    for (let i = 0; i < map_length; i++) {
      obj.map.push(this.readCARD8());
    }

    return obj;
  }

  request_writeSetPointerMapping(obj) {
    obj.map_len = obj.map.length;
    this.writeCARD8(obj.map_len);
    this.moveCursor(2);
    var map_length = obj.map_len;

    for (let val of obj.map) {
      this.writeCARD8(val);
    }
  }

  reply_readSetPointerMapping() {
    var obj = {};
    obj.status = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    return obj;
  }

  reply_writeSetPointerMapping(obj) {
    this.writeBYTE(obj.status);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
  }

  request_readGetPointerMapping() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetPointerMapping(obj) {
    this.moveCursor(2);
  }

  reply_readGetPointerMapping() {
    var obj = {};
    obj.map_len = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    this.moveCursor(24);
    var map_length = obj.map_len;
    obj.map = [];

    for (let i = 0; i < map_length; i++) {
      obj.map.push(this.readCARD8());
    }

    return obj;
  }

  reply_writeGetPointerMapping(obj) {
    obj.map_len = obj.map.length;
    this.writeCARD8(obj.map_len);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.moveCursor(24);
    var map_length = obj.map_len;

    for (let val of obj.map) {
      this.writeCARD8(val);
    }
  }

  request_readSetModifierMapping() {
    var obj = {};
    obj.keycodes_per_modifier = this.readCARD8();
    this.moveCursor(2);
    var keycodes_length = (obj.keycodes_per_modifier * 8);
    obj.keycodes = [];

    for (let i = 0; i < keycodes_length; i++) {
      obj.keycodes.push(this.readKEYCODE());
    }

    return obj;
  }

  request_writeSetModifierMapping(obj) {
    obj.keycodes_len = obj.keycodes.length;
    this.writeCARD8(obj.keycodes_per_modifier);
    this.moveCursor(2);
    var keycodes_length = (obj.keycodes_per_modifier * 8);

    for (let val of obj.keycodes) {
      this.writeKEYCODE(val);
    }
  }

  reply_readSetModifierMapping() {
    var obj = {};
    obj.status = this.readBYTE();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    return obj;
  }

  reply_writeSetModifierMapping(obj) {
    this.writeBYTE(obj.status);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
  }

  request_readGetModifierMapping() {
    var obj = {};
    this.moveCursor(2);
    return obj;
  }

  request_writeGetModifierMapping(obj) {
    this.moveCursor(2);
  }

  reply_readGetModifierMapping() {
    var obj = {};
    obj.keycodes_per_modifier = this.readCARD8();
    obj.sequence = this.readCARD16();
    obj.length = this.readCARD32();
    this.moveCursor(24);
    var keycodes_length = (obj.keycodes_per_modifier * 8);
    obj.keycodes = [];

    for (let i = 0; i < keycodes_length; i++) {
      obj.keycodes.push(this.readKEYCODE());
    }

    return obj;
  }

  reply_writeGetModifierMapping(obj) {
    obj.keycodes_len = obj.keycodes.length;
    this.writeCARD8(obj.keycodes_per_modifier);
    this.writeCARD16(obj.sequence);
    this.moveCursor(4);
    this.moveCursor(24);
    var keycodes_length = (obj.keycodes_per_modifier * 8);

    for (let val of obj.keycodes) {
      this.writeKEYCODE(val);
    }
  }

  request_readNoOperation() {
    return {};
  }

  request_writeNoOperation(obj) {}

  static request_opcodes = new Map([
    [1, "CreateWindow"],
    [2, "ChangeWindowAttributes"],
    [3, "GetWindowAttributes"],
    [4, "DestroyWindow"],
    [5, "DestroySubwindows"],
    [6, "ChangeSaveSet"],
    [7, "ReparentWindow"],
    [8, "MapWindow"],
    [9, "MapSubwindows"],
    [10, "UnmapWindow"],
    [11, "UnmapSubwindows"],
    [12, "ConfigureWindow"],
    [13, "CirculateWindow"],
    [14, "GetGeometry"],
    [15, "QueryTree"],
    [16, "InternAtom"],
    [17, "GetAtomName"],
    [18, "ChangeProperty"],
    [19, "DeleteProperty"],
    [20, "GetProperty"],
    [21, "ListProperties"],
    [22, "SetSelectionOwner"],
    [23, "GetSelectionOwner"],
    [24, "ConvertSelection"],
    [25, "SendEvent"],
    [26, "GrabPointer"],
    [27, "UngrabPointer"],
    [28, "GrabButton"],
    [29, "UngrabButton"],
    [30, "ChangeActivePointerGrab"],
    [31, "GrabKeyboard"],
    [32, "UngrabKeyboard"],
    [33, "GrabKey"],
    [34, "UngrabKey"],
    [35, "AllowEvents"],
    [36, "GrabServer"],
    [37, "UngrabServer"],
    [38, "QueryPointer"],
    [39, "GetMotionEvents"],
    [40, "TranslateCoordinates"],
    [41, "WarpPointer"],
    [42, "SetInputFocus"],
    [43, "GetInputFocus"],
    [44, "QueryKeymap"],
    [45, "OpenFont"],
    [46, "CloseFont"],
    [47, "QueryFont"],
    [48, "QueryTextExtents"],
    [49, "ListFonts"],
    [50, "ListFontsWithInfo"],
    [51, "SetFontPath"],
    [52, "GetFontPath"],
    [53, "CreatePixmap"],
    [54, "FreePixmap"],
    [55, "CreateGC"],
    [56, "ChangeGC"],
    [57, "CopyGC"],
    [58, "SetDashes"],
    [59, "SetClipRectangles"],
    [60, "FreeGC"],
    [61, "ClearArea"],
    [62, "CopyArea"],
    [63, "CopyPlane"],
    [64, "PolyPoint"],
    [65, "PolyLine"],
    [66, "PolySegment"],
    [67, "PolyRectangle"],
    [68, "PolyArc"],
    [69, "FillPoly"],
    [70, "PolyFillRectangle"],
    [71, "PolyFillArc"],
    [72, "PutImage"],
    [73, "GetImage"],
    [74, "PolyText8"],
    [75, "PolyText16"],
    [76, "ImageText8"],
    [77, "ImageText16"],
    [78, "CreateColormap"],
    [79, "FreeColormap"],
    [80, "CopyColormapAndFree"],
    [81, "InstallColormap"],
    [82, "UninstallColormap"],
    [83, "ListInstalledColormaps"],
    [84, "AllocColor"],
    [85, "AllocNamedColor"],
    [86, "AllocColorCells"],
    [87, "AllocColorPlanes"],
    [88, "FreeColors"],
    [89, "StoreColors"],
    [90, "StoreNamedColor"],
    [91, "QueryColors"],
    [92, "LookupColor"],
    [93, "CreateCursor"],
    [94, "CreateGlyphCursor"],
    [95, "FreeCursor"],
    [96, "RecolorCursor"],
    [97, "QueryBestSize"],
    [98, "QueryExtension"],
    [99, "ListExtensions"],
    [100, "ChangeKeyboardMapping"],
    [101, "GetKeyboardMapping"],
    [102, "ChangeKeyboardControl"],
    [103, "GetKeyboardControl"],
    [104, "Bell"],
    [105, "ChangePointerControl"],
    [106, "GetPointerControl"],
    [107, "SetScreenSaver"],
    [108, "GetScreenSaver"],
    [109, "ChangeHosts"],
    [110, "ListHosts"],
    [111, "SetAccessControl"],
    [112, "SetCloseDownMode"],
    [113, "KillClient"],
    [114, "RotateProperties"],
    [115, "ForceScreenSaver"],
    [116, "SetPointerMapping"],
    [117, "GetPointerMapping"],
    [118, "SetModifierMapping"],
    [119, "GetModifierMapping"],
    [127, "NoOperation"]
  ]);

  static request_fields = new Map([["CreateWindow", new Map([
    ["depth", "CARD8"],
    ["wid", "WINDOW"],
    ["parent", "WINDOW"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["width", "CARD16"],
    ["height", "CARD16"],
    ["border_width", "CARD16"],
    ["class", "CARD16"],
    ["visual", "VISUALID"],
    ["value", new Map([["CWEnum", "CARD32"]])]
  ])], [
    "ChangeWindowAttributes",
    new Map([["window", "WINDOW"], ["value", new Map([["CWEnum", "CARD32"]])]])
  ], ["GetWindowAttributes", new Map([["window", "WINDOW"]])], ["DestroyWindow", new Map([["window", "WINDOW"]])], ["DestroySubwindows", new Map([["window", "WINDOW"]])], ["ChangeSaveSet", new Map([["mode", "BYTE"], ["window", "WINDOW"]])], ["ReparentWindow", new Map(
    [["window", "WINDOW"], ["parent", "WINDOW"], ["x", "INT16"], ["y", "INT16"]]
  )], ["MapWindow", new Map([["window", "WINDOW"]])], ["MapSubwindows", new Map([["window", "WINDOW"]])], ["UnmapWindow", new Map([["window", "WINDOW"]])], ["UnmapSubwindows", new Map([["window", "WINDOW"]])], ["ConfigureWindow", new Map([
    ["window", "WINDOW"],
    ["value_mask", "CARD16"],
    ["value", new Map([["ConfigWindowEnum", "CARD32"]])]
  ])], ["CirculateWindow", new Map([["direction", "CARD8"], ["window", "WINDOW"]])], ["GetGeometry", new Map([["drawable", "DRAWABLE"]])], ["QueryTree", new Map([["window", "WINDOW"]])], [
    "InternAtom",
    new Map([["only_if_exists", "BOOL"], ["name_len", "CARD16"], ["name", "STRING8"]])
  ], ["GetAtomName", new Map([["atom", "ATOM"]])], ["ChangeProperty", new Map([
    ["mode", "CARD8"],
    ["window", "WINDOW"],
    ["property", "ATOM"],
    ["type", "ATOM"],
    ["format", "CARD8"],
    ["data_len", "CARD32"],
    ["data", ["void"]]
  ])], ["DeleteProperty", new Map([["window", "WINDOW"], ["property", "ATOM"]])], ["GetProperty", new Map([
    ["delete", "BOOL"],
    ["window", "WINDOW"],
    ["property", "ATOM"],
    ["type", "ATOM"],
    ["long_offset", "CARD32"],
    ["long_length", "CARD32"]
  ])], ["ListProperties", new Map([["window", "WINDOW"]])], [
    "SetSelectionOwner",
    new Map([["owner", "WINDOW"], ["selection", "ATOM"], ["time", "TIMESTAMP"]])
  ], ["GetSelectionOwner", new Map([["selection", "ATOM"]])], ["ConvertSelection", new Map([
    ["requestor", "WINDOW"],
    ["selection", "ATOM"],
    ["target", "ATOM"],
    ["property", "ATOM"],
    ["time", "TIMESTAMP"]
  ])], ["SendEvent", new Map([
    ["propagate", "BOOL"],
    ["destination", "WINDOW"],
    ["event_mask", "CARD32"],
    ["event", ["char"]]
  ])], ["GrabPointer", new Map([
    ["owner_events", "BOOL"],
    ["grab_window", "WINDOW"],
    ["event_mask", "CARD16"],
    ["pointer_mode", "BYTE"],
    ["keyboard_mode", "BYTE"],
    ["confine_to", "WINDOW"],
    ["cursor", "CURSOR"],
    ["time", "TIMESTAMP"]
  ])], ["UngrabPointer", new Map([["time", "TIMESTAMP"]])], ["GrabButton", new Map([
    ["owner_events", "BOOL"],
    ["grab_window", "WINDOW"],
    ["event_mask", "CARD16"],
    ["pointer_mode", "CARD8"],
    ["keyboard_mode", "CARD8"],
    ["confine_to", "WINDOW"],
    ["cursor", "CURSOR"],
    ["button", "CARD8"],
    ["modifiers", "CARD16"]
  ])], [
    "UngrabButton",
    new Map([["button", "CARD8"], ["grab_window", "WINDOW"], ["modifiers", "CARD16"]])
  ], [
    "ChangeActivePointerGrab",
    new Map([["cursor", "CURSOR"], ["time", "TIMESTAMP"], ["event_mask", "CARD16"]])
  ], ["GrabKeyboard", new Map([
    ["owner_events", "BOOL"],
    ["grab_window", "WINDOW"],
    ["time", "TIMESTAMP"],
    ["pointer_mode", "BYTE"],
    ["keyboard_mode", "BYTE"]
  ])], ["UngrabKeyboard", new Map([["time", "TIMESTAMP"]])], ["GrabKey", new Map([
    ["owner_events", "BOOL"],
    ["grab_window", "WINDOW"],
    ["modifiers", "CARD16"],
    ["key", "KEYCODE"],
    ["pointer_mode", "CARD8"],
    ["keyboard_mode", "CARD8"]
  ])], [
    "UngrabKey",
    new Map([["key", "KEYCODE"], ["grab_window", "WINDOW"], ["modifiers", "CARD16"]])
  ], ["AllowEvents", new Map([["mode", "CARD8"], ["time", "TIMESTAMP"]])], ["GrabServer", new Map([])], ["UngrabServer", new Map([])], ["QueryPointer", new Map([["window", "WINDOW"]])], [
    "GetMotionEvents",
    new Map([["window", "WINDOW"], ["start", "TIMESTAMP"], ["stop", "TIMESTAMP"]])
  ], ["TranslateCoordinates", new Map([
    ["src_window", "WINDOW"],
    ["dst_window", "WINDOW"],
    ["src_x", "INT16"],
    ["src_y", "INT16"]
  ])], ["WarpPointer", new Map([
    ["src_window", "WINDOW"],
    ["dst_window", "WINDOW"],
    ["src_x", "INT16"],
    ["src_y", "INT16"],
    ["src_width", "CARD16"],
    ["src_height", "CARD16"],
    ["dst_x", "INT16"],
    ["dst_y", "INT16"]
  ])], [
    "SetInputFocus",
    new Map([["revert_to", "CARD8"], ["focus", "WINDOW"], ["time", "TIMESTAMP"]])
  ], ["GetInputFocus", new Map([])], ["QueryKeymap", new Map([])], [
    "OpenFont",
    new Map([["fid", "FONT"], ["name_len", "CARD16"], ["name", ["char"]]])
  ], ["CloseFont", new Map([["font", "FONT"]])], ["QueryFont", new Map([["font", "FONTABLE"]])], [
    "QueryTextExtents",
    new Map([["font", "FONTABLE"], ["string", ["CHAR2B"]]])
  ], ["ListFonts", new Map(
    [["max_names", "CARD16"], ["pattern_len", "CARD16"], ["pattern", ["char"]]]
  )], ["ListFontsWithInfo", new Map(
    [["max_names", "CARD16"], ["pattern_len", "CARD16"], ["pattern", ["char"]]]
  )], ["SetFontPath", new Map([["font_qty", "CARD16"], ["font", ["STR"]]])], ["GetFontPath", new Map([])], ["CreatePixmap", new Map([
    ["depth", "CARD8"],
    ["pid", "PIXMAP"],
    ["drawable", "DRAWABLE"],
    ["width", "CARD16"],
    ["height", "CARD16"]
  ])], ["FreePixmap", new Map([["pixmap", "PIXMAP"]])], ["CreateGC", new Map([
    ["cid", "GCONTEXT"],
    ["drawable", "DRAWABLE"],
    ["value", new Map([["GCEnum", "CARD32"]])]
  ])], [
    "ChangeGC",
    new Map([["gc", "GCONTEXT"], ["value", new Map([["GCEnum", "CARD32"]])]])
  ], [
    "CopyGC",
    new Map([["src_gc", "GCONTEXT"], ["dst_gc", "GCONTEXT"], ["value_mask", "CARD32"]])
  ], ["SetDashes", new Map([
    ["gc", "GCONTEXT"],
    ["dash_offset", "CARD16"],
    ["dashes_len", "CARD16"],
    ["dashes", ["CARD8"]]
  ])], ["SetClipRectangles", new Map([
    ["ordering", "BYTE"],
    ["gc", "GCONTEXT"],
    ["clip_x_origin", "INT16"],
    ["clip_y_origin", "INT16"],
    ["rectangles", ["RECTANGLE"]]
  ])], ["FreeGC", new Map([["gc", "GCONTEXT"]])], ["ClearArea", new Map([
    ["exposures", "BOOL"],
    ["window", "WINDOW"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["width", "CARD16"],
    ["height", "CARD16"]
  ])], ["CopyArea", new Map([
    ["src_drawable", "DRAWABLE"],
    ["dst_drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["src_x", "INT16"],
    ["src_y", "INT16"],
    ["dst_x", "INT16"],
    ["dst_y", "INT16"],
    ["width", "CARD16"],
    ["height", "CARD16"]
  ])], ["CopyPlane", new Map([
    ["src_drawable", "DRAWABLE"],
    ["dst_drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["src_x", "INT16"],
    ["src_y", "INT16"],
    ["dst_x", "INT16"],
    ["dst_y", "INT16"],
    ["width", "CARD16"],
    ["height", "CARD16"],
    ["bit_plane", "CARD32"]
  ])], ["PolyPoint", new Map([
    ["coordinate_mode", "BYTE"],
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["points", ["POINT"]]
  ])], ["PolyLine", new Map([
    ["coordinate_mode", "BYTE"],
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["points", ["POINT"]]
  ])], [
    "PolySegment",
    new Map([["drawable", "DRAWABLE"], ["gc", "GCONTEXT"], ["segments", ["SEGMENT"]]])
  ], ["PolyRectangle", new Map([
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["rectangles", ["RECTANGLE"]]
  ])], [
    "PolyArc",
    new Map([["drawable", "DRAWABLE"], ["gc", "GCONTEXT"], ["arcs", ["ARC"]]])
  ], ["FillPoly", new Map([
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["shape", "CARD8"],
    ["coordinate_mode", "CARD8"],
    ["points", ["POINT"]]
  ])], ["PolyFillRectangle", new Map([
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["rectangles", ["RECTANGLE"]]
  ])], [
    "PolyFillArc",
    new Map([["drawable", "DRAWABLE"], ["gc", "GCONTEXT"], ["arcs", ["ARC"]]])
  ], ["PutImage", new Map([
    ["format", "CARD8"],
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["width", "CARD16"],
    ["height", "CARD16"],
    ["dst_x", "INT16"],
    ["dst_y", "INT16"],
    ["left_pad", "CARD8"],
    ["depth", "CARD8"],
    ["data", ["BYTE"]]
  ])], ["GetImage", new Map([
    ["format", "CARD8"],
    ["drawable", "DRAWABLE"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["width", "CARD16"],
    ["height", "CARD16"],
    ["plane_mask", "CARD32"]
  ])], ["PolyText8", new Map([
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["items", ["BYTE"]]
  ])], ["PolyText16", new Map([
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["items", ["BYTE"]]
  ])], ["ImageText8", new Map([
    ["string_len", "BYTE"],
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["string", ["char"]]
  ])], ["ImageText16", new Map([
    ["string_len", "BYTE"],
    ["drawable", "DRAWABLE"],
    ["gc", "GCONTEXT"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["string", ["CHAR2B"]]
  ])], ["CreateColormap", new Map([
    ["alloc", "BYTE"],
    ["mid", "COLORMAP"],
    ["window", "WINDOW"],
    ["visual", "VISUALID"]
  ])], ["FreeColormap", new Map([["cmap", "COLORMAP"]])], [
    "CopyColormapAndFree",
    new Map([["mid", "COLORMAP"], ["src_cmap", "COLORMAP"]])
  ], ["InstallColormap", new Map([["cmap", "COLORMAP"]])], ["UninstallColormap", new Map([["cmap", "COLORMAP"]])], ["ListInstalledColormaps", new Map([["window", "WINDOW"]])], ["AllocColor", new Map([
    ["cmap", "COLORMAP"],
    ["red", "CARD16"],
    ["green", "CARD16"],
    ["blue", "CARD16"]
  ])], [
    "AllocNamedColor",
    new Map([["cmap", "COLORMAP"], ["name_len", "CARD16"], ["name", ["char"]]])
  ], ["AllocColorCells", new Map([
    ["contiguous", "BOOL"],
    ["cmap", "COLORMAP"],
    ["colors", "CARD16"],
    ["planes", "CARD16"]
  ])], ["AllocColorPlanes", new Map([
    ["contiguous", "BOOL"],
    ["cmap", "COLORMAP"],
    ["colors", "CARD16"],
    ["reds", "CARD16"],
    ["greens", "CARD16"],
    ["blues", "CARD16"]
  ])], [
    "FreeColors",
    new Map([["cmap", "COLORMAP"], ["plane_mask", "CARD32"], ["pixels", ["CARD32"]]])
  ], ["StoreColors", new Map([["cmap", "COLORMAP"], ["items", ["COLORITEM"]]])], ["StoreNamedColor", new Map([
    ["flags", "CARD8"],
    ["cmap", "COLORMAP"],
    ["pixel", "CARD32"],
    ["name_len", "CARD16"],
    ["name", ["char"]]
  ])], ["QueryColors", new Map([["cmap", "COLORMAP"], ["pixels", ["CARD32"]]])], [
    "LookupColor",
    new Map([["cmap", "COLORMAP"], ["name_len", "CARD16"], ["name", ["char"]]])
  ], ["CreateCursor", new Map([
    ["cid", "CURSOR"],
    ["source", "PIXMAP"],
    ["mask", "PIXMAP"],
    ["fore_red", "CARD16"],
    ["fore_green", "CARD16"],
    ["fore_blue", "CARD16"],
    ["back_red", "CARD16"],
    ["back_green", "CARD16"],
    ["back_blue", "CARD16"],
    ["x", "CARD16"],
    ["y", "CARD16"]
  ])], ["CreateGlyphCursor", new Map([
    ["cid", "CURSOR"],
    ["source_font", "FONT"],
    ["mask_font", "FONT"],
    ["source_char", "CARD16"],
    ["mask_char", "CARD16"],
    ["fore_red", "CARD16"],
    ["fore_green", "CARD16"],
    ["fore_blue", "CARD16"],
    ["back_red", "CARD16"],
    ["back_green", "CARD16"],
    ["back_blue", "CARD16"]
  ])], ["FreeCursor", new Map([["cursor", "CURSOR"]])], ["RecolorCursor", new Map([
    ["cursor", "CURSOR"],
    ["fore_red", "CARD16"],
    ["fore_green", "CARD16"],
    ["fore_blue", "CARD16"],
    ["back_red", "CARD16"],
    ["back_green", "CARD16"],
    ["back_blue", "CARD16"]
  ])], ["QueryBestSize", new Map([
    ["class", "CARD8"],
    ["drawable", "DRAWABLE"],
    ["width", "CARD16"],
    ["height", "CARD16"]
  ])], ["QueryExtension", new Map([["name_len", "CARD16"], ["name", ["char"]]])], ["ListExtensions", new Map([])], ["ChangeKeyboardMapping", new Map([
    ["keycode_count", "CARD8"],
    ["first_keycode", "KEYCODE"],
    ["keysyms_per_keycode", "CARD8"],
    ["keysyms", ["KEYSYM"]]
  ])], [
    "GetKeyboardMapping",
    new Map([["first_keycode", "KEYCODE"], ["count", "CARD8"]])
  ], [
    "ChangeKeyboardControl",
    new Map([["value", new Map([["KBEnum", "CARD32"]])]])
  ], ["GetKeyboardControl", new Map([])], ["Bell", new Map([["percent", "INT8"]])], ["ChangePointerControl", new Map([
    ["acceleration_numerator", "INT16"],
    ["acceleration_denominator", "INT16"],
    ["threshold", "INT16"],
    ["do_acceleration", "BOOL"],
    ["do_threshold", "BOOL"]
  ])], ["GetPointerControl", new Map([])], ["SetScreenSaver", new Map([
    ["timeout", "INT16"],
    ["interval", "INT16"],
    ["prefer_blanking", "CARD8"],
    ["allow_exposures", "CARD8"]
  ])], ["GetScreenSaver", new Map([])], ["ChangeHosts", new Map([
    ["mode", "CARD8"],
    ["family", "CARD8"],
    ["address_len", "CARD16"],
    ["address", ["BYTE"]]
  ])], ["ListHosts", new Map([])], ["SetAccessControl", new Map([["mode", "CARD8"]])], ["SetCloseDownMode", new Map([["mode", "CARD8"]])], ["KillClient", new Map([["resource", "CARD32"]])], ["RotateProperties", new Map([
    ["window", "WINDOW"],
    ["atoms_len", "CARD16"],
    ["delta", "INT16"],
    ["atoms", ["ATOM"]]
  ])], ["ForceScreenSaver", new Map([["mode", "CARD8"]])], ["SetPointerMapping", new Map([["map_len", "CARD8"], ["map", ["CARD8"]]])], ["GetPointerMapping", new Map([])], [
    "SetModifierMapping",
    new Map([["keycodes_per_modifier", "CARD8"], ["keycodes", ["KEYCODE"]]])
  ], ["GetModifierMapping", new Map([])], ["NoOperation", new Map([])]]);

  static reply_fields = new Map([["GetWindowAttributes", new Map([
    ["backing_store", "CARD8"],
    ["visual", "VISUALID"],
    ["class", "CARD16"],
    ["bit_gravity", "CARD8"],
    ["win_gravity", "CARD8"],
    ["backing_planes", "CARD32"],
    ["backing_pixel", "CARD32"],
    ["save_under", "BOOL"],
    ["map_is_installed", "BOOL"],
    ["map_state", "CARD8"],
    ["override_redirect", "BOOL"],
    ["colormap", "COLORMAP"],
    ["all_event_masks", "CARD32"],
    ["your_event_mask", "CARD32"],
    ["do_not_propagate_mask", "CARD16"]
  ])], ["GetGeometry", new Map([
    ["depth", "CARD8"],
    ["root", "WINDOW"],
    ["x", "INT16"],
    ["y", "INT16"],
    ["width", "CARD16"],
    ["height", "CARD16"],
    ["border_width", "CARD16"]
  ])], ["QueryTree", new Map([
    ["root", "WINDOW"],
    ["parent", "WINDOW"],
    ["children_len", "CARD16"],
    ["children", ["WINDOW"]]
  ])], ["InternAtom", new Map([["atom", "ATOM"]])], ["GetAtomName", new Map([["name_len", "CARD16"], ["name", "STRING8"]])], ["GetProperty", new Map([
    ["format", "CARD8"],
    ["type", "ATOM"],
    ["bytes_after", "CARD32"],
    ["value_len", "CARD32"],
    ["value", ["void"]]
  ])], ["ListProperties", new Map([["atoms_len", "CARD16"], ["atoms", ["ATOM"]]])], ["GetSelectionOwner", new Map([["owner", "WINDOW"]])], ["GrabPointer", new Map([["status", "BYTE"]])], ["GrabKeyboard", new Map([["status", "BYTE"]])], ["QueryPointer", new Map([
    ["same_screen", "BOOL"],
    ["root", "WINDOW"],
    ["child", "WINDOW"],
    ["root_x", "INT16"],
    ["root_y", "INT16"],
    ["win_x", "INT16"],
    ["win_y", "INT16"],
    ["mask", "CARD16"]
  ])], [
    "GetMotionEvents",
    new Map([["events_len", "CARD32"], ["events", ["TIMECOORD"]]])
  ], ["TranslateCoordinates", new Map([
    ["same_screen", "BOOL"],
    ["child", "WINDOW"],
    ["dst_x", "INT16"],
    ["dst_y", "INT16"]
  ])], ["GetInputFocus", new Map([["revert_to", "CARD8"], ["focus", "WINDOW"]])], ["QueryKeymap", new Map([["keys", ["CARD8"]]])], ["QueryFont", new Map([
    ["min_bounds", "CHARINFO"],
    ["max_bounds", "CHARINFO"],
    ["min_char_or_byte2", "CARD16"],
    ["max_char_or_byte2", "CARD16"],
    ["default_char", "CARD16"],
    ["properties_len", "CARD16"],
    ["draw_direction", "BYTE"],
    ["min_byte1", "CARD8"],
    ["max_byte1", "CARD8"],
    ["all_chars_exist", "BOOL"],
    ["font_ascent", "INT16"],
    ["font_descent", "INT16"],
    ["char_infos_len", "CARD32"],
    ["properties", ["FONTPROP"]],
    ["char_infos", ["CHARINFO"]]
  ])], ["QueryTextExtents", new Map([
    ["draw_direction", "BYTE"],
    ["font_ascent", "INT16"],
    ["font_descent", "INT16"],
    ["overall_ascent", "INT16"],
    ["overall_descent", "INT16"],
    ["overall_width", "INT32"],
    ["overall_left", "INT32"],
    ["overall_right", "INT32"]
  ])], ["ListFonts", new Map([["names_len", "CARD16"], ["names", ["STR"]]])], ["ListFontsWithInfo", new Map([
    ["name_len", "CARD8"],
    ["min_bounds", "CHARINFO"],
    ["max_bounds", "CHARINFO"],
    ["min_char_or_byte2", "CARD16"],
    ["max_char_or_byte2", "CARD16"],
    ["default_char", "CARD16"],
    ["properties_len", "CARD16"],
    ["draw_direction", "BYTE"],
    ["min_byte1", "CARD8"],
    ["max_byte1", "CARD8"],
    ["all_chars_exist", "BOOL"],
    ["font_ascent", "INT16"],
    ["font_descent", "INT16"],
    ["replies_hint", "CARD32"],
    ["properties", ["FONTPROP"]],
    ["name", ["char"]]
  ])], ["GetFontPath", new Map([["path_len", "CARD16"], ["path", ["STR"]]])], [
    "GetImage",
    new Map([["depth", "CARD8"], ["visual", "VISUALID"], ["data", ["BYTE"]]])
  ], [
    "ListInstalledColormaps",
    new Map([["cmaps_len", "CARD16"], ["cmaps", ["COLORMAP"]]])
  ], ["AllocColor", new Map([
    ["red", "CARD16"],
    ["green", "CARD16"],
    ["blue", "CARD16"],
    ["pixel", "CARD32"]
  ])], ["AllocNamedColor", new Map([
    ["pixel", "CARD32"],
    ["exact_red", "CARD16"],
    ["exact_green", "CARD16"],
    ["exact_blue", "CARD16"],
    ["visual_red", "CARD16"],
    ["visual_green", "CARD16"],
    ["visual_blue", "CARD16"]
  ])], ["AllocColorCells", new Map([
    ["pixels_len", "CARD16"],
    ["masks_len", "CARD16"],
    ["pixels", ["CARD32"]],
    ["masks", ["CARD32"]]
  ])], ["AllocColorPlanes", new Map([
    ["pixels_len", "CARD16"],
    ["red_mask", "CARD32"],
    ["green_mask", "CARD32"],
    ["blue_mask", "CARD32"],
    ["pixels", ["CARD32"]]
  ])], ["QueryColors", new Map([["colors_len", "CARD16"], ["colors", ["RGB"]]])], ["LookupColor", new Map([
    ["exact_red", "CARD16"],
    ["exact_green", "CARD16"],
    ["exact_blue", "CARD16"],
    ["visual_red", "CARD16"],
    ["visual_green", "CARD16"],
    ["visual_blue", "CARD16"]
  ])], ["QueryBestSize", new Map([["width", "CARD16"], ["height", "CARD16"]])], ["QueryExtension", new Map([
    ["present", "BOOL"],
    ["major_opcode", "CARD8"],
    ["first_event", "CARD8"],
    ["first_error", "CARD8"]
  ])], ["ListExtensions", new Map([["names_len", "CARD8"], ["names", ["STR"]]])], [
    "GetKeyboardMapping",
    new Map([["keysyms_per_keycode", "BYTE"], ["keysyms", ["KEYSYM"]]])
  ], ["GetKeyboardControl", new Map([
    ["global_auto_repeat", "BYTE"],
    ["led_mask", "CARD32"],
    ["key_click_percent", "CARD8"],
    ["bell_percent", "CARD8"],
    ["bell_pitch", "CARD16"],
    ["bell_duration", "CARD16"],
    ["auto_repeats", ["CARD8"]]
  ])], ["GetPointerControl", new Map([
    ["acceleration_numerator", "CARD16"],
    ["acceleration_denominator", "CARD16"],
    ["threshold", "CARD16"]
  ])], ["GetScreenSaver", new Map([
    ["timeout", "CARD16"],
    ["interval", "CARD16"],
    ["prefer_blanking", "BYTE"],
    ["allow_exposures", "BYTE"]
  ])], [
    "ListHosts",
    new Map([["mode", "BYTE"], ["hosts_len", "CARD16"], ["hosts", ["HOST"]]])
  ], ["SetPointerMapping", new Map([["status", "BYTE"]])], ["GetPointerMapping", new Map([["map_len", "CARD8"], ["map", ["CARD8"]]])], ["SetModifierMapping", new Map([["status", "BYTE"]])], [
    "GetModifierMapping",
    new Map([["keycodes_per_modifier", "CARD8"], ["keycodes", ["KEYCODE"]]])
  ]]);
};

export class VisualClassEnum extends ValueEnum {
  static _values = new Map([
    [0, "StaticGray"],
    [1, "GrayScale"],
    [2, "StaticColor"],
    [3, "PseudoColor"],
    [4, "TrueColor"],
    [5, "DirectColor"]
  ]);
};

export class EventMaskEnum extends BitEnum {
  static _values = new Map([[0, "NoEvent"]]);

  static _bits = new Map([
    [0, "KeyPress"],
    [1, "KeyRelease"],
    [2, "ButtonPress"],
    [3, "ButtonRelease"],
    [4, "EnterWindow"],
    [5, "LeaveWindow"],
    [6, "PointerMotion"],
    [7, "PointerMotionHint"],
    [8, "Button1Motion"],
    [9, "Button2Motion"],
    [10, "Button3Motion"],
    [11, "Button4Motion"],
    [12, "Button5Motion"],
    [13, "ButtonMotion"],
    [14, "KeymapState"],
    [15, "Exposure"],
    [16, "VisibilityChange"],
    [17, "StructureNotify"],
    [18, "ResizeRedirect"],
    [19, "SubstructureNotify"],
    [20, "SubstructureRedirect"],
    [21, "FocusChange"],
    [22, "PropertyChange"],
    [23, "ColorMapChange"],
    [24, "OwnerGrabButton"]
  ]);
};

export class BackingStoreEnum extends ValueEnum {
  static _values = new Map([[0, "NotUseful"], [1, "WhenMapped"], [2, "Always"]]);
};

export class ImageOrderEnum extends ValueEnum {
  static _values = new Map([[0, "LSBFirst"], [1, "MSBFirst"]]);
};

export class ModMaskEnum extends BitEnum {
  static _bits = new Map([
    [0, "Shift"],
    [1, "Lock"],
    [2, "Control"],
    [3, "1"],
    [4, "2"],
    [5, "3"],
    [6, "4"],
    [7, "5"],
    [15, "Any"]
  ]);
};

export class KeyButMaskEnum extends BitEnum {
  static _bits = new Map([
    [0, "Shift"],
    [1, "Lock"],
    [2, "Control"],
    [3, "Mod1"],
    [4, "Mod2"],
    [5, "Mod3"],
    [6, "Mod4"],
    [7, "Mod5"],
    [8, "Button1"],
    [9, "Button2"],
    [10, "Button3"],
    [11, "Button4"],
    [12, "Button5"]
  ]);
};

export class WindowEnum extends ValueEnum {
  static _values = new Map([[0, "None"]]);
};

export class ButtonMaskEnum extends BitEnum {
  static _bits = new Map([[8, "1"], [9, "2"], [10, "3"], [11, "4"], [12, "5"], [15, "Any"]]);
};

export class MotionEnum extends ValueEnum {
  static _values = new Map([[0, "Normal"], [1, "Hint"]]);
};

export class NotifyDetailEnum extends ValueEnum {
  static _values = new Map([
    [0, "Ancestor"],
    [1, "Virtual"],
    [2, "Inferior"],
    [3, "Nonlinear"],
    [4, "NonlinearVirtual"],
    [5, "Pointer"],
    [6, "PointerRoot"],
    [7, "None"]
  ]);
};

export class NotifyModeEnum extends ValueEnum {
  static _values = new Map([[0, "Normal"], [1, "Grab"], [2, "Ungrab"], [3, "WhileGrabbed"]]);
};

export class VisibilityEnum extends ValueEnum {
  static _values = new Map([[0, "Unobscured"], [1, "PartiallyObscured"], [2, "FullyObscured"]]);
};

export class PlaceEnum extends ValueEnum {
  static _values = new Map([[0, "OnTop"], [1, "OnBottom"]]);
};

export class PropertyEnum extends ValueEnum {
  static _values = new Map([[0, "NewValue"], [1, "Delete"]]);
};

export class TimeEnum extends ValueEnum {
  static _values = new Map([[0, "CurrentTime"]]);
};

export class ColormapStateEnum extends ValueEnum {
  static _values = new Map([[0, "Uninstalled"], [1, "Installed"]]);
};

export class ColormapEnum extends ValueEnum {
  static _values = new Map([[0, "None"]]);
};

export class MappingEnum extends ValueEnum {
  static _values = new Map([[0, "Modifier"], [1, "Keyboard"], [2, "Pointer"]]);
};

export class WindowClassEnum extends ValueEnum {
  static _values = new Map([[0, "CopyFromParent"], [1, "InputOutput"], [2, "InputOnly"]]);
};

export class CWEnum extends BitEnum {
  static _bits = new Map([
    [0, "BackPixmap"],
    [1, "BackPixel"],
    [2, "BorderPixmap"],
    [3, "BorderPixel"],
    [4, "BitGravity"],
    [5, "WinGravity"],
    [6, "BackingStore"],
    [7, "BackingPlanes"],
    [8, "BackingPixel"],
    [9, "OverrideRedirect"],
    [10, "SaveUnder"],
    [11, "EventMask"],
    [12, "DontPropagate"],
    [13, "Colormap"],
    [14, "Cursor"]
  ]);
};

export class BackPixmapEnum extends ValueEnum {
  static _values = new Map([[0, "None"], [1, "ParentRelative"]]);
};

export class GravityEnum extends ValueEnum {
  static _values = new Map([
    [0, "WinUnmap"],
    [1, "NorthWest"],
    [2, "North"],
    [3, "NorthEast"],
    [4, "West"],
    [5, "Center"],
    [6, "East"],
    [7, "SouthWest"],
    [8, "South"],
    [9, "SouthEast"],
    [10, "Static"]
  ]);
};

export class MapStateEnum extends ValueEnum {
  static _values = new Map([[0, "Unmapped"], [1, "Unviewable"], [2, "Viewable"]]);
};

export class SetModeEnum extends ValueEnum {
  static _values = new Map([[0, "Insert"], [1, "Delete"]]);
};

export class ConfigWindowEnum extends BitEnum {
  static _bits = new Map([
    [0, "X"],
    [1, "Y"],
    [2, "Width"],
    [3, "Height"],
    [4, "BorderWidth"],
    [5, "Sibling"],
    [6, "StackMode"]
  ]);
};

export class StackModeEnum extends ValueEnum {
  static _values = new Map(
    [[0, "Above"], [1, "Below"], [2, "TopIf"], [3, "BottomIf"], [4, "Opposite"]]
  );
};

export class CirculateEnum extends ValueEnum {
  static _values = new Map([[0, "RaiseLowest"], [1, "LowerHighest"]]);
};

export class PropModeEnum extends ValueEnum {
  static _values = new Map([[0, "Replace"], [1, "Prepend"], [2, "Append"]]);
};

export class GetPropertyTypeEnum extends ValueEnum {
  static _values = new Map([[0, "Any"]]);
};

export class SendEventDestEnum extends ValueEnum {
  static _values = new Map([[0, "PointerWindow"], [1, "ItemFocus"]]);
};

export class GrabModeEnum extends ValueEnum {
  static _values = new Map([[0, "Sync"], [1, "Async"]]);
};

export class GrabStatusEnum extends ValueEnum {
  static _values = new Map([
    [0, "Success"],
    [1, "AlreadyGrabbed"],
    [2, "InvalidTime"],
    [3, "NotViewable"],
    [4, "Frozen"]
  ]);
};

export class CursorEnum extends ValueEnum {
  static _values = new Map([[0, "None"]]);
};

export class ButtonIndexEnum extends ValueEnum {
  static _values = new Map([[0, "Any"], [1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]]);
};

export class GrabEnum extends ValueEnum {
  static _values = new Map([[0, "Any"]]);
};

export class AllowEnum extends ValueEnum {
  static _values = new Map([
    [0, "AsyncPointer"],
    [1, "SyncPointer"],
    [2, "ReplayPointer"],
    [3, "AsyncKeyboard"],
    [4, "SyncKeyboard"],
    [5, "ReplayKeyboard"],
    [6, "AsyncBoth"],
    [7, "SyncBoth"]
  ]);
};

export class InputFocusEnum extends ValueEnum {
  static _values = new Map([[0, "None"], [1, "PointerRoot"], [2, "Parent"], [3, "FollowKeyboard"]]);
};

export class FontDrawEnum extends ValueEnum {
  static _values = new Map([[0, "LeftToRight"], [1, "RightToLeft"]]);
};

export class GCEnum extends BitEnum {
  static _bits = new Map([
    [0, "Function"],
    [1, "PlaneMask"],
    [2, "Foreground"],
    [3, "Background"],
    [4, "LineWidth"],
    [5, "LineStyle"],
    [6, "CapStyle"],
    [7, "JoinStyle"],
    [8, "FillStyle"],
    [9, "FillRule"],
    [10, "Tile"],
    [11, "Stipple"],
    [12, "TileStippleOriginX"],
    [13, "TileStippleOriginY"],
    [14, "Font"],
    [15, "SubwindowMode"],
    [16, "GraphicsExposures"],
    [17, "ClipOriginX"],
    [18, "ClipOriginY"],
    [19, "ClipMask"],
    [20, "DashOffset"],
    [21, "DashList"],
    [22, "ArcMode"]
  ]);
};

export class GXEnum extends ValueEnum {
  static _values = new Map([
    [0, "clear"],
    [1, "and"],
    [2, "andReverse"],
    [3, "copy"],
    [4, "andInverted"],
    [5, "noop"],
    [6, "xor"],
    [7, "or"],
    [8, "nor"],
    [9, "equiv"],
    [10, "invert"],
    [11, "orReverse"],
    [12, "copyInverted"],
    [13, "orInverted"],
    [14, "nand"],
    [15, "set"]
  ]);
};

export class LineStyleEnum extends ValueEnum {
  static _values = new Map([[0, "Solid"], [1, "OnOffDash"], [2, "DoubleDash"]]);
};

export class CapStyleEnum extends ValueEnum {
  static _values = new Map([[0, "NotLast"], [1, "Butt"], [2, "Round"], [3, "Projecting"]]);
};

export class JoinStyleEnum extends ValueEnum {
  static _values = new Map([[0, "Miter"], [1, "Round"], [2, "Bevel"]]);
};

export class FillStyleEnum extends ValueEnum {
  static _values = new Map([[0, "Solid"], [1, "Tiled"], [2, "Stippled"], [3, "OpaqueStippled"]]);
};

export class FillRuleEnum extends ValueEnum {
  static _values = new Map([[0, "EvenOdd"], [1, "Winding"]]);
};

export class SubwindowModeEnum extends ValueEnum {
  static _values = new Map([[0, "ClipByChildren"], [1, "IncludeInferiors"]]);
};

export class ArcModeEnum extends ValueEnum {
  static _values = new Map([[0, "Chord"], [1, "PieSlice"]]);
};

export class ClipOrderingEnum extends ValueEnum {
  static _values = new Map([[0, "Unsorted"], [1, "YSorted"], [2, "YXSorted"], [3, "YXBanded"]]);
};

export class CoordModeEnum extends ValueEnum {
  static _values = new Map([[0, "Origin"], [1, "Previous"]]);
};

export class PolyShapeEnum extends ValueEnum {
  static _values = new Map([[0, "Complex"], [1, "Nonconvex"], [2, "Convex"]]);
};

export class ImageFormatEnum extends ValueEnum {
  static _values = new Map([[0, "XYBitmap"], [1, "XYPixmap"], [2, "ZPixmap"]]);
};

export class ColormapAllocEnum extends ValueEnum {
  static _values = new Map([[0, "None"], [1, "All"]]);
};

export class ColorFlagEnum extends BitEnum {
  static _bits = new Map([[0, "Red"], [1, "Green"], [2, "Blue"]]);
};

export class PixmapEnum extends ValueEnum {
  static _values = new Map([[0, "None"]]);
};

export class FontEnum extends ValueEnum {
  static _values = new Map([[0, "None"]]);
};

export class QueryShapeOfEnum extends ValueEnum {
  static _values = new Map([[0, "LargestCursor"], [1, "FastestTile"], [2, "FastestStipple"]]);
};

export class KBEnum extends BitEnum {
  static _bits = new Map([
    [0, "KeyClickPercent"],
    [1, "BellPercent"],
    [2, "BellPitch"],
    [3, "BellDuration"],
    [4, "Led"],
    [5, "LedMode"],
    [6, "Key"],
    [7, "AutoRepeatMode"]
  ]);
};

export class LedModeEnum extends ValueEnum {
  static _values = new Map([[0, "Off"], [1, "On"]]);
};

export class AutoRepeatModeEnum extends ValueEnum {
  static _values = new Map([[0, "Off"], [1, "On"], [2, "Default"]]);
};

export class BlankingEnum extends ValueEnum {
  static _values = new Map([[0, "NotPreferred"], [1, "Preferred"], [2, "Default"]]);
};

export class ExposuresEnum extends ValueEnum {
  static _values = new Map([[0, "NotAllowed"], [1, "Allowed"], [2, "Default"]]);
};

export class HostModeEnum extends ValueEnum {
  static _values = new Map([[0, "Insert"], [1, "Delete"]]);
};

export class FamilyEnum extends ValueEnum {
  static _values = new Map([
    [0, "Internet"],
    [1, "DECnet"],
    [2, "Chaos"],
    [5, "ServerInterpreted"],
    [6, "Internet6"]
  ]);
};

export class AccessControlEnum extends ValueEnum {
  static _values = new Map([[0, "Disable"], [1, "Enable"]]);
};

export class CloseDownEnum extends ValueEnum {
  static _values = new Map([[0, "DestroyAll"], [1, "RetainPermanent"], [2, "RetainTemporary"]]);
};

export class KillEnum extends ValueEnum {
  static _values = new Map([[0, "AllTemporary"]]);
};

export class ScreenSaverEnum extends ValueEnum {
  static _values = new Map([[0, "Reset"], [1, "Active"]]);
};

export class MappingStatusEnum extends ValueEnum {
  static _values = new Map([[0, "Success"], [1, "Busy"], [2, "Failure"]]);
};

export class MapIndexEnum extends ValueEnum {
  static _values = new Map([
    [0, "Shift"],
    [1, "Lock"],
    [2, "Control"],
    [3, "1"],
    [4, "2"],
    [5, "3"],
    [6, "4"],
    [7, "5"]
  ]);
};