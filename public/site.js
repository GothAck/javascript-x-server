require(['util', 'endianbuffer', 'x_server', 'x_types'], function (util, EndianBuffer, XServer, x_types) {
  var debug = /debug=on/.test(window.location);
  if (!debug)
    console = Object.keys(console.__proto__).reduce(function (o, k) { o[k] = new Function; return o }, {}); 
  
  function connect () {
    var server
      , socket = new WebSocket('ws://' + window.location.host, 'x11-proxy');
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
    (function (w) {
      w.loadCSSFont = function loadCSSFont (filename, type, height, _class, style_id, callback, timeout, interval) {
        interval = interval || 1;
        timeout = (timeout || 5000) / interval;
        var family = filename.split('/').reverse()[0]
          , _class_important = _class + '_important'
          , body = $('body')
          , test_font = /comic.*sans/i.test(family) ? 'monospace' : 'Comic Sans MS'
          , test_text = 'qwertyuiopasdfghjklzxcvbnm,,.QWERTYUIOPASDFGHJKLZXCVBNM'
          , test = $('<span></span>')
              .text(test_text)
              .addClass(_class_important)
              .css({
                  'font-family': test_font
                , 'visibility': 'hidden'
              })
          , canvas = $('<canvas></canvas>')
          , ctx = canvas[0].getContext('2d');
        body.append(test).append(canvas);
        ctx.font = '20px "' + family + '"';
        var testcm = ctx.measureText(test_text).width;
        var testm = test.width()
          , i = 0
          , testi = setInterval(function () { 
              i++;
              if (test.width() !== testm && ctx.measureText(test_text).width !== testcm) {
                clearInterval(testi);
                return callback(null, i);
              }
              if (i > timeout) {
                clearInterval(testi);
                callback('Timeout');
              }
            }, interval);
        body.append(
          "<style id=\"" + style_id + "\">\n"+
          "  @font-face { font-family: \"" + family + "\"; src: url('" + filename + '.' + type + "') format('" + type + "'); }\n"+
          "  ." + _class + " { font-family: \"" + family + "\"; font-size: " + height + "px; line-height: " + height + "px; }\n"+
          "  ." + _class + "_important { font-family: \"" + family + "\" !important; font-size: " + height + "px; line-height: " + height + "px; }\n"+
          "</style>"
          );
      }
    })(window);
  });

  $(function () {
    var mouse_buttons = [1,3,2];
    function event_data (dom_event) {
      var keybutmask = (
              (server && server.buttons || 0) |
//              (
//                  dom_event.type === 'mousedown' &&
//                  (1 << (mouse_buttons[dom_event.button] - 1))
//              )
              0
          ) << 8;
      if (dom_event.type === 'mousedown' || dom_event.type === 'mouseup') {
        keybutmask |= 0x10;
        keybutmask &= ~((1 << (mouse_buttons[dom_event.button] - 1)) << 8); 
      }
      // keybutmask |= dom_event.shiftKey && 1;
      // lock? = 2
      // keybutmask |= dom_event.ctrlKey  && 4;
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

    var x11_dom_event_map = x_types.events.prototypes.reduce(
          function (o, v) {
            if (! v.dom_events)
              return o;
            v.dom_events.forEach(function (dom_event) {
              o[dom_event] = v;
            })
            return o;
          }, {})
      , x11_event_map = x_types.events.prototypes.reduce(
          function (o, v) {
            if (v.prototype.dom_events)
              v.prototype.dom_events.forEach(function (event_name) {
                o[event_name] = v;
              });
            o[v.name] = v;
            return o;
          }, {}
        );

    // Turn DOM events into X11 events
    $('#eventwrapper').on(
        'blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error'
      , '#eventfilter .drawable'
      , function (event) {
          var x11_event = x11_dom_event_map[event.type];
          if (x11_event && ! event.createdX11) {
            var src = $(event.srcElement)
              , drawable = src.not('.drawable').parentsUntil('.drawable').last().parent().add(src).first()
              , window = drawable.data('xob');
            event.createdX11 = true;
            if (event.type === 'mouseover')
              drawable.addClass('hover');
            if (event.type === 'mouseout')
              drawable.removeClass('hover');
            window.triggerEvent(new x11_event(window, event_data(event)));
          }
        }
    );
    // Update server.buttons
    $('.screen').on('mousedown mouseup', function (event) {
      if (event.type === 'mousedown')
        server.buttons |= 1 << (mouse_buttons[event.button] - 1);
      else
        server.buttons &= ~ (1 << (mouse_buttons[event.button] - 1));
    });
    Object.keys(x11_event_map).forEach(function (_class) {
      var wrapper = $('#eventwrapper');
      if (x11_event_map[_class].grab === 'pointer') {
        wrapper
          .on(_class, '#eventfilter.grab_pointer.owner_event .drawable.' + _class, function (dom_event, x_event) {
            var window = $(this).data('xob')
              , server = window.owner.server
              , grab_window = server.grab_pointer;
            if (window.owner === grab_window.owner) {
              x_event.event_window = window;
              x_event.event_type = dom_event.type;
              window.onEvent(x_event);
              dom_event.stopImmediatePropagation();
            }
          })
          .on(_class, '#eventfilter.grab_pointer .drawable', function (dom_event, x_event) {
            var window = $(this).data('xob')
              , server = window.owner.server
              , grab_window = server.grab_pointer;
            x_event.window = grab_window;
            x_event.event_window = window;
            x_event.event_type = dom_event.type;
            $(this).data('xob').owner.server.grab_pointer.onEvent(x_event);
            dom_event.stopImmediatePropagation();
          });
      }
      if (x11_event_map[_class].grab === 'keyboard')
        wrapper.on(_class, '#eventfilter.grab_keyboard .drawable', function (event, data) {
          var window = $(this).data('xob');
          data.event_window = window;
          data.event_type = event.type;
          $(this).data('xob').owner.server.grab_keyboard.onEvent(data);
          event.stopImmediatePropagation();
        });
      wrapper.on(_class, '#eventfilter .drawable.NoPropagate' + _class, function (event) {
          event.stopPropagation();
        })
        .on(_class, '#eventfilter .drawable.' + _class, function (event, data) {
          var window = $(this).data('xob');
          data.event_window = window;
          data.event_type = event.type;
          window.onEvent(data);
          return false;
        });
    });
    $('.screen').on('SendEvent', '.drawable', function (event, data) {
      var xob = $(this).data('xob');
      if ((xob.event_mask && data.event_mask) || ! data.event_mask ) {
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
