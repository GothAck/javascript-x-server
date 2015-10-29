"use strict";
var b = require('ast-types').builders;

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
  return b.literal(value);
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

  addSymMethod(name, callname, addArguments, returns) {
    var callArguments = [];
    if (addArguments) {
      callArguments = [b.spreadElement(b.identifier('arguments'))];
    }
    this.addMethod(
      name,
      [],
      [(returns ? b.returnStatement : b.expressionStatement)(b.callExpression(
        b.memberExpression(
          b.identifier('this'),
          b.identifier(callname)),
        callArguments
        ))]);
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
}
