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
            document.title = 'X Session :' + data[1];
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
            KeyPress        : 'keydown'
          , KeyRelease      : 'keyup'
          , ButtonPress     : 'mousedown'
          , ButtonRelease   : 'mouseup'
          , PointerMotion   : 'mousemove'
          , EnterWindow     : 'mouseover'
          , LeaveWindow     : 'mouseout'
          , FocusChange     : 'focus blur'
          , PropertyNotify  : 'property_change'
          , Exposure        : ''
          , MapNotify       : ''
        }
      , do_not_propagate_event_mask_map = Object.keys(event_mask_map).reduce(function (o, v) { o['NoPropagate' + v] = event_mask_map[v]; return o }, {})
      , mouse_buttons = [1,3,2]
      , current_mouse = 0;

    var x11_dom_events = x_types.events.prototypes.reduce(
          function (o, v) {
            if (! v.dom_events)
              return o;
            v.dom_events.forEach(function (dom_event) {
              o[dom_event] = v.name;
            })
            return o;
          }
        , {}
      );

    // Turn DOM events into X11 events!
    $('.screen').on('blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error', '.drawable', function (event) {
      var x11_event = null;
      if ((x11_event = x11_dom_events[event.type]) && ! event.createdX11) {
        var src = $(event.srcElement);
        var drawable = src.not('.drawable').parentsUntil('.drawable').last().parent().add(src).first();
        event.createdX11 = true;
        if (event.type === 'mouseover')
          drawable.addClass('hover');
        if (event.type === 'mouseout')
          drawable.removeClass('hover');
        var window = drawable.data('xob');
        window.triggerEvent(new (x_types.events.map[x11_event])(window, event_data(event)));
      }
    });
    $('.screen').on('mousedown mouseup', function (event) {
      if (event.type === 'mousedown')
        current_mouse |= 1 << (mouse_buttons[event.button] - 1);
      else
        current_mouse &= ~ (1 << (mouse_buttons[event.button] - 1));
      server.buttons = current_mouse;
    });
    Object.keys(do_not_propagate_event_mask_map).forEach(function (_class) {
      $('.screen').on(_class, '.' + _class, function (event) {
        event.stopPropagation();
      });
    });
    function event_data (dom_event) {
      var keybutmask = (
              current_mouse |
              (
                  dom_event.type === 'mousedown' &&
                  (1 << (mouse_buttons[dom_event.button] - 1))
              )
          ) << 8;
      keybutmask |= dom_event.shiftKey && 1;
      // lock? = 2
      keybutmask |= dom_event.ctrlKey  && 4;
      var event_source = $(event.srcElement)
        , root_offset = event_source.parents('.screen').andSelf().first().offset()
        , win_offset = event_source.offset();
      win_offset.left -= root_offset.left;
      win_offset.top  -= root_offset.top;

      return {
          x: dom_event.offsetX
        , y: dom_event.offsetY
        , root_x: dom_event.offsetX + win_offset.left
        , root_y: dom_event.offsetY + win_offset.top
        , button: mouse_buttons[dom_event.button]
        , keycode: dom_event.keyCode
        , keybutmask: keybutmask
      }
    }
    x_types.events.prototypes.reduce(function (a, v) {
      if (v.prototype.dom_events)
        v.prototype.dom_events.forEach(function (dom_event) {
          if (!~a.indexOf(dom_event))
            a.push(dom_event);
        });
      else
        a.push(v.name);
      return a;
    }, []).forEach(function (_class) {
      $('.screen').on(_class, '.drawable.' + _class, function (event, data) {
        var window = $(this).data('xob');
        data.event_window = window;
        data.event_type = event.type;
        window.onEvent(data);
        return false;
      });
    });
    $('.screen').on('SendEvent', '.drawable', function (event, data) {
      var xob = $(this).data('xob');
      if (xob.event_mask && data.event_mask) {
        data.event.event_window = xob;
        xob.onEvent('SendEvent', data.event);
        return event.stopImmediatePropagation();
      }
    });
    $('.screen').on('TestEvent', '.drawable', function (event) {
      console.log('TestEvent', event);
      event.stopImmediatePropagation();
      return false;
    });
    $('.screen').on('contextmenu', '*', false);
  });

  $(connect);
});
