import {wrapCallSite} from 'source-map-support';

var prefix0 = /^0+/;

function prepareStackTrace(error, stack) {
  error._xclient = null;
  return error + stack.map(function(frame) {
    var cs = wrapCallSite(frame, false);

    if (!(cs.isToplevel() || cs.isConstructor())) {
      var th = cs.getThis() || '';
      if (th.constructor.name === 'XServerClient') {
        error._xclient = th;
      }
      var id = th.id || '';
      if (id) {
        id = '<' + String(id).replace(prefix0, '') + '>';
      }
      var typename = cs.getTypeName();
      cs.getTypeName = () => typename + id;
    }
    return '\n    at ' + cs;
  }).join('');
}

Error.prepareStackTrace = prepareStackTrace;

console.info('StackMagick™ loaded');

if (process.env.NODE_EXPERIMENTAL) {
  var _log = console.log;

  console.log = function log (...args) {
    var e = new Error;
    e.stack.toString();
    if (e._xclient) {
      console::_log(e._xclient.id, ...args);
    } else {
      console::_log(...args);
    }
  }
}
