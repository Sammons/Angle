
exports.PhysicsManager = function(width,height) {
	var pixel = function(x,y) {
		this.x = x;
		this.y = y
		this.owner = null;
		this.pathable = true;
	};
	var createBody = function(obj) {
		
	}

	var types = {
		"player" : function(obj) {
			obj.collidable = true;
			obj.speed = 2;
			obj.forward = false;
		},
		"bullet" : function(obj) {

		};
	}

	var applyToAllProps = function(objects, callback){
		for (var obj in objects) {
			objects[obj] = callback(objects[obj]);
		}
	}
	var applyToAllElements = function (array, callback) {
		for (var i = array.length - 1; i >= 0; i--) {
			array[i] = callback(array[i]);
		};
	}

	var rotate = function(coord, pivotCoord, degree) {// I work in degrees, forget everyone else
		//returns new coords NOT FLOORED
	}

	var translate = function(coord, relativeCoord, distance, directionDegree) {
		//returns new coords NOT FLOORED
	}

	this.move = function(objects) {
		applyToAllProps(objects,function(obj) {
			if (obj.new) {
				obj = new types[obj.type](obj);
			}
		});
		//create a list of new floored coords while checking for collision
		//create a second of old floored coords as well
		//translate and move based on object properties
		//
	};


};
