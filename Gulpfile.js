var gulp = require('gulp');
var source = require('vinyl-source-stream');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var factor = require('factor-bundle');
var insert = require('gulp-insert');

var browserify = require('browserify');
var babelify = require('babelify');

if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'development';
}

gulp.task('js', function () {
  var worker_stream = source('./worker_comms.js');
  var b = browserify({
    entries: ['./src/site.js', './src/worker_comms.js'],
    debug: true,
    fullpath: true,
  })
    .transform(babelify.configure({
      sourceMap: true,
      // moduleRoot: '',
      // sourceRoot: 'src',
      // modules: 'amd',
      // moduleIds: true,
      optional: [
        'es7.objectRestSpread',
        'es7.classProperties',
        'es7.exportExtensions',
        'es7.asyncFunctions',
        'es7.functionBind',
        'es7.comprehensions',
        'runtime',
        'utility.inlineEnvironmentVariables',
        'minification.deadCodeElimination',
        'minification.memberExpressionLiterals',
        'minification.propertyLiterals',
        'validation.undeclaredVariableCheck',
        'spec.undefinedToVoid',
      ],
      blacklist: [
        'strict', // Blacklisted to allow access to objs in stacktraces
      ],
    }))
    .plugin(factor, {o: [
      './public/site.js',
      worker_stream,
    ]});

  worker_stream
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(insert.prepend('importScripts("common.js");'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/'));

  return b.bundle()
    .pipe(source('./common.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/'));
});

gulp.task('watcher', function () {
  gulp.watch(['src/**/*.js', 'Gulpfile.js'], ['js']);
});

gulp.task('default', ['js']);

gulp.task('watch', ['js' ,'watcher']);
