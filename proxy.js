var connect = require('connect')
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , path = require('path')
  , net = require('net')
  , WSS = require('websocket').server
  , child_process = require('child_process')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

var app = connect()
  .use(connect.static('public'))
  .use(connect.query())
  .use(function (req, res, next) {
    var _url = url.parse(req.url)
    console.log(_url);
    if (/^\/(fonts|pixmaps)\/{0,1}$/.test(_url.pathname))
      fs.readdir(path.join(__dirname, 'public', _url.pathname), function (err, dir) {
        if (err)
          return next(err);
        if (req.query.filter)
          try {
            var re = new RegExp('^'+req.query.filter.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1").replace(/\\([*?])/g, '.$1')+'\..*$');
            console.log(re);
            dir = dir.filter(re.test.bind(re));
          } catch (e) {
            return next(e);
          }
        res.end(JSON.stringify(dir));
      });
    else
      next()
  })

var server = http.createServer(app).listen(3000);

var screens = [41];

var wss = new WSS({
    httpServer: server
  , autoAcceptConnections: false
});

function X11Proxy (screen, connection, window_manager) {
  var self = this;
  this.screen = screen;
  this.connection = connection;
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
    , id = socket.remotePort;
  this.client_sockets[id] = socket;
  this.connection.sendUTF('NEW ' + id);
  socket.on('close', function () {
    self.connection.sendUTF('END ' + id);
    delete self.client_sockets[id];
  });
  socket.on('data', function (data) {
    var buffer = new Buffer(data.length + 2);
    data.copy(buffer, 2);
    buffer.writeUInt16BE(id, 0);
    self.connection.sendBytes(buffer);
  });
}
X11Proxy.prototype.data = function (message) {
  if (message.type === 'utf8') {
    var data = message.utf8Data.split(' ');
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
    var data = message.binaryData;
    this.client_sockets[data.readUInt16LE(0)].write(data.slice(2));
  }
}
X11Proxy.prototype.close = function () {
  var self = this;
  console.log('closed');
  clearTimeout(this.ping.timeout);
  clearInterval(this.ping.interval);
  this.processes.forEach(function (process) {
    process.kill();
  });
  Object.keys(this.client_sockets).forEach(function (id) {
    self.client_sockets[id].end();
  })
  try {
    this.server_socket.close();
  } catch (e) {}
  screens.push(this.screen);
}
X11Proxy.prototype.spawnProcess = function (command, arguments) {
  var env = {};
  Object.keys(process.env)
    .forEach(function (k) {
      env[k] = process.env[k];
    });
  env.DISPLAY = 'localhost:' + this.screen;
  this.processes.push(
    child_process.spawn(command, arguments || [], { stdio: 'inherit', env: env})
  );
}

wss.on('request', function (req) {
  var screen = screens.shift();

  if (!(req.origin && screen)) {
    console.log('reject');
    return req.reject();
  }
  console.log('New client');
  var proxy = new X11Proxy(screen, req.accept('x11-proxy', req.origin), 'blackbox');
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

