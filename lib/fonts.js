var Future = require('future')
  , path = require('path')
  , fs = require('fs');

var app_dir = path.dirname(require.main.filename)
  , fonts_dir = path.join(app_dir, 'public', 'fonts');

exports.list_fonts = function (filter) {
  var future = new Future;
  fs.readdir(fonts_dir, function (err, dir) {
    if (err)
      return future.deliver(err);
    if (filter)
      try {
        var re = new RegExp('^'+filter.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1").replace(/\\([*?])/g, '.$1')+'\..*$');
        dir = dir.filter(re.test.bind(re));
      } catch (e) {
        return future.deliver(e);
      }
      future.deliver(null, dir);
  });
  return future;
}