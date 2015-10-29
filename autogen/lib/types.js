"use strict";
var b = require('ast-types').builders;
var parseBody = require('./statement_body');

module.exports = function genTypes(doc, klass) {
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
    klass.addSymMethod(`read${name}`, `read${type}`, false, true);
    klass.addSymMethod(`write${name}`, `write${type}`, true);
  }

  for (let def of doc.find('typedef')) {
    let newname = def.attr('newname').value();
    let oldname = def.attr('oldname').value();
    klass.addSymMethod(`read${newname}`, `read${oldname}`, false, true);
    klass.addSymMethod(`write${newname}`, `write${oldname}`, true);
  }

  for (let xid of doc.find('xidtype')) {
    let name = xid.attr('name').value();
    xids.set(name, null);
    klass.addSymMethod(`read${name}`, 'readCARD32', false, true);
    klass.addSymMethod(`write${name}`, 'writeCARD32', true);
  }

  for (let xid of doc.find('xidunion')) {
    let name = xid.attr('name').value();
    let _types = xid.find('type').map(t => t.text());
    xids.set(name, new Set(_types));
    types.set(name, 'UInt32');
    klass.addSymMethod(`read${name}`, 'readCARD32', false, true);
    klass.addSymMethod(`write${name}`, 'writeCARD32', true);
  }

  // TODO: Map
  klass.addProperty('xids', xids, true);

  for (let struct of doc.find('struct')) {
    let name = struct.attr('name').value();
    let [read_stmts, write_stmts] = parseBody(struct);
    klass.addMethod(`read${name}`, [], read_stmts);
    klass.addMethod(`write${name}`, [b.identifier('obj')], write_stmts);
  }

  for (let struct of doc.find('enum')) {
    // TODO: remember contains bitmasks also
    // Name: enum_readBlah
  }
}
