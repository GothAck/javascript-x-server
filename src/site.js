import * as elements from './elements';
elements.register();

var EndianBuffer = require('./endianbuffer');
var XServer = require('./x_server');
var x_types = require('./x_types');

  var worker_comms = new Worker('worker_comms.js');
  function connect () {
    var server
      , connected = false;

    worker_comms.addEventListener('message', function (event) {
      switch (event.data.cmd) {
        case 'loaded':
          worker_comms.postMessage({ cmd: 'connect', address: window.location.host });
        break;
        case 'open':
          connected = true;
        break;
        case 'close':
          connected = false;
        break;
        case 'new':
          server.newClient(event.data.id, event.data.host, event.data.port, event.data.host_type);
        break;
        case 'end':
          server.disconnect(event.data.id);
        break;
        case 'request':
          EndianBuffer.ensure(event.data.request);
          server.processRequest(event.data);
        break;
        case 'screen':
          server = window.server = new XServer(event.data.id, function (data, client, new_reply) {
            if (new_reply)
              return worker_comms.postMessage({ cmd: 'reply', id: client.id, data: data, state: client.state });
            worker_comms.postMessage({ cmd: 'message', id: client.id, data:data, state: client.state }, [data]);
          }, document.getElementById('screen'));
          document.title = 'XSession :' + event.data.id;
          $('h2').text('0 clients');
        break;
        default:
          console.error('Unknown message', event.data);
      }
    });
  }

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

    var x11_dom_event_map = new Map(x_types.events.prototypes.reduce((o, v) => {
      if (! v.dom_events)
        return o;
      v.dom_events.forEach((dom_event) => o.push([dom_event, v]));
      return o;
    }, []));
    var x11_event_map = new Map(x_types.events.prototypes.reduce((o, v) => {
      if (v.custom_dom_events) {
        v.custom_dom_events.forEach((event_name) => o.push([event_name, v]));
      }
      o.push([v.name, v]);
      return o;
    }, []));

    // Turn DOM events into X11 events
    $('#eventwrapper').on(
        'blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error'
      , '#eventfilter .drawable'
      , function (event) {
          var x11_event = x11_dom_event_map.get(event.type);
          if (x11_event && ! event.createdX11) {
            var src = $(event.srcElement)
              , drawable = src.not('.drawable').parentsUntil('.drawable').last().parent().add(src).first()
              , window = drawable.get(0).xob;
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
    // FIXME: BROKEN!
    for (let [_class, constructor] of x11_event_map) {
      let wrapper = document.getElementById('eventwrapper');

      if (constructor.grab === 'pointer') {
        let base_event = '#eventfilter.grab_pointer';
        let owner_event = `${base_event}.owner_event .drawable.${_class}`;
        wrapper.addEventListener(_class, (event) => {
          if (!event.currentTarget.matches(owner_event)) {
            return;
          }
          var x_event = event.detail;
          var window = event.currentTarget.xob;
          var server = window.owner.server;
          var grab_window = server.grab_pointer;
          if (window.owner === grab_window.owner) {
            x_event.event_window = window;
            x_event.event_type = event.type;
            window.onEvent(x_event);
            event.stopImmediatePropagation();
          }
        });
        let main_event = `${base_event} .drawable`;
        wrapper.addEventListener(_class, (event) => {
          if (!event.currentTarget.matches(main_event)) {
            return;
          }
          var x_event = event.detail;
          var window = event.currentTarget.xob;
          var server = window.owner.server;
          var grab_window = server.grab_pointer;
          x_event.window = grab_window;
          x_event.event_window = window;
          x_event.event_type = event.type;
          grab_window.onEvent(x_event);
          dom_event.stopImmediatePropagation();
        });
      }
      if (constructor.grab === 'keyboard') {
        let main_event = '#eventfilter.grab_keyboard .drawable';
        wrapper.addEventListener(_class, (event) => {
          if (!event.currentTarget.matches(main_event)) {
            return;
          }
          var x_event = event.detail;
          var window = event.currentTarget.xob;
          x_event.event_window = window;
          x_event.event_type = event.type;
          window.owner.server.grab_keyboard.onEvent(x_event);
          event.stopImmediatePropagation();
        });
      }
    }
    Object.keys(x11_event_map).forEach(function (_class) {
      var wrapper = $('#eventwrapper');
        // wrapper.on(_class, '.drawable', function (event, data) {
        //   console.debug('Event debug', _class, event, data, $(this).data('xob'));
        // });
    });
    $('.screen').on('SendEvent', '.drawable', function (event, data) {
      var xob = this.xob;
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
