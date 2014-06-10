	$(document).ready(function() {
	/* setTransform(a,b,c,d,e,f) = [{a,b,e}{c,d,f}{0,0,1}]
	to be clearer
	a b e
	c d f
	0 0 1
	identity, no affect
	1 0 0         x				x
	0 1 0  times  y  produces   y
	0 0 1         z             z
	*/
	/*
	basic rotation
	cos(theta)  -sin(theta) a          x			 
	sin(theta)   cos(theta) b  times   y  produces  rotated x,y with additional a,b components
	0            0          1          z
	*/
		var dWidth = $(document).width();
		var dHeight = $(document).height();
		var star = document.createElement("canvas");
		star.width=2;
		star.height=2;
		var starCtx = star.getContext("2d");
		starCtx.fillStyle = "rgb(255,255,255)";
		starCtx.fillRect(0,0,2,2);
		var canvas = $("#universe-canvas");
		canvas.css({"position":"absolute","padding":"0px","margin":"0px","top":"0px","left":"0px", "width":"100%","height":"100%","background":"black"});
		var canv = document.getElementById("universe-canvas");
		canv.width = canvas.width();
		canv.height = canvas.height();

		var ctx = canv.getContext("2d");
		var c = {"x":dWidth/2,"y":dHeight/2};

		var save = document.createElement("canvas");
		save.width = canv.width;
		save.height = canv.height;
		function clear(save) {
			ctx.setTransform(1,0,0,1,0,0);
			ctx.drawImage(save,0,0);
		}

		function drawSink(radius,x,y) {
			var e = x;
			var f = y;
			var area = radius*radius*Math.PI;//pixels involved
			var theta = 0;
			var incrementShade = 230/area;//shade change
			var circumfrence = radius*Math.PI/2;
			var incrementTheta = 4/radius;//number of theta increments for this circumfrence
			var depth = 0;
			var nextDepthTick = circumfrence;
			var shade = 15;
			var trans = 0.4;
			var fat = 6;
			for (var i = Math.ceil(area); i>=0;i--) {//yep, those crazy cool suns are drawn pixel block at a time
				if (nextDepthTick < 0) {
					depth++;
					if (depth > radius) i = 0;
					circumfrence = (radius-depth)*Math.PI/2;
					incrementTheta = 4/(radius-depth);
					nextDepthTick = Math.floor(circumfrence);
					theta = 0;
				}
				if (i/area > .94) trans = 0.5;
				if (i/area < .94) trans = 0.5;
				if (i/area < .25) trans = 1;
				nextDepthTick--;
				theta += incrementTheta;
				ctx.setTransform(Math.cos(theta),-Math.sin(theta),Math.sin(theta),Math.cos(theta),x,y);
				shade += incrementShade;
				if (shade > 200) shade = 200;
				col = Math.ceil(shade);
				//shade = 255;
				if (col <= 0 || col > 255) col = 255;
				ctx.fillStyle = "rgba("+col+","+col+",0,"+trans+")";
				ctx.fillRect(0,Math.floor(radius-depth),fat,fat);
				if (i == 0) ctx.fillRect(0-7,0-7,15,15);
			}
			
		}
		//draw 12 suns
		var starpoints = [];
		for (var i = 0; i<5; i++) {
			var y = Math.random()*dHeight;
			var x = Math.random()*dWidth;
			var rad =Math.random()*100+50;
			starpoints.push({"x":x,"y":y,"rad":rad});
			drawSink(rad,x,y);
		}
		var saveCtx = save.getContext("2d");
		saveCtx.fillStyle = "rgb(0,0,0)";
		saveCtx.fillRect(0,0,save.width,save.height);
		saveCtx.drawImage(canv,0,0);
		
		//generate star starting info
		for (var i = 0; i< starpoints.length; i++) {
			starpoints[i].stars = [];
			var starcount = Math.random()*50;
			for (var j = 0; j < starcount ; j++) {

				starpoints[i].stars.push({"theta":Math.random()*Math.PI*2,"rad":starpoints[i].rad+Math.random()*dWidth})
			}
		}

		var theta = 0;
		var radius = 0;
		var smear = 6;
		setInterval(function() {
			//drawloop
			if (smear == 0) {
				clear(save);
				 smear=1;
				}
				smear--;
			for (var i = starpoints.length - 1; i >= 0; i--) {
				for(var j = starpoints[i].stars.length -1; j>=0; j--) {
					theta = starpoints[i].stars[j].theta;
					radius = starpoints[i].stars[j].rad;
					starpoints[i].stars[j].theta += 4/radius;
					ctx.setTransform(Math.cos(theta),-Math.sin(theta),Math.sin(theta),Math.cos(theta),starpoints[i].x,starpoints[i].y);
					ctx.drawImage(star,0,radius);
				}
			};
		},50);
	});