# JavaScript X Server

## Now

This is currently very much a work in progress, with me learning about how an X11 server operates and it's underlying protocol. I'm currently playing with the protocol only in Node.js, attempting to get the xlogo demo app communicating successfully. One this has been completed I will start to explore more of the X protocol and port the Node.js code (which uses Buffers extensively) to browser compatible code and attempt to use HTML5 to render the visuals (communicating via WebSockets)!

## Future

The project may eventually have both server and client side X processing, allowing for optimisation of the X protocol and compression of Pixmaps before transferring to the client allowing for lightweight remote desktop connections in a web browser.
