  export function readFile(filename, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = null;
    }
    encoding = encoding || 'raw';

    var req = new XMLHttpRequest();
    req.open('GET', window.location.protocol + '//' + window.location.host + '/' + filename, true);
    if (encoding === 'raw')
      req.responseType = 'arraybuffer';
    req.onerror = function (event) {
      callback(req.status || event || 'Unknown Error');
      callback = new Function;
    }
    req.onload = function (event) {
      callback((req.status === 200 ? null : req.status), req.response);
    }
    req.send();
  }
