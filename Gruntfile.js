module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    babel: {
      options: {
        // sourceMap: true,
        moduleRoot: '',
        sourceRoot: 'src',
        modules: 'amd',
        moduleIds: true,
        playground: true,
        experimental: true,
        // optional: ['es7.objectSpread'],
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['**/*.js'],
          dest: 'public/modules',
        }],
      },
    },
    watch: {
      files: ['**/*.js', '!**/node_modules/**', '!**/public/modules/**'],
      tasks: ['babel'],
    },
  });
  grunt.registerTask("default", ["babel"]);
}
