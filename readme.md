# JavaScript X Server

## Now

This is currently very much a work in progress, with me learning about how an X11 server operates and it's underlying protocol.
A subset of the protocol is now working within Chromium with output to canvas and div elements.
Both xlogo and xeyes are 100% functional, with work currently being done to support xfn (with bitmap fonts)!



## Future

The project may eventually have both server and client side X processing, 
allowing for optimisation of the X protocol and compression of Pixmaps before transferring to the client allowing 
for lightweight remote desktop connections in a web browser.

It'd also be great to experiement with GLX and WebGL to see if there is enough crossover to allow 3d rendering via the browser!
