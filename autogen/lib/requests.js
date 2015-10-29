"use strict";
var b = require('ast-types').builders;
var parseBody = require('./statement_body');

module.exports = function genRequests(doc, klass) {
  var request_opcodes = new Map();
  for (let request of doc.find('request')) {
    // TODO: Classes & objects
    let name = request.attr('name').value();
    let opcode = parseInt(request.attr('opcode').value());
    request_opcodes.set(opcode, name);
    let [read_stmts, write_stmts] = parseBody(request);
    klass.addMethod(`request_read${name}`, [], read_stmts);
    // klass.addMethod(`request_write${name}`, [b.identifier('obj')], write_stmts);

    let reply = request.get('reply');
    if (reply) {
      // TODO: Classes & objects
      let [read_stmts, write_stmts] = parseBody(reply);
      // klass.addMethod(`reply_read${name}`, [], read_stmts);
      klass.addMethod(`reply_write${name}`, [b.identifier('obj')], write_stmts);
    }
  }

  klass.addProperty('request_opcodes', request_opcodes, true);
}
