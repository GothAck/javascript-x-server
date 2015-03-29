requirejs.config({
    baseUrl: 'modules',
    paths: {
        site: '../site',
        lib: '../lib'
    },
    shim: {
        'lib/jsbn-combined': {
            exports: 'BigInteger'
        }
      , 'lib/sprintf': {
          exports: 'sprintf'
        }
      , 'lib/ipv6': {
            deps: ['lib/jsbn-combined', 'lib/sprintf']
          , exports: 'v6'
        }
    }
})
