function getTextFile (filename, callback) {
  var req = new XMLHttpRequest();
  req.open('GET', window.location.protocol + '//' + window.location.host + '/' + filename, true);
  req.onerror = function (event) {
    callback(req.status || event || 'Unknown Error');
    callback = new Function;
  }
  req.onload = function (event) {
    callback(req.status === 200 ? null : req.status, req.responseText);
  }
  req.send();
}

function getFile (filename, callback) {
  var req = new XMLHttpRequest();
  req.open('GET', window.location.protocol + '//' + window.location.host + '/' + filename, true);
  req.responseType = 'arraybuffer';
  req.onerror = function (event) {
    callback(req.status || event || 'Unknown Error');
    callback = new Function;
  }
  req.onload = function (event) {
    callback(req.status === 200 ? null : req.status, req.response);
  }
  req.send();
}

function getDir (dir, filter, callback) {
  var req = new XMLHttpRequest();
  console.log(window.location.origin + '/' + dir + ((filter && ('/?filter=' + filter)) || ''));
  req.open('GET', window.location.origin + '/' + dir + ((filter && ('/?filter=' + filter)) || ''), true);
  req.onload = function () {
    callback(req.status === 200 ? null : req.status, req.responseText && JSON.parse(req.responseText));
  }
  req.send();
}

function connect () {
  var server
    , socket = new WebSocket('ws://localhost:3000', 'x11-proxy');
  socket.binaryType = 'arraybuffer';

  socket.onmessage = function (event) {
    if (event.data.constructor === String) {
      var data = event.data.split(' ');
      switch (data[0]) {
        case 'SCR':
          server = window.server = new XServer(data[1], socket, $('.screen'));
          $('h1').text('Screen :' + data[1]);
          $('h2').text('0 clients');
        break;
        case 'NEW':
          var id = data[1] ^ 0;
          server.newClient(data[1] ^ 0);
          $('h2').text(Object.keys(server.clients).length + ' clients');
        break;
        case 'END':
          server.disconnect(data[1] ^ 0);
          $('h2').text(Object.keys(server.clients).length + ' clients');
        break;
        default:
          console.log(data);
      }
    } else {
      server.processData(new Buffer(event.data));
    }
  }

  socket.onclose = function () {
    if (server)
      server.disconnect();
    server = window.server = null;
    socket = null;
    $('h1').text('Disconnected');
    $('h2').text('0 clients');
    $('.screen').children().remove();
    $('.buffers').children().remove();
    setTimeout(connect, 2500);
  }
}

$(function () {
  var test_string = 'mmmmmmmmmwwwwwww'
    , test_font = 'Comic Sans MS'
    , not_installed_width = 0
    , tester = $('<span />').css({
          position: 'absolute'
        , left: '-999px'
        , top: '0'
        , visibility: 'hidden'
        , 'font-size': '50px'
        , 'font-family': '"' + test_font + '"'
      }).text(test_string);

  $('body').prepend(tester);
  not_installed_width = tester.width();
  tester.remove();
  window.testFont = function (font_family) {
    tester.css({ 'font-family': '"' + font_family +'", "' + test_font + '"' });
    $('body').prepend(tester);
    var installed = tester.width() !== not_installed_width;
    tester.remove();
    return installed;
  }
});

$(function () {
  var event_map = {
      KeyPress      : 'keydown'
    , KeyRelease    : 'keyup'
    , PointerMotion : 'mousemove'
    , EnterWindow   : 'mouseover'
    , LeaveWindow   : 'mouseout'
  }
  Object.keys(event_map).forEach(function (_class) {
    var _event = event_map[_class];
    $('.screen').on(_event, '.' + _class, function (event) {
      var $this = $(this)
        , xob = $this.data('xob');
      xob && xob.event(_class, { x: event.offsetX, y: event.offsetY });
    });
  });
});

window.loaders.forEach(function (loader) {
  $(loader);
});

$(connect);
