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

function createListPreprocess(rs, ws, lists) {
  if (lists) {
    for (let list of lists) {
      let name = list.attr('name').value();
      ws.push(b.expressionStatement(b.assignmentExpression(
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
}

function createPad(rs, ws, bytes) {
  rs.push(
    b.expressionStatement(b.callExpression(
      b.memberExpression(
        b.thisExpression(),
        b.identifier('moveCursor')),
      [b.literal(bytes)])));
  ws.push(
    b.expressionStatement(b.callExpression(
      b.memberExpression(
        b.thisExpression(),
        b.identifier('moveCursor')),
      [b.literal(bytes)])));
}

function createFieldSetupReqByteOrder(rs, ws, child_name) {
  rs.push(
    b.expressionStatement(b.assignmentExpression(
      '=',
      b.memberExpression(b.identifier('obj'), b.identifier('endian')),
      b.binaryExpression(
        '!==',
        b.memberExpression(
          b.identifier('obj'), b.identifier('byte_order')),
        b.literal(66))
    )));
  rs.push(
    b.expressionStatement(b.assignmentExpression(
      '=',
      b.memberExpression(
        b.thisExpression(), b.identifier('endian')),
      b.memberExpression(b.identifier('obj'), b.identifier('endian'))
    )));
}

function createField(rs, ws, child_name, child_type, parent_name) {
  if (child_type !== 'STRING8') {
    rs.push(
      b.expressionStatement(b.assignmentExpression(
        '=',
        b.memberExpression(
          b.identifier('obj'), b.identifier(child_name)),
        b.callExpression(
          b.memberExpression(
            b.thisExpression(),
            b.identifier(`read${child_type}`)),
          []))));
    ws.push(
      b.expressionStatement(b.callExpression(
        b.memberExpression(
          b.thisExpression(),
          b.identifier(`write${child_type}`)),
        [b.memberExpression(
          b.identifier('obj'),
          b.identifier(child_name))])));
  } else {
    createListNormal(rs, ws, child_name, 'char', b.memberExpression(b.identifier('obj'), b.identifier(`${child_name}_len`)));
  }
  if (parent_name === 'SetupRequest' && child_name === 'byte_order') {
    createFieldSetupReqByteOrder(rs, ws, child_name);
  }
}

function createListVoid(rs, ws, child_name) {
  rs.push(b.assignmentStatement(
    '=',
    b.memberExpression(b.identifier('obj'), b.identifier(child_name)),
    b.callExpression(
      b.memberExpression(
        b.thisExpression(), b.identifier('cursorSlice')),
      [b.identifier(`${child_name}_length`)])));
  ws.push(b.callStatement(
    b.memberExpression(
      b.thisExpression(), b.identifier('cursorWriteBuffer')),
    [b.memberExpression(
      b.identifier('obj'), b.identifier(child_name))]));
}

function createListNormal(rs, ws, child_name, child_type, fieldref) {
  if (fieldref !== null) {
    rs.push(b.variableDeclaration(
      'var',
      [b.variableDeclarator(
        b.identifier(`${child_name}_length`),
        fieldref)]));
  }
  ws.push(b.variableDeclaration(
    'var',
    [b.variableDeclarator(
      b.identifier(`${child_name}_length`),
      fieldref)]));
  rs.push(b.expressionStatement(b.assignmentExpression(
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
    rs.push(
      b.whileStatement(
        b.binaryExpression(
          '<',
          b.memberExpression(
            b.thisExpression(), b.identifier('cursor')),
          b.memberExpression(
            b.thisExpression(), b.identifier('length'))),
        b.blockStatement([read_stmt])));
  } else {
    rs.push(
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
    rs.push(b.assignmentStatement(
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
  ws.push(
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

function createList(rs, ws, child_name, child_type, fieldref) {
  if (child_type === 'void') {
    createListVoid(rs, ws, child_name);
  } else {
    createListNormal(rs, ws, child_name, child_type, fieldref);
  }
}

function createExprField(rs, ws, child_name, child_type, fieldref) {
  rs.push(
    b.expressionStatement(b.assignmentExpression(
      '=',
      b.memberExpression(
        b.identifier('obj'), b.identifier(child_name)),
      b.callExpression(
        b.memberExpression(
          b.thisExpression(),
          b.identifier(`read${child_type}`)),
        []))));
  ws.push(b.expressionStatement(b.assignmentExpression(
    '=',
    b.memberExpression(
      b.identifier('obj'), b.identifier(child_name)),
    fieldref)));
}

function createValueParam(
  rs, ws,
  enum_map,
  value_list_name,
  value_mask_name,
  value_mask_type,
  enum_class_name
) {
  rs.push(b.expressionStatement(b.assignmentExpression(
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

  ws.push(b.variableDeclaration(
    'var',
    [b.variableDeclarator(
      b.identifier('value'),
      b.memberExpression(b.identifier('obj'), b.identifier('value'))
      )]));
  ws.push(b.variableDeclaration(
    'var',
    [b.variableDeclarator(
      b.identifier('value_enum'),
      b.newExpression(
        b.identifier(enum_class_name),
        [b.callExpression(b.memberExpression(
          b.identifier('value'), b.identifier('keys')), [])]))]));
  ws.push(b.callStatement(
    b.memberExpression(
      b.thisExpression(), b.identifier(`write${value_mask_type}`)),
    [b.callExpression(b.memberExpression(
      b.identifier('value_enum'),
      b.identifier('encode')), [])]));

  if (value_mask_type === 'CARD16') {
    createPad(rs, ws, 2);
  }

  rs.push(
    b.variableDeclaration(
      'var',
      [b.variableDeclarator(
        b.identifier('value'),
        b.newExpression(b.identifier('Map'), []))]));

  rs.push(b.expressionStatement(
    b.assignmentExpression(
      '=',
      b.memberExpression(
        b.identifier('obj'), b.identifier('value')),
      b.identifier('value'))));

  rs.push(b.forOfStatement(
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

  ws.push(b.forOfStatement(
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
}

module.exports = function parseBody(parent, klasses, type) {
  let children = parent.find('*');
  let parent_name = parent.attr('name') && parent.attr('name').value();
  let rs = [];
  let ws = [];
  let fields = new Map();
  
  let lists = parent.find('list');

  createListPreprocess(rs, ws, lists);

  for (let [i, child] of children.entries()) {
    let child_tag = child.name();
    switch (child_tag) {
      case 'pad':
        let bytes = parseInt(child.attr('bytes').value());
        createPad(rs, ws, bytes);
        break;
      case 'field':
        {
          let child_name = child.attr('name').value();
          let child_type = child.attr('type').value();
          fields.set(child_name, child_type);
          createField(rs, ws, child_name, child_type, parent_name);
        }
        break;
      case 'list':
        {
          let child_name = child.attr('name').value();
          let child_type = child.attr('type').value();
          let fieldref = parseOp(child.get('*'), 'obj');
          fields.set(child_name, [child_type]);
          createList(rs, ws, child_name, child_type, fieldref);
        }
        break;
      case 'exprfield':
        {
          let child_name = child.attr('name').value();
          let child_type = child.attr('type').value();
          let fieldref = parseOp(child.get('*'), 'obj');
          createExprField(rs, ws, child_name, child_type, fieldref);
        }
        break;
      case 'valueparam':
        {
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

          createValueParam(
            rs, ws,
            enum_map,
            value_list_name,
            value_mask_name,
            value_mask_type,
            enum_class_name);
        }
        break;
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
          createPad(rs, ws, 2);
          break;
        case 'reply':
          rs.push(
            b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(
                b.identifier('obj'), b.identifier('sequence')),
              b.callExpression(
                b.memberExpression(
                  b.thisExpression(),
                  b.identifier('readCARD16')),
                []))));
          rs.push(
            b.expressionStatement(b.assignmentExpression(
              '=',
              b.memberExpression(
                b.identifier('obj'), b.identifier('length')),
              b.callExpression(
                b.memberExpression(
                  b.thisExpression(),
                  b.identifier('readCARD32')),
                []))));
          ws.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('writeCARD16')),
              [b.memberExpression(
                b.identifier('obj'),
                b.identifier('sequence'))])));
          ws.push(
            b.expressionStatement(b.callExpression(
              b.memberExpression(
                b.thisExpression(),
                b.identifier('moveCursor')),
              [b.literal(4)])));
          break;
      }
    }
  }
  if (rs.length) {
    rs.unshift(
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(
          b.identifier('obj'),
          b.objectExpression([]))]));
    rs.push(b.returnStatement(b.identifier('obj')));
  } else {
    rs.push(b.returnStatement(b.objectExpression([])));
  }
  return [rs, ws, fields];
}

module.exports.parseOp = parseOp;
