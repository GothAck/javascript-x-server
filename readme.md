# JavaScript X Server

## Concept

### Now

This is currently very much a work in progress, with me learning about how an X11 server operates and it's underlying protocol.
A subset of the protocol is now working within Chromium with output to canvas and div elements.
Both xlogo and xeyes are 100% functional, with work currently being done to support xfn (with bitmap fonts)!

### Future

The project may eventually have both server and client side X processing, 
allowing for optimisation of the X protocol and compression of Pixmaps before transferring to the client allowing 
for lightweight remote desktop connections in a web browser.

It'd also be great to experiement with GLX and WebGL to see if there is enough crossover to allow 3d rendering via the browser!

## Loose Requirements
* A basic window manager or application (we're talking blackbox wm, xlogo, xeyes, xfd, more complex apps are more likely to hit bugs / unknown features / unimplemented opcodes).
* Developed on Mac, but should also work on Ilnux boxes

## Getting started
1. `git clone https://github.com/GothAck/javascript-x-server.git xserver; cd xserver`
2. `npm install`
3. Edit proxy.js:

   Change line:

   `  var proxy = new X11Proxy(screen, req.accept('x11-proxy', req.origin));`

   To contain the desired wm/application:

   `  var proxy = new X11Proxy(screen, req.accept('x11-proxy', req.origin), 'xeyes');`
4. In one terminal: `grunt; grunt watch` (you can just run `grunt`)
5. In another: `npm start`
6. Open http://localhost:3000 in a decent browser (currently only Chrome is tested working)
