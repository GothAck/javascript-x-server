module.exports = function(fileInfo, api) {
  var j = api.jscodeshift;

  return j(fileInfo.source)
    .find(j.MethodDefinition)
    .filter(p => p.parent.parent.value.id.name === 'XServerClient')
    .filter(p => p.value.value.params.map(p => p.name).indexOf('rep') === -1)
    .find(j.VariableDeclaration)
    .filter(p => p.value.declarations.filter(d => d.id.name === 'rep').length)
    .replaceWith(p => {
      p.value.declarations = p.value.declarations.filter(d => d.id.name !== 'rep');
      if (p.value.declarations.length > 0) {
        return p.value;
      }
      return null;
    })
    .closest(j.MethodDefinition)
    .filter(p => /^[A-Z]/.test(p.value.key.name))
    .forEach(p => {
      p.value.value.params.push(j.identifier('rep'));
      if (!p.value.value.body.body.filter(n => n && n.type === 'ReturnStatement').length) {
        console.log(p.value.key.name, 'did not have a ReturnStatement');
        p.value.value.body.body.push(j.returnStatement(j.identifier('rep')));
      }
    })
    .find(j.VariableDeclaration)
    .filter(p => p.value.declarations.length > 1)
    .replaceWith(p =>
      p.value.declarations.map(d => j.variableDeclaration(
        p.value.kind,
        [d]
      )))
    .toSource({quote: 'single'});
}
