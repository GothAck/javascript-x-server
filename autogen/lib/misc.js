"use strict";
var { builders :b, namedTypes} = require('ast-types');
var recast = require('recast');

function _convertValToAST(value) {
  if (Array.isArray(value)) {
    return b.arrayExpression(value.map(_convertValToAST));
  }
  if (value instanceof Map) {
    return b.newExpression(
      b.identifier('Map'),
      [b.arrayExpression(Array.from(value).map(
        (v) => b.arrayExpression(v.map(_convertValToAST))))]);
  }
  if (value instanceof Set) {
    return b.newExpression(
      b.identifier('Set'),
      [b.arrayExpression(Array.from(value).map(_convertValToAST))]);
  }
  if (namedTypes.Node.check(value)) {
    return value;
  }
  return b.literal(value);
}

class Classes {
  constructor() {
    this.classes = new Map();
  }
  newClass(name, extend) {
    var klass = new Class(name, extend);
    this.classes.set(name, klass);
    return klass;
  }
  getClass(name) {
    return this.classes.get(name);
  }
  program() {
    var classes = [
      b.importDeclaration(
        [
          b.importSpecifier(b.identifier('ValueEnum')),
          b.importSpecifier(b.identifier('BitEnum')),
          b.importSpecifier(b.identifier('CursorBuffer')),
        ],
        b.literal('./endianbuffer')
      ),
    ];
    for (let [name, klass] of this.classes) {
      classes.push(b.exportDeclaration(false, klass.gen()));
    }
    return b.program(classes);
  }
  recastPrint() {
    return recast.print(this.program(), { tabWidth: 2 });
  }
  toString() {
    return this.recastPrint().code;
  }
}

class Class {
  constructor(name, extend) {
    this.name = name;
    this.extend = extend;
    this.body = [];
  }

  addMethod(name, args, body) {
    this.body.push(b.methodDefinition(
      'method',
      b.identifier(name),
      b.functionExpression(
        null,
        args,
        b.blockStatement(body))));
  }

  __addSymMethod(name, callname, read) {
    var callArguments = [];
    if (!read) {
      callArguments = [b.spreadElement(b.identifier('arguments'))];
    }
    this.addMethod(
      name,
      [],
      [(read ? b.returnStatement : b.expressionStatement)(b.callExpression(
        b.memberExpression(
          b.thisExpression(),
          b.identifier(callname)),
        callArguments
        ))]);
  }

  addSymRead(name, callname) {
    this.__addSymMethod(name, callname, true);
  }

  addSymWrite(name, callname) {
    this.__addSymMethod(name, callname, false);
  }

  addProperty(name, value, is_static) {
    this.body.push(b.classProperty(
      b.identifier(name),
      _convertValToAST(value),
      null,
      is_static));
    // Add the property here so we can reference it later
    // (e.g. enums from statement_body)
    this[name] = value;
    if (value instanceof Map) {
      let inv = this[`${name}_inv`] = new Map();
      for (let [k, v] of value) {
        inv.set(v, k);
      }
    }
  }

  gen() {
    var extend = null;
    if (this.extend) {
      extend = b.identifier(this.extend);
    }
    return b.classDeclaration(
      b.identifier(this.name),
      b.classBody(this.body),
      extend,
      []);
  }
}

module.exports = {
  Class: Class,
  Classes: Classes,
}
