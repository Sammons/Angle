Angle
=

Small HTML5 Canvas game built with a node.js backend.

It's really called Starslam but I hate changing names of reps because it breaks all the links.

How it Works
---

* Starslam features a static server that handles secure login and storage of player history.

* Then there is the gameserver (github.com/Sammons/Angle-Engine), which is a websocket server with a collision engine, and logic for handling user input

* Which is delivered from the client, which collects user input and delivers it via websocket to the gameserver. It also processes the gamestate updates from the server.

cheers for javascript

 
