	$(document).ready(function() {
		$("#add_username").hide();
		var loginMode = false;
		var width = $("body").width();
		var height = $("body").height();
		console.log(width)
		console.log(height)
		var w = 250;
		$("#q1").show().css({"left":0,"top":height-w});
		$("#q2").show().css({"left":0,"top":0});
		$("#q3").show().css({"left":width-w,"top":0});
		$("#q4").show().css({"left":width-w,"top":height-w});
		var frameLoadTime= 1400;
		var gsc = $("#game-stage canvas");
		gsc.css("border-color","transparent");
		$("#q1").animate({
			"left":gsc.offset().left,
			"top":gsc.offset().top+w
		},frameLoadTime);

		$("#q2").animate({
			"left":gsc.offset().left,
			"top":gsc.offset().top
		},frameLoadTime);

		$("#q3").animate({
			"left":gsc.offset().left+w,
			"top":gsc.offset().top
		},frameLoadTime);

		$("#q4").animate({
			"left":gsc.offset().left+w,
			"top":gsc.offset().top+w
		},frameLoadTime);
		setTimeout(function(){
			$("#game-stage,#game-stage canvas").css("border-color","red");
			gsc.css("background-color","rgba(20,20,20,0.8)")
			$(".q").hide();
		},frameLoadTime);
		//
		$("#stats").animate({
			"height":400+"px"
		},2200);
		$("#scoreboard").animate({
			"height":400+"px"
		},2200);
		$("#left-shoulder, #right-shoulder").animate({
			"height":350+"px"
		},2000);


		var showLoginBar = function(speed,warningText) {
			$("#warning").text(warningText);
			var l = $("#normal-login");
			var o = $("#auth-login");
			var i = $("#initiate");
			var e = $("#effectbar");
			e.css({
				"border":"5px solid rgb(20,20,20)",
				"background": "rgb(20,20,20)",
				"border-radius":"4px",
				"left":i.offset().left+i.width()/2-5,
				"top":i.offset().top-5
			});
			l.css({
				"left":i.offset().left+i.width()/2-l.width()+3,
				"top":i.offset().top-5
			});
			o.css({
				"left":i.offset().left-i.width()+l.width()-3,
				"top":i.offset().top-5
			});
			e.animate({
				"height": i.height()+7
			},speed).animate({
				"left": i.offset().left-l.width()+i.width()/2,
				"width": l.width()+o.width(),
			},function() {
				e.hide();
	 			l.show();
				o.show();
			});
		}

		$("#left-shoulder").click(function(e){
			$("#left-shoulder input").select();
		})

		if (/login_fail=true/.test(window.location.href)) {
			showLoginBar(0,"bad username or password");
		}
		if (/add_username/.test(window.location.href)) {
			$("#init-wrapper").height($("#initiate").height());
			$("#initiate").hide();
			gsc.css("margin-top","30px");
			$("#add_username").show();
			$("#add_username").css({
				"position":"relative",
				"left":"-5000px"
			});
			$("#add_username").animate({
				"left":"0px"
			},2000);
			$("#add_username input").select();
			loginMode = true;
		}
		$("#left-shoulder input").hide();
		if (/sessionID=[0-9]+/.test(window.location.href)) {
			$("#init-wrapper").height($("#initiate").height());
			$("#initiate").hide();
			$("#left-shoulder input").show();
			gsc.css("margin-top","30px");
			loginMode = true;
		}
		$("#initiate").click(function(e) {
			showLoginBar(500,"");
		});
	});

