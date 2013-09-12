define('worker_console', function () {
  var window = this;
  var counter = 0;
  if (window.document === undefined) {
    if (window.console === undefined) {
      console = ([
          'log'
        , 'warn'
        , 'error'
        , 'debug'
        , 'group'
        , 'groupEnd'
        , 'time'
        , 'timeEnd'
      ].reduce(
          function (o, func) {
            o[func] = function () {
              this._channel.port1.postMessage({ func: func, arguments: Array.prototype.slice.call(arguments), stack: (new Error).stack, count: counter++ });
            };
            return o;
          }
        , {}
      ));
      console._channel = new MessageChannel;
      postMessage('console', [console._channel.port2]);
      console.worker = true;
    } else {
      postMessage('consolenotrequired');
    }
  } else {
    console.wrapWorker = function (worker) {
      worker._console_port = null;
      function messageHandler (event) {
        if (event.data === 'consolenotrequired') {
          worker.removeEventListener('message', messageHandler);
          event.stopImmediatePropagation();
          return false;
        }
        if (event.data !== 'console')
          return true;
        worker._console_port = event.ports[0];
        worker._console_port.onmessage = function (event) {
          console.error(event, event.data)
          var data = event.data
            , args = data.arguments;
          args.push('\tFrom worker ' + data.stack.split('\n')[2].trimLeft());
          console[data.func].apply(console, args);
        }
        worker.removeEventListener('message', messageHandler);
        event.stopImmediatePropagation();
        return false;
      }
      worker.addEventListener('message', messageHandler);
      worker.addEventListener('error', function (event) {
        console.error(event);
      });
      return worker;
    }
  }
  return console;
});