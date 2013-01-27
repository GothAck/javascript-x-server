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
    , sockets = {};

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
  con.on('message', function (message) {
    if (message.type === 'utf8') {
      console.log('data');
    } else {
      var data = message.binaryData;
      sockets[data.readUInt16LE(0)].write(data.slice(2));
    }
  });
  con.on('close', function () {
    console.log('closed');
    Object.keys(sockets).forEach(function (id) {
      sockets[id].end();
    })
    local_socket.close();
    screens.push(screen);
  });
});

