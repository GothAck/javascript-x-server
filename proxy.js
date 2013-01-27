var connect = require('connect')
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , path = require('path')
  , net = require('net')
  , WSS = require('websocket').server;

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

wss.on('request', function (req) {
  var screen = screens.shift();

  if (!(req.origin && screen)) {
    console.log('reject');
    return req.reject();
  }

  var con = req.accept('x11-proxy', req.origin)
    , sockets = {}
    , ping_counter = 0
    , ping_interval = null
    , ping_timeout = null
    , ping_start = null
    , ping_results = []
    , ping_average = 0;

  console.log('connected', screen);
  con.sendUTF('SCR ' + screen);
  var local_socket = net.createServer(function (socket) {
    var id = socket.remotePort;
    sockets[id] = socket;
    console.log('New client', id);
    con.sendUTF('NEW ' + id);
    socket.on('close', function () {
      con.sendUTF('END ' + id);
      delete sockets[id];
    });
    socket.on('data', function (data) {
      var buffer = new Buffer(data.length + 2);
      data.copy(buffer, 2);
      buffer.writeUInt16BE(id, 0);
      con.sendBytes(buffer);
    });
  }).listen(6000 + screen);

  ping_interval = setInterval(function () {
    var counter = ping_counter ++;
    con.sendUTF('PING ' + counter);
    ping_start = Date.now();
    ping_timeout = setTimeout(function () {
      console.log('Ping timeout', counter);
      ping_timeout = null;
    }, 500);
  }, 5000);

  con.on('message', function (message) {
    if (message.type === 'utf8') {
      var data = message.utf8Data.split(' ');
      switch (data[0]) {
        case 'PONG':
          if (data[1] == ping_counter - 1) {
            ping_results.unshift(Date.now() - ping_start);
            ping_results.splice(10, 10);
            ping_average = ping_results.reduce(function (o, v) { return o + v }) / ping_results.length
            clearTimeout(ping_timeout);
            ping_timeout = null;
          } else {
            console.log('Out of order ping', data[1], ping_counter - 1);
          }
        break;
      }
    } else {
      var data = message.binaryData;
      sockets[data.readUInt16LE(0)].write(data.slice(2));
    }
  });
  con.on('close', function () {
    console.log('closed');
    clearTimeout(ping_timeout);
    clearInterval(ping_interval);
    Object.keys(sockets).forEach(function (id) {
      sockets[id].end();
    })
    local_socket.close();
    screens.push(screen);
  });
});

