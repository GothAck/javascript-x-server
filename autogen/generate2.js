#!node --harmony_destructuring
"use strict";

var path = require('path');
var fs = require('fs');
var libxml = require('libxmljs');
var b = require('ast-types').builders;
var recast = require('recast');
var misc = require('./lib/misc');

var doc = libxml.parseXml(fs.readFileSync(path.join(__dirname, 'proto/xproto.xml'), 'ascii'));

var klass = new misc.Class('XTypeBuffer', 'CursorBuffer');

require('./lib/types')(doc, klass);
require('./lib/events')(doc, klass);
require('./lib/errors')(doc, klass);
require('./lib/requests')(doc, klass);


fs.writeFile(path.join(__dirname, 'out.js'), recast.print(b.program([klass.gen()])).code);
