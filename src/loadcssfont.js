  export default function loadCSSFont (filename, type, height, _class, style_id, callback, timeout, interval) {
    interval = interval || 1;
    timeout = (timeout || 5000) / interval;
    console.time('font_load: ' + filename);
    var family = filename.split('/').reverse()[0]
      , _class_important = _class + '_important'
      , body = $('body')
      , test_font = /comic.*sans/i.test(family) ? 'monospace' : 'Comic Sans MS'
      , test_text = 'qwertyuiopasdfghjklzxcvbnm,,.QWERTYUIOPASDFGHJKLZXCVBNM'
      , test = $('<span></span>')
          .text(test_text)
          .css({
              'font-family': test_font
            , 'visibility': 'hidden'
          })
      , canvas = $('<canvas></canvas>')
      , ctx = canvas[0].getContext('2d');
    body.append(test).append(canvas);
    ctx.font = '20px "' + test_font + '"';
    var testcm = ctx.measureText(test_text).width;
    var testm = test.width()
      , i = 0
      , testi = setInterval(function () { 
          i++;
          if (test.width() !== testm && ctx.measureText(test_text).width !== testcm) {
            test.remove();
            canvas.remove();
            clearInterval(testi);
            console.timeEnd('font_load: ' + filename);
            return callback(null, i);
          }
          if (i > timeout) {
            test.remove();
            canvas.remove();
            clearInterval(testi);
            console.timeEnd('font_load: ' + filename);
            console.error('font_load_failed');
            callback('Timeout');
          }
        }, interval);
    ctx.font = '20px "' + family + '"';
    test.css({ 'font-family': "\"" + family + "\"" });
    body.append(
      "<style id=\"" + style_id + "\">\n"+
      "  @font-face { font-family: \"" + family + "\"; src: url('" + filename + '.' + type + "') format('" + type + "'); }\n"+
      "  ." + _class + " { font-family: \"" + family + "\"; font-size: " + height + "px; line-height: " + height + "px; }\n"+
      "  ." + _class + "_important { font-family: \"" + family + "\" !important; font-size: " + height + "px; line-height: " + height + "px; }\n"+
      "</style>"
      );
 }
