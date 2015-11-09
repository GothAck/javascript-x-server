"use strict";
var { builders :b } = require('ast-types');

var ops = [
  ['*', '/'],
  []
];

function setOpt(obj, name, value) {
  obj[name] = value;
  return obj;
}

function parseOp(root, member, invert) {
  if (!root) {
    return null;
  }
  switch (root.name()) {
    case 'op':
      let children = root.find('*');
      return b.parenthesizedExpression(b.binaryExpression.apply(
          null,
          [root.attr('op').value()]
            .concat(children.map((c) => parseOp(c, member, invert)))));
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

module.exports = function parseBody(parent, klasses, type) {
  let children = parent.find('*');
  let parent_name = parent.attr('name') && parent.attr('name').value();
  let read_stmts = [];
  let fields = new Map();
  
  let lists = parent.find('list');
  let write_stmts = [];
  if (lists && lists.length) {
    for (let list of lists) {
      let name = list.attr('name').value();
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

  for (let [i, child] of children.entries()) {
    let child_tag = child.name();
    switch (child_tag) {
      case 'pad':
        let bytes = parseInt(child.attr('bytes').value());
        read_stmts.push(
          b.expressionStatement(b.callExpression(
            b.memberExpression(
              b.thisExpression(),
              b.identifier('moveCursor')),
            [b.literal(bytes)])));
        write_stmts.push(
          b.expressionStatement(b.callExpression(
            b.memberExpression(
              b.thisExpression(),
              b.identifier('moveCursor')),
            [b.literal(bytes)])));
        break;
      case 'field':
        {
          let child_name = child.attr('name').value();
          let child_type = child.attr('type').value();
          fields.set(child_name, child_type);
          read_stmts.push(
            b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(
                b.identifier('obj'), b.identifier(child_name)),
              b.callExpression(
                b.memberExpression(
                  b.thisExpression(),
                  b.identifier(`read${child_type}`)),
                []))));
          if (parent_name === 'SetupRequest' && child_name === 'byte_order') {
            read_stmts.push(
              b.expressionStatement(b.assignmentExpression(
                '=',
                b.memberExpression(b.identifier('obj'), b.identifier('endian')),
                b.binaryExpression(
                  '!==',
                  b.memberExpression(
                    b.identifier('obj'), b.identifier(child_name)),
                  b.literal(66))
              )));
            read_stmts.push(
              b.expressionStatement(b.assignmentExpression(
                '=',
                b.memberExpression(
                  b.thisExpression(), b.identifier('endian')),
                b.memberExpression(b.identifier('obj'), b.identifier('endian'))
              )));
            // data.readUInt8(0) !== 66
          }
          write_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
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
          fields.set(child_name, [child_type]);

          let fieldref = parseOp(child.get('*'), 'obj');
          if (fieldref !== null) {
            read_stmts.push(b.variableDeclaration(
              'var',
              [b.variableDeclarator(
                b.identifier(`${child_name}_length`),
                fieldref)]));
          }
          if (child_type === 'void') {
            read_stmts.push(b.assignmentStatement(
              '=',
              b.memberExpression(b.identifier('obj'), b.identifier(child_name)),
              b.callExpression(
                b.memberExpression(
                  b.thisExpression(), b.identifier('cursorSlice')),
                [b.identifier(`${child_name}_length`)])));
            write_stmts.push(b.callStatement(
              b.memberExpression(
                b.thisExpression(), b.identifier('cursorWriteBuffer')),
              [b.memberExpression(
                b.identifier('obj'), b.identifier(child_name))]));
          } else {
            write_stmts.push(b.variableDeclaration(
              'var',
              [b.variableDeclarator(
                b.identifier(`${child_name}_length`),
                fieldref)]));
            read_stmts.push(b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(b.identifier('obj'), b.identifier(child_name)),
              b.arrayExpression([]))));

            let read_stmt = b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.memberExpression(
                  b.identifier('obj'), b.identifier(child_name)),
                b.identifier('push')),
              [b.callExpression(
                b.memberExpression(
                  b.thisExpression(), b.identifier(`read${child_type}`)),
                [])]));
            if (fieldref === null) {
              read_stmts.push(
                b.whileStatement(
                  b.binaryExpression(
                    '<',
                    b.memberExpression(
                      b.thisExpression(), b.identifier('cursor')),
                    b.memberExpression(
                      b.thisExpression(), b.identifier('length'))),
                  b.blockStatement([read_stmt])));
            } else {
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
                  b.blockStatement([read_stmt])
              ));
            }
            if (child_type === 'char') {
              read_stmts.push(b.assignmentStatement(
                '=',
                b.memberExpression(
                  b.identifier('obj'), b.identifier(child_name)),
                b.callExpression(
                  b.memberExpression(
                    b.memberExpression(
                      b.identifier('obj'), b.identifier(child_name)),
                    b.identifier('join')),
                  [b.literal('')])));
            }
            write_stmts.push(
              b.forOfStatement(
                b.variableDeclaration(
                  'let',
                  [b.identifier('val')]),
                b.memberExpression(
                  b.identifier('obj'),
                  b.identifier(child_name)),
                b.blockStatement([
                  b.expressionStatement(b.callExpression(
                    b.memberExpression(
                      b.thisExpression(), b.identifier(`write${child_type}`)),
                    [b.identifier('val')])),
                ])
            ));
          }
        }
        break;
      case 'exprfield':
        let child_name = child.attr('name').value();
        let child_type = child.attr('type').value();
        read_stmts.push(
          b.expressionStatement(b.assignmentExpression(
            '=',
            b.memberExpression(
              b.identifier('obj'), b.identifier(child_name)),
            b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier(`read${child_type}`)),
              []))));
        write_stmts.push(b.expressionStatement(b.assignmentExpression(
          '=',
          b.memberExpression(
            b.identifier('obj'), b.identifier(child_name)),
          parseOp(child.get('*'), 'obj'))));
        break;
      case 'valueparam':
        if (!(
          klasses.getClass('XTypeBuffer') &&
          klasses.getClass('XTypeBuffer').enums
        )) {
          throw new Error(
            "Shouldn't be able to get to valueparam before enums are parsed");
        }
        let enum_map = klasses.getClass('XTypeBuffer').enums;
        let value_mask_type = child.attr('value-mask-type').value();
        let value_mask_name = child.attr('value-mask-name').value();
        let value_list_name = child.attr('value-list-name').value();

        if (! enum_map.has(value_list_name)) {
          console.error(`FIXME: The stupid cases for ${value_list_name}`);
          continue;
        }
        let enum_class_name = enum_map.get(value_list_name).name;

        fields.set('value', new Map([[enum_class_name, 'CARD32']]));

        read_stmts.push(b.expressionStatement(b.assignmentExpression(
          '=',
          b.memberExpression(
            b.identifier('obj'), b.identifier(value_mask_name)),
          b.callExpression(b.memberExpression(
            b.parenthesizedExpression(b.newExpression(
              b.identifier(enum_class_name),
              [])),
            b.identifier('decode')),
            [b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier(`read${value_mask_type}`)),
              [])]
          ))));

        write_stmts.push(b.variableDeclaration(
          'var',
          [b.variableDeclarator(
            b.identifier('value'),
            b.memberExpression(b.identifier('obj'), b.identifier('value'))
            )]));
        write_stmts.push(b.variableDeclaration(
          'var',
          [b.variableDeclarator(
            b.identifier('value_enum'),
            b.newExpression(
              b.identifier(enum_class_name),
              [b.callExpression(b.memberExpression(
                b.identifier('value'), b.identifier('keys')), [])]))]));
        write_stmts.push(b.callStatement(
          b.memberExpression(
            b.thisExpression(), b.identifier(`write${value_mask_type}`)),
          [b.callExpression(b.memberExpression(
            b.identifier('value_enum'),
            b.identifier('encode')), [])]));

        if (value_mask_type === 'CARD16') {
          read_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('moveCursor')),
              [b.literal(2)])));
          write_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('moveCursor')),
              [b.literal(2)])));
        }

        read_stmts.push(
          b.variableDeclaration(
            'var',
            [b.variableDeclarator(
              b.identifier('value'),
              b.newExpression(b.identifier('Map'), []))]));

        read_stmts.push(b.expressionStatement(
          b.assignmentExpression(
            '=',
            b.memberExpression(
              b.identifier('obj'), b.identifier('value')),
            b.identifier('value'))));

        read_stmts.push(b.forOfStatement(
          b.variableDeclaration(
            'let',
            [b.identifier('field')]),
          b.memberExpression(
            b.identifier('obj'), b.identifier(value_mask_name)),
          b.blockStatement([
            b.callStatement(
              b.memberExpression(
                b.identifier('value'), b.identifier('set')),
              [
                b.identifier('field'),
                b.callExpression(
                  b.memberExpression(
                    b.thisExpression(), b.identifier('readCARD32')),
                  [])
              ])
            ])));

        write_stmts.push(b.forOfStatement(
          b.variableDeclaration(
            'let',
            [b.identifier('field')]),
          b.identifier('value_enum'),
          b.blockStatement([
            b.callStatement(
              b.memberExpression(
                b.thisExpression(), b.identifier('writeCARD32')),
              [b.callExpression(
                b.memberExpression(
                  b.identifier('value'), b.identifier('get')),
                [b.identifier('field')])])
            ])));
      case 'reply':
        // Don't handle replies here, just ignore them
      case 'doc':
        // Don't handle docs
        break;
      default:
        throw new Error(`Unknown tag ${child_tag}`);
    }
    if (i === 0) {
      switch(type) {
        case 'request':
          read_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('moveCursor')),
              [b.literal(2)])));
          write_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('moveCursor')),
              [b.literal(2)])));
          break;
        case 'reply':
          read_stmts.push(
            b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(
                b.identifier('obj'), b.identifier('sequence')),
              b.callExpression(
                b.memberExpression(
                  b.thisExpression(),
                  b.identifier('readCARD16')),
                []))));
          read_stmts.push(
            b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(
                b.identifier('obj'), b.identifier('length')),
              b.callExpression(
                b.memberExpression(
                  b.thisExpression(),
                  b.identifier('readCARD32')),
                []))));
          write_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('writeCARD16')),
              [b.memberExpression(
                b.identifier('obj'),
                b.identifier('sequence'))])));
          write_stmts.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('moveCursor')),
              [b.literal(4)])));
          break;
      }
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
  return [read_stmts, write_stmts, fields];
}

module.exports.parseOp = parseOp;
