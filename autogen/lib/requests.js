"use strict";
var { builders :b } = require('ast-types');
var parseBody = require('./statement_body');

module.exports = function genRequests(doc, klass, klasses) {
  var request_opcodes = new Map();
  var request_fields = new Map();
  var reply_fields = new Map();
  for (let request of doc.find('request')) {
    // TODO: Classes & objects
    let name = request.attr('name').value();
    let opcode = parseInt(request.attr('opcode').value());
    request_opcodes.set(opcode, name);
    let [read_stmts, write_stmts, fields] = parseBody(request, klasses, 'request');
    request_fields.set(name, fields);
    klass.addMethod(`request_read${name}`, [], read_stmts);
    klass.addMethod(`request_write${name}`, [b.identifier('obj')], write_stmts);

    let reply = request.get('reply');
    if (reply) {
      // TODO: Classes & objects
      let [read_stmts, write_stmts, fields] = parseBody(reply, klasses, 'reply');
      reply_fields.set(name, fields);
      klass.addMethod(`reply_read${name}`, [], read_stmts);
      klass.addMethod(`reply_write${name}`, [b.identifier('obj')], write_stmts);
    }
  }

  klass.addProperty('request_opcodes', request_opcodes, true);
  klass.addProperty('request_fields', request_fields, true);
  klass.addProperty('reply_fields', reply_fields, true);
}
