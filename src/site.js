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
          $('h2').text(`${server.clients.size} clients`);
        break;
        case 'end':
          server.disconnect(event.data.id);
          $('h2').text(`${server.clients.size} clients`);
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
          $('h2').text(`${server.clients.size} clients`);
        break;
        default:
          console.error('Unknown message', event.data);
      }
    });
  }

  $(connect);
