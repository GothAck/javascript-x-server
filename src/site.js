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
    var x11_event_map = new Map(x_types.events.prototypes.reduce((o, v) => {
      if (v.custom_dom_events) {
        v.custom_dom_events.forEach((event_name) => o.push([event_name, v]));
      }
      o.push([v.name, v]);
      return o;
    }, []));

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
  });

  $(connect);
