define('worker_console', function () {
  var window = this;
  if (window.document === undefined) {
    console = ([
        'log'
      , 'warn'
      , 'error'
      , 'debug'
      , 'group'
      , 'groupEnd'
    ].reduce(
        function (o, func) {
          o[func] = function () {
            try {
              throw new Error
            } catch (e) {
              postMessage({ cmd: 'console', func: func, arguments: arguments, stack: e.stack });
            } 
          };
          return o;
        }
      , {}
    ));
    console.worker = true;
  } else {
    console.wrapWorker = function (worker) {
      worker.addEventListener('message', function (event) {
        if (event.data.cmd !== 'console')
          return true;
        console[event.data.func].bind(console)(event.data.arguments, event.data.stack.split('\n')[2]);
        event.stopImmediatePropagation();
      });
      worker.addEventListener('error', function (event) {
        console.error(event);
      });
      return worker;
    }
  }
  return console;
});