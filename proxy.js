var express = require('express')
  , http = require('http')
  , net = require('net')
  , WSS = require('websocket').server
  , child_process = require('child_process')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , ipv6 = require('ipv6')
  , lib_fonts = require('./lib/fonts');

var app = exports.app = express()
  .use(express.logger())
  .use(express.static('public'));

app.get('/fonts', function (req, res) {
    lib_fonts.list_fonts(req.query.filter)
      .when(function (err, fonts) {
        if (err)
          return res.send(500, err);
        res.send(fonts);
      });
  })

var server = exports.server = http.createServer(app)

if (require.main === module)
  server.listen(3000);

var screens = [41];

var wss = new WSS({
    httpServer: server
  , autoAcceptConnections: false
});

function X11Proxy (screen, connection, window_manager) {
  var self = this;
  this.screen = screen;
  this.connection = connection;

  this.id = ['family', 'address', 'port']
    .map(function (k) { return connection.socket._peername[k] })
    .join(':');
  this.client_sockets = {};
  this.ping = {
      counter: 0
    , interval: null
    , timeout: null
    , start: null
    , results: []
    , average: 0
  };
  this.processes = [];
  this.connection.on('message', this.data.bind(this));
  this.connection.on('close', this.close.bind(this));
  this.connection.sendUTF('SCR ' + this.screen);
  this.server_socket = net.createServer(this.newClient.bind(this)).listen(6000 + this.screen);
  if (window_manager)
    setTimeout(function () {
      self.spawnProcess(window_manager);
    }, 750);
}
util.inherits(X11Proxy, EventEmitter);
X11Proxy.prototype.newClient = function (socket) {
  var self = this
    , idBuf = new Buffer(19)
    , idStr;
  idBuf.fill(0);
  idBuf.writeUInt16BE(socket.remotePort, 16);
  if (net.isIPv4(socket.remoteAddress)) {
    idBuf.writeUInt8(4, 18);
    idBuf = socket.remoteAddress.split('.')
      .reduce(
          function (o, v, i) {
            o.writeUInt8(v, i);
            return o;
          }
        , idBuf
      );
  } else {
    idBuf.writeUInt8(6, 18);
    idBuf = (new ipv6.v6.Address(socket.remoteAddress)).parsedAddress
      .reduce(
          function (o, v, i) {
            o.writeUInt16BE(b, i * 2);
            return o;
          }
        , idBuf
      );
  }
  idStr = idBuf.toString('hex');

  this.client_sockets[idStr] = socket;
  this.connection.sendUTF('NEW ' + idStr);
  socket.on('close', function () {
    self.connection.sendUTF('END ' + idStr);
    delete self.client_sockets[idStr];
  });
  socket.on('data', function (data) {
    var buffer = new Buffer(data.length + 19);
    idBuf.copy(buffer, 0)
    data.copy(buffer, 19);
    self.connection.sendBytes(buffer);
  });
}
X11Proxy.prototype.data = function (message) {
  if (message.type === 'utf8') {
    var data = (message.utf8Data || '').split(' ');
    switch (data[0]) {
      case 'PONG':
        if (data[1] == this.ping.counter - 1) {
          this.ping.results.unshift(Date.now() - this.ping.start);
          this.ping.results.splice(10, 10);
          this.ping.average = this.ping.results.reduce(function (o, v) { return o + v }) / this.ping.results.length
          clearTimeout(this.ping.timeout);
          this.ping.timeout = null;
        } else {
          console.log('Out of order ping', data[1], this.ping.counter - 1);
        }
      break;
    }
  } else {
    var data = message.binaryData
      , length = data.readUInt8(0)
      , id = data.toString('ascii', 1, length + 1);
    if (this.client_sockets[id] && this.client_sockets[id].writable) {
      this.client_sockets[id].write(data.slice(length + 1));
    } else {
      console.error('Socket closed already', length, id);
      this.connection.sendUTF('END ' + id);
    }
  }
}
X11Proxy.prototype.close = function () {
  console.log('closed');
  clearTimeout(this.ping.timeout);
  clearInterval(this.ping.interval);
  this.processes.forEach(function (process) {
    process.kill();
  });
  Object.keys(this.client_sockets).forEach(function (id) {
    this.client_sockets[id].end();
  }, this);
  try {
    this.server_socket.close();
  } catch (e) {}
  screens.push(this.screen);
}
X11Proxy.prototype.spawnProcess = function (command, arguments) {
  var env = {}
    , prefix
    , child;
  Object.keys(process.env)
    .forEach(function (k) {
      env[k] = process.env[k];
    });
  env.DISPLAY = 'localhost:' + this.screen;
  this.processes.push(
    child = child_process.spawn(command, arguments || [], { env: env })
  );
  prefix = [this.id, child.pid, command, ': \t'].join(' ');
  function handleOutput (data) {
    console.log(prefix, data.toString().replace('\n', '\n' + prefix + ' '));
  }
  child.stdout.on('data', handleOutput);
  child.stderr.on('data', handleOutput);
}

wss.on('request', function (req) {
  var screen = screens.shift();

  if (!(req.origin && screen)) {
    console.log('reject');
    return req.reject();
  }
  console.log('New client');
  var proxy = new X11Proxy(screen, req.accept('x11-proxy', req.origin)); //, 'blackbox' Don't load blackbox by default
/*
  ping_interval = setInterval(function () {
    var counter = ping_counter ++;
    con.sendUTF('PING ' + counter);
    ping_start = Date.now();
    ping_timeout = setTimeout(function () {
      console.log('Ping timeout', counter);
      ping_timeout = null;
    }, 500);
  }, 5000);
*/
});

