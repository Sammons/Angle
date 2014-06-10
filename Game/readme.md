Angle
=

--------
* Angle is intended to be a simplistic html5 game engine
that is driven by a node.js backend. angular.js is an amazing library, and
the similarity in names will cause a name-change when a better name is found.

* realistically node.js is not a good platform to handle the computations involved
in even 2d gaming, but who cares? its fun.

* in Angle all entity state is managed by the server.

* Angle uses websockets to effect an identical experience for all users

Thinkology
-
---------
in our world, objects need some basic things to exist, and their existence is varied.

* To be seen, an object needs a few things to happen
	* The server says it exists in a particular position
	* The server says what type of thing it is so that...
	* The client can draw it as the server said to
* An example would be a circle at position 0,0 with z-index 1 and radius 25
	* Server knows it is AT 0,0 with z index 1
	* Server knows it is a circle with radius 25
	* The client knows how to draw it
* Note that for an object to exist at this point, both the server and the client
need to have instructions for drawing the 2d body of the object. currently Angle is
early on and is targetting only rectangles.

* Next level of existence comes from collision
	* collision bodies are non-rendered collections of coordinates belonging
	to an object that is also (ususally) rendered.
	* the server uses collision bodies to detect when things collide.

* Objects need instructions for what to do when they collide with other things
	* this is a deeper part of their 'type'

	MORE README TO BE WRITTEN
	-

Objects change from...
-  

1. user input from a client (browser) via websocket

2. rules built into game (such as gravity)

3. lack of user input from a client

