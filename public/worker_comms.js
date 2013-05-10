if (typeof define === 'undefined' && typeof importScripts !== 'undefined')
  importScripts('lib/require.js');

var string_split = /(\w+)(\s\w+){0,1}$/

require(
    ['worker_console', 'x_protocol', 'endianbuffer']
  , function (console, x_protocol, EndianBuffer) {
      var buffer = null
        , clients = {}
        , server = null;
      
      var socket = null;
      addEventListener('message', function (event) {
        switch (event.data.cmd) {
          case 'connect':
            if (server)
              return postMessage({ cmd: 'error', message: 'Server exists!' });
            var socket = new WebSocket('ws://' + event.data.address, 'x11-proxy');
            socket.binaryType = 'arraybuffer';
            server = new x_protocol.XProtocolServer(socket, function () {
              server = null;
            });
          break;
          case 'disconnect':
            if (! server)
              return postMessage({ cmd: 'error', message: 'not connected' })
            socket.close();
          break;
          case 'message':
            if (! server)
              return postMessage({ cmd: 'error', message: 'not connected' })
            if (! server.clients[event.data.id])
              throw new Error('Invalid client! Disconnected?');
            server.serverMessage(event.data);
          break;
        }
      });
    }
)