import { GCVField, WinVField, WinConfigureField } from './common';
import * as x_types from './x_types';
import EndianBuffer from './endianbuffer';
import { v6 } from 'ip-address';

import { XTypeBuffer } from './xtypebuffer';

export class XProtocolServer  {
  constructor(socket, onClose) {
    console.log('new XProtocolServer')
    this.socket = socket;
    this.onClose = onClose;
    this.clients = new Map();
    socket.addEventListener('message', (e) => this.socketMessage(e));
    socket.addEventListener('close', (e) => this.socketClose(e));
    socket.addEventListener('open', (e) => this.socketOpen(e));
    this.reply_buffer = new XTypeBuffer(64 * 1024);
  }
  serverMessage(message) {
    var client = this.clients.get(message.id);
    if (! client)
      postMessage({ cmd: 'error', message: 'not connected?' });
    client.state = message.state;
    var data = new XTypeBuffer(message.data)
      , buffer = new XTypeBuffer(data.length + client.id.length + 1);
    buffer.writeUInt8(client.id.length, 0);
    buffer.write(client.id, 1, null, 'ascii');
    data.copy(buffer, client.id.length + 1);
    this.socket.send(buffer.buffer);
  }
  serverReply(message) {
    try {
      var client = this.clients.get(message.id);
      var rep = message.data;
      var opcode = rep.opcode;
      var opname = rep.opname;

      this.reply_buffer.endian = rep.endian;
      this.reply_buffer.cursor = 0;
      this.reply_buffer.writeUInt8(client.id.length);
      this.reply_buffer.write(client.id, 1, null, 'ascii');
      this.reply_buffer.moveCursor(client.id.length);
      this.reply_buffer.writeReply(rep);

      var buf = this.reply_buffer.slice(0, this.reply_buffer.cursor - 1);

      this.socket.send(buf.buffer);
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
          var client = new XProtocolClient(data[1]);
          this.clients.set(data[1], client);
          postMessage({
              cmd: 'new'
            , id: data[1]
            , host: client.host
            , port: client.port
            , host_type: client.host_type
          });
        break;
        case 'END':
          this.clients.get(data[1]).end();
          this.clients.delete(data[1]);
        break;
        case 'PING':
          this.socket.send('PONG');
        break;
        default:
          console.error('Unknown message received', data.join(' '));
      }
    } else {
      var data = new XTypeBuffer(event.data)
        , idBuf = data.slice(0,19)
        , idStr = idBuf.toString('hex');
      if (! this.clients.has(idStr)) {
        throw new Error('Invalid client! Disconnected?');
      }
      this.clients.get(idStr).processData(data.slice(19));
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

export class XProtocolClient  {
  constructor(idStr, sendData) {
    this.id = idStr;
    this.idBuf = new XTypeBuffer(idStr);
    var host_type = this.idBuf.readUInt8(18);
    if (host_type === 4) {
      this.host_type = 'Internet';
      this.host = Array.apply(null, new Array(4))
        .map(function (v, i) {
          return this.idBuf.readUInt8(i);
        }, this)
        .join('.');
    } else {
      this.host_type = 'InternetV6';
      this.host = (new v6.Address(
          Array.apply(null, new Array(8))
            .map(function (v, i) {
              return this.idBuf.readUInt16(i * 2)
            }, this)
            .join(':')
      )).correctForm()
    }
    this.port = this.idBuf.readUInt16(16);
    this.idLog = this.host_type + '[' + this.host + ']' + this.port
    this.sendData = sendData;
    this.endian = false;
    this.state = 0;
    this.sequence = 1;
  }
  end() {
    postMessage({ cmd: 'end', id: this.id });
  }
  postRequest(request) {
    var type = request.opname
      , transferrable = [];
    Object.keys(request).forEach((name) => {
      var value = request[name];
      if (value instanceof EndianBuffer) {
        return transferrable.push(request[name] = value.buffer);
      }
    });
    postMessage({ cmd: 'request', id: this.id, type: type, request: request }, transferrable);
  }
  processData(data) {
    data.endian = this.endian;
    if (this.buffer) {
      this.buffer.append(data);
      data = this.buffer;
      delete this.buffer;
    }
    switch (this.state) {
      case 0:
        var req = data.readSetupRequest();
        req.opname = 'SetupRequest';
        this.endian = req.endian;
        this.postRequest(req);
      break;
      case 1:
        var req = { length: 0 };
        var gooj = 2000;
        while (data.length > 0) {
          gooj -= 1;
          if (gooj < 1) throw new Error('You are out of jail, have a nice day!');
          var req_str = `> Request decode (${this.idLog}) ${this.sequence}`;
          // console.time(req_str);
          req = data.readRequest();
          req.sequence = this.sequence;
          // req = Request.factory(data, this.sequence);
          // console.timeEnd(req_str);
          if (req.length > data.length) {
            this.buffer = data;
            break;
          }
          // console.time(req_str);
          this.sequence = this.sequence + 1;
          this.postRequest(req);
          if (data.length > 0)
            data = data.slice(req.length);
        }
      break;
    }
  }
}
