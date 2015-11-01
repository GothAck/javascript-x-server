"use strict";
var { builders :b } = require('ast-types');
var parseBody = require('./statement_body');

module.exports = function genErrors(doc, klass, klasses) {
  var enums = new Map();

  for (let _enum of doc.find('enum')) {
    let name = _enum.attr('name').value();
    let values = new Map();
    let bits = new Map();

    if (name === 'Atom') {
      // TODO: Bojizzle the Atom Enum
      console.error('TODO: Implement Atom Enum');
      continue;
    }

    var parent_klass = `${_enum.find('*/bit').length ? 'Bit' : 'Value'}Enum`;

    var enum_klass = klasses.newClass(`${name}Enum`, parent_klass);
    enums.set(name, b.identifier(enum_klass.name));

    for (let item of _enum.find('item')) {
      let item_name = item.attr('name').value();
      let child = item.get('*');

      if (!child) {
        console.error('Enum item without a child, wut?!', item_name);
        continue;
      }
      let item_value = parseInt(child.text());

      switch (child.name()) {
        case 'value':
          values.set(item_value, item_name);
          break;
        case 'bit':
          bits.set(item_value, item_name);
          break;
        default:
          throw new Error(`Unknown child type ${child.name()}`);
      }
    }

    if (values.size) {
      enum_klass.addProperty('_values', values, true);
    }
    if (parent_klass === 'BitEnum' && bits.size) {
      enum_klass.addProperty('_bits', bits, true);
    }
  }

  klass.addProperty('enums', enums, true);
}
