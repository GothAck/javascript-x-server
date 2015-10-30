"use strict";
var a = require('ast-types');
var b = a.builders;
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
  if (a.namedTypes.Node.check(value)) {
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
          b.identifier('this'),
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
    value = _convertValToAST(value);
    this.body.push(b.classProperty(
      b.identifier(name),
      value,
      null,
      is_static));
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
