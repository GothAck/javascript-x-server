define('util', {
    inherits: function (constructor, superConstructor) {
      constructor.prototype.__proto__ = superConstructor.prototype;
      constructor.super_ = superConstructor;
    }
});
