#!node --harmony_destructuring
"use strict";

var path = require('path');
var fs = require('fs');
var libxml = require('libxmljs');
var b = require('ast-types').builders;
var recast = require('recast');
var Classes = require('./lib/misc').Classes;

var doc = libxml.parseXml(fs.readFileSync(path.join(__dirname, 'proto/xproto.xml'), 'ascii'));

var klasses = new Classes();

var klass = klasses.newClass('XTypeBuffer', 'CursorBuffer');

require('./lib/types')(doc, klass, klasses);
require('./lib/enums')(doc, klass, klasses);
require('./lib/events')(doc, klass, klasses);
require('./lib/errors')(doc, klass, klasses);
require('./lib/requests')(doc, klass, klasses);

fs.writeFile(path.join(__dirname, '../src/xtypebuffer.js'), klasses.toString());
