import { GCVField, WinVField, WinConfigureField } from './common';
import * as x_types from './x_types';
import EndianBuffer from './endianbuffer';
import { v6 } from 'ip-address';

import XTypeBuffer from './xtypebuffer';

export class XProtocolServer  {
  constructor(socket, onClose) {
    console.log('new XProtocolServer')
    this.socket = socket;
    this.onClose = onClose;
    this.clients = {};
    socket.addEventListener('message', (e) => this.socketMessage(e));
    socket.addEventListener('close', (e) => this.socketClose(e));
    socket.addEventListener('open', (e) => this.socketOpen(e));
  }
  serverMessage(message) {
    var client = this.clients[message.id];
    if (! client)
      postMessage({ cmd: 'error', message: 'not connected?' });
    client.state = message.state;
    var data = new EndianBuffer(message.data)
      , buffer = new EndianBuffer(data.length + client.id.length + 1);
    buffer.writeUInt8(client.id.length, 0);
    buffer.write(client.id, 1, null, 'ascii');
    data.copy(buffer, client.id.length + 1);
    this.socket.send(buffer.buffer);
  }
  serverReply(message) {
    try {
      var client = this.clients[message.id]
        , ReqObj = Request[Request.opcodes[message.data.opcode]]
        , Rep = ReqObj.Rep;
      var rep = new Rep(message.data, client)
      var data = rep.toBuffer()
        , buffer = new EndianBuffer(data.length + client.id.length + 1);
      buffer.writeUInt8(client.id.length, 0);
      buffer.write(client.id, 1, null, 'ascii');
      data.copy(buffer, client.id.length + 1);
      this.socket.send(buffer.buffer);
    } catch (e) {
      console.error(e.toString(), e.stack);
    }
  }
  socketMessage(event) {
    if (event.data.constructor === String) {
      var data = event.data.split(' ');
      switch (data[0]) {
        case 'SCR':
          postMessage({
              cmd: 'screen'
            , id: data[1]
          });
        break
        case 'NEW':
          var client = this.clients[data[1]] = new XProtocolClient(data[1]);
          postMessage({
              cmd: 'new'
            , id: data[1]
            , host: client.host
            , port: client.port
            , host_type: client.host_type
          });
        break;
        case 'END':
          this.clients[data[1]].end();
          delete this.clients[data[1]]
        break;
        case 'PING':
          this.socket.send('PONG');
        break;
        default:
          console.error('Unknown message received', data.join(' '));
      }
    } else {
      var data = new EndianBuffer(event.data)
        , idBuf = data.slice(0,19)
        , idStr = idBuf.toString('hex');
      if (! this.clients[idStr])
        throw new Error('Invalid client! Disconnected?');
      this.clients[idStr].processData(data.slice(19));
    }
  }
  socketClose(event) {
    postMessage({ cmd: 'close' });
    this.socket = null;
    this.onClose && this.onClose();
  }
  socketOpen(event) {
    postMessage({ cmd: 'open' });
  }
}
