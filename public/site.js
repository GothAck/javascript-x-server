require(['util', 'endianbuffer', 'x_server', 'x_types'], function (util, EndianBuffer, XServer, x_types) {
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
          case 'PING':
            socket.send('PONG ' + data[1]);
          break;
          default:
            console.log(data);
        }
      } else {
        server.processData(new EndianBuffer(event.data));
      }
    }

    socket.onclose = function () {
      if (server)
        server.disconnect();
      server = window.server = null;
      socket = null;
      $('h1').text('Disconnected');
      $('h2').text('0 clients');
      $('.screen').children().children().remove();
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
    var event_mask_map = {
            KeyPress      : 'keydown'
          , KeyRelease    : 'keyup'
          , ButtonPress   : 'mousedown'
          , ButtonRelease : 'mouseup'
          , PointerMotion : 'mousemove'
          , EnterWindow   : 'mouseover'
          , LeaveWindow   : 'mouseout'
          , FocusChange   : 'focus blur'
        }
      , event_map = {
            keydown   : 'KeyPress'
          , keyup     : 'KeyRelease'
          , mousedown : 'ButtonPress'
          , mouseup   : 'ButtonRelease'
          , mousemove : 'MotionNotify'
          , mouseover : 'EnterNotify'
          , mouseout  : 'LeaveNotify'
          , focus     : 'FocusIn'
          , blur      : 'FocusOut'
        }
      , mouse_buttons = [1,3,2]
      , current_mouse = 0;
    $('.screen').on('mousedown mouseup', function (event) {
      if (event.type === 'mousedown')
        current_mouse |= 1 << (mouse_buttons[event.button] - 1);
      else
        current_mouse &= ~ (1 << (mouse_buttons[event.button] - 1));
    });
    Object.keys(event_mask_map).forEach(function (_class) {
      var _event = event_mask_map[_class];
      $('.screen').on(_event, '.' + _class, function (event) {
        var $event = $(this)
          , $child = $(event.target).parent().parent()
          , xob_event = $event.data('xob')
          , xob_child = $child.data('xob')
          , keybutmask = (
                current_mouse |
                (
                    event.type === 'mousedown' &&
                    (1 << (mouse_buttons[event.button] - 1))
                )
            ) << 8;
        keybutmask |= event.shiftKey && 1;
        // lock? = 2
        keybutmask |= event.ctrlKey  && 4;
        xob_event && xob_event.event(
            event_map[event.type]
          , {
                x: event.offsetX
              , y: event.offsetY
              , button: mouse_buttons[event.button]
              , keycode: event.keyCode
              , keybutmask: keybutmask
              , event: xob_event
              , child: xob_child
            }
        );
        return false;
      });
    });
    $('.screen').on('contextmenu', '*', function () { return false; });
  });

  $(connect);
});
