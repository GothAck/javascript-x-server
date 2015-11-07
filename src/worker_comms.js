import * as x_protocol from './x_protocol';
import * as x_protocol_new from './x_protocol_new';
import * as EndianBuffer from './endianbuffer';

var XProtocolServer = x_protocol.XProtocolServer;

if (1) {
  XProtocolServer = x_protocol_new.XProtocolServer;
}

var string_split = /(\w+)(\s\w+){0,1}$/
self.console = console;
var buffer = null
  , clients = {}
  , server = null;

var socket = null;
self.addEventListener('message', function (event) {
  switch (event.data.cmd) {
    case 'connect':
      if (server)
        return postMessage({ cmd: 'error', message: 'Server exists!' });
      var socket = new WebSocket('ws://' + event.data.address, 'x11-proxy');
      socket.binaryType = 'arraybuffer';
      server = new XProtocolServer(socket, function () {
        postMessage({ cmd: 'close' })
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
    case 'reply':
      if (! server)
        return postMessage({ cmd: 'error', message: 'not connected' })
      if (! server.clients[event.data.id])
        throw new Error('Invalid client! Disconnected?');
      server.serverReply(event.data);
    break;
  }
});
self.postMessage({ cmd: 'loaded' });
