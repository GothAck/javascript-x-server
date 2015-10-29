"use strict";
var b = require('ast-types').builders;

var ops = [
  ['*', '/'],
  []
];

function setOpt(obj, name, value) {
  obj[name] = value;
  return obj;
}

function parseOp(root, member, invert) {
  if (!root) return b.literal(-1);
  switch (root.name()) {
    case 'op':
      let children = root.find('*');
      return b.parenthesizedExpression(b.binaryExpression.apply(
          null,
          [root.attr('op').value()].concat(
          children.map((c) => parseOp(c, member, invert)))));
      console.log(bin);
      return bin;
    case 'value':
      return b.literal(parseInt(root.text()));
    case 'fieldref':
      let id = b.identifier(root.text());
      if (member) {
        id = b.memberExpression(b.identifier(member), id);
      }
      return id;
    default:
      throw new Error('Unknown op ' + root.type());
  }
}

module.exports = function parseBody(parent) {
  let children = parent.find('*');
  let read_stmts = [];
  
  let lists = parent.find('list');
  let write_stmts = [];
  if (lists && lists.length) {
    for (let list of lists) {
      let name = list.attr('name').value();
      // let length = list.get('*');
      // if (!length) {
      //   console.error('Waaaaaaaa');
      //   continue;
      // }

      // if (list.get('fieldref') === undefined) {
      //   // FIXME: <op> :(
      //   console.error('FIXME: Implement <op>');
      //   continue;
      // }
      // let fieldref = list.get('fieldref').text();
      // write_stmts.push(b.expressionStatement(parseOp(list.get('*'))));
      write_stmts.push(b.expressionStatement(b.assignmentExpression(
        '=',
        b.memberExpression(
          b.identifier('obj'), b.identifier(`${name}_len`)),
        b.memberExpression(
          b.memberExpression(
            b.identifier('obj'), b.identifier(name)),
          b.identifier('length'))
      )));
    }
  }

  for (let child of children) {
    let child_tag = child.name();
    switch (child_tag) {
      case 'pad':
        let bytes = parseInt(child.attr('bytes').value());
        read_stmts.push(
          b.expressionStatement(b.callExpression(
            b.memberExpression(
              b.identifier('this'),
              b.identifier('moveCursor')),
            [b.literal(bytes)])));
        write_stmts.push(
          b.expressionStatement(b.callExpression(
            b.memberExpression(
              b.identifier('this'),
              b.identifier('moveCursor')),
            [b.literal(bytes)])));
        break;
      case 'field':
        {
          let child_name = child.attr('name').value();
          let child_type = child.attr('type').value();
          read_stmts.push(
            b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(
                b.identifier('obj'), b.identifier(child_name)),
              b.callExpression(
                b.memberExpression(
                  b.identifier('this'),
                  b.identifier(`read${child_type}`)),
                []))));
          write_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.identifier('this'),
                b.identifier(`write${child_type}`)),
              [b.memberExpression(
                b.identifier('obj'),
                b.identifier(child_name))])));
        }
        break;
      case 'list':
        {
          let child_name = child.attr('name').value();
          let child_type = child.attr('type').value();

          let fieldref = parseOp(child.get('*'), 'obj');
          // let fieldref = child.get('fieldref').text();
          read_stmts.push(b.variableDeclaration(
            'var',
            [b.variableDeclarator(
              b.identifier(`${child_name}_length`),
              fieldref)]));
          write_stmts.push(b.variableDeclaration(
            'var',
            [b.variableDeclarator(
              b.identifier(`${child_name}_length`),
              fieldref)]));
          read_stmts.push(b.expressionStatement(b.assignmentExpression(
            '=',
            b.memberExpression(b.identifier('obj'), b.identifier(child_name)),
            b.arrayExpression([]))));
          read_stmts.push(
            b.forStatement(
              b.variableDeclaration(
                'let',
                [b.variableDeclarator(
                    b.identifier('i'),
                    b.literal(0))]),
              b.binaryExpression(
                '<',
                b.identifier('i'),
                b.identifier(`${child_name}_length`)),
              b.updateExpression(
                '++',
                b.identifier('i'),
                false),
              b.blockStatement([
                b.expressionStatement(b.callExpression(
                  b.memberExpression(
                    b.memberExpression(
                      b.identifier('obj'), b.identifier(child_name)),
                    b.identifier('push')),
                  [b.callExpression(
                    b.memberExpression(
                      b.identifier('this'), b.identifier(`read${child_type}`)),
                    [])])),
              ])
          ));
          write_stmts.push(
            b.forStatement(
              b.variableDeclaration(
                'let',
                [b.variableDeclarator(
                    b.identifier('i'),
                    b.literal(0))]),
              b.binaryExpression(
                '<',
                b.identifier('i'),
                b.identifier(`${child_name}_length`)),
              b.updateExpression(
                '++',
                b.identifier('i'),
                false),
              b.blockStatement([
                b.expressionStatement(b.callExpression(
                  b.memberExpression(
                    b.identifier('this'), b.identifier(`write${child_type}`)),
                  [b.memberExpression(
                    b.memberExpression(
                      b.identifier('obj'),
                      b.identifier(child_name)),
                    b.identifier('i'), true)])),
              ])
          ));
        }
        break;
      case 'valueparam':
      case 'exprfield':
        //TODO: depends on enum & op
        console.warn(`TODO: ${child_tag}`);
      case 'reply':
      case 'doc':
        // Don't handle replies here, just ignore them
        break;
      default:
        throw new Error(`Unknown tag ${child_tag}`);
    }
  }
  if (read_stmts.length) {
    read_stmts.unshift(
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(
          b.identifier('obj'),
          b.objectExpression([]))]));
    read_stmts.push(b.returnStatement(b.identifier('obj')));
  } else {
    read_stmts.push(b.returnStatement(b.objectExpression([])));
  }
  return [read_stmts, write_stmts];
}

module.exports.parseOp = parseOp;
