"use strict";
var b = require('ast-types').builders;
var parseBody = require('./statement_body');

module.exports = function genEvents(doc, klass, klasses) {
  var event_numbers = new Map();

  for (let event of doc.find('event')) {
    // TODO: Create classes & objects
    let name = event.attr('name').value();
    let number = parseInt(event.attr('number').value());
    event_numbers.set(number, name);
    let [read_stmts, write_stmts] = parseBody(event, klasses);
    klass.addMethod(`event_read${name}`, [], read_stmts);
    klass.addMethod(`event_write${name}`, [b.identifier('obj')], write_stmts);
  }

  for (let event of doc.find('eventcopy')) {
    // TODO: Create classes & objects
    let name = event.attr('name').value();
    let ref = event.attr('ref').value();
    let number = parseInt(event.attr('number').value());
    event_numbers.set(number, name);
    klass.addSymRead(`event_read${name}`, `event_read${ref}`);
    klass.addSymWrite(`event_write${name}`, `event_write${ref}`);
  }

  klass.addProperty('event_numbers', event_numbers, true);
}
