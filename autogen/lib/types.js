"use strict";
var { builders :b } = require('ast-types');
var parseBody = require('./statement_body');

module.exports = function genTypes(doc, klass, klasses) {
  var types = new Map([
    ['BOOL', 'UInt8'],
    ['BYTE', 'UInt8'],
    ['CARD8', 'UInt8'],
    ['INT8', 'Int8'],
    ['CARD16', 'UInt16'],
    ['INT16', 'Int16'],
    ['CARD32', 'UInt32'],
    ['INT32', 'Int32'],
  ]);

  var xids = new Map();

  for (let [name, type] of types) {
    klass.addSymRead(`read${name}`, `read${type}`);
    klass.addSymWrite(`write${name}`, `write${type}`);
  }

  for (let def of doc.find('typedef')) {
    let newname = def.attr('newname').value();
    let oldname = def.attr('oldname').value();
    klass.addSymRead(`read${newname}`, `read${oldname}`);
    klass.addSymWrite(`write${newname}`, `write${oldname}`);
  }

  for (let xid of doc.find('xidtype')) {
    let name = xid.attr('name').value();
    xids.set(name, null);
    klass.addSymRead(`read${name}`, 'readCARD32');
    klass.addSymWrite(`write${name}`, 'writeCARD32');
  }

  for (let xid of doc.find('xidunion')) {
    let name = xid.attr('name').value();
    let _types = xid.find('type').map(t => t.text());
    xids.set(name, new Set(_types));
    types.set(name, 'UInt32');
    klass.addSymRead(`read${name}`, 'readCARD32', false);
    klass.addSymWrite(`write${name}`, 'writeCARD32');
  }

  klass.addProperty('xids', xids, true);

  for (let struct of doc.find('struct')) {
    let name = struct.attr('name').value();
    let [read_stmts, write_stmts] = parseBody(struct, klasses);
    klass.addMethod(`read${name}`, [], read_stmts);
    klass.addMethod(`write${name}`, [b.identifier('obj')], write_stmts);
  }
}
