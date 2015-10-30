"use strict";
var b = require('ast-types').builders;
var parseBody = require('./statement_body');

module.exports = function genErrors(doc, klass) {
  var error_numbers = new Map();

  for (let error of doc.find('error')) {
    // TODO: Create classes & objects
    let name = error.attr('name').value();
    let number = parseInt(error.attr('number').value());
    error_numbers.set(number, name);
    let [read_stmts, write_stmts] = parseBody(error);
    klass.addMethod(`error_read${name}`, [], read_stmts);
    klass.addMethod(`error_write${name}`, [b.identifier('obj')], write_stmts);
  }

  for (let error of doc.find('errorcopy')) {
    // TODO: Create classes & objects
    let name = error.attr('name').value();
    let ref = error.attr('ref').value();
    let number = parseInt(error.attr('number').value());
    error_numbers.set(number, name);
    klass.addSymRead(`error_read${name}`, `error_read${ref}`);
    klass.addSymWrite(`error_write${name}`, `error_write${ref}`);
  }

  klass.addProperty('error_numbers', error_numbers, true);
}
