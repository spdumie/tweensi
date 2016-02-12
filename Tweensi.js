"use strict";


/*
Do do list


v 0.3 updates
- now it can be used without initial instance. Tweensi.to() works. var ttt = Tweensi.to() works too;
- all variables and functions are contained by Tweensi
- delayedCall added
- killDelayedCallsTo added
- Tweensi.from added
- Tweensi.set works now
- Tweensi.killTweensOf added
- Tweensi.yoyo added (Tweensi.to{obj, 1, {yoyo:true}} also triger Tweensi.yoyo)
- Event onRepeat, onRepeatParams added
- Autoalpha added as CSS



v 0.2 updates

- adding HTML, Dom object CSS renderer here.
- tested it to accept both normal object & DOM object.

- built tweensi register here. all tween objects registered when start, and unregistered when end.
- Tweensi register also has overlap checker, remove overlapped property from the previously registered tweensi.
- now multiple Tweensi classes can be added to one object.
- css transition is registered to tweensi register, and keep track of the value changes in there. this way no need to convert css matrix to transform values.
- for that, cssToObject, objectToCSS were created.

- browser detection is here to support more browsers. (ex Safari still requires -webkit-)
- this way helps the performence of Tweensi class.
- switch to requestAnimFrame for smooth animation & better FPS.

- delay call is changed to be initiated when it starts. (no more pre created, and animate after delay, which caused poping animation)
- added tw.trg to store original object.


v 0.11
time measurement changed from forced cal to getTime.
so 1sec will be completed after 1sec no matter how many frames were rendered.
this gives much smooth animation

*/


function $$(tname) {
	var tobj = document.getElementById(tname);
	return tobj;
}


var Tweensi = (function(){

	var vKeys = {},
		browsers = [""],
		twreg;


	setInit();


	function setInit() {
		setVkeys();
		setBrowsers();
		setRequestAnimFrame();
		setTweensiRegister();
		twreg = new window.TweensiReg();
	}

	/*
	setVkeys defines what CSS, Events, Transforms canbe accepted in this Tweensi.
	You may want to increase of decrease the keys here.
	also it sets the initial value of the transition if there is no previous value.
	
	Currently rotate3d has removed because the last argument has different unit "deg", ex rotate3d(1, 1, 0, 60deg);
	to add the unit should not be single value, it should be array for the different units, but for only rotate3d is the question.

	inherit, initial, unset, perspective are also missing from the all CSS3 transform list.
	*/
	function setVkeys() {
		vKeys.evs = ["onStart", "onStartParams", "onComplete", "onCompleteParams", "onUpdate", "onUpdateParams", "onRepeat", "onRepeatParams"];
		vKeys.css = ["left", "top", "width", "height", "opacity"]; 
		vKeys.trans = [
		"rotate", "rotateX", "rotateY", "rotateZ",
		"scale", "scaleX", "scaleY", "scaleZ", "scale3d",
		"translate", "translateX", "translateY", "translateZ", "translate3d",
		"skew", "skewX", "skewY",
		"matrix", "matrix3d"
		];
		vKeys.skip = ["yoyo", "repeat", "repeatDelay", "autoAlpha"];
		vKeys.inTr = {
			rotate : "rotate(0deg)", rotateX : "rotateX(0deg)", rotateY : "rotateY(0deg)", rotateZ : "rotateZ(0deg)", 
			scale : "scale(1,1)", scaleX : "scaleX(1)", scaleY : "scaleY(1)", scaleZ : "scale(1)", scale3d : "scale(1,1,1)", 
			translate : "translate(0px,0px)", translateX : "translateX(0px)", translateY : "translateY(0px)", translateZ : "translateZ(0px)", translate3d : "translate3d(0px,0px,0px)",
			skew : "skew(0deg,0deg)", skewX : "skewX(0deg)", skewY : "skewY(0deg)",
			matrix : "matrix(1,0,0,1,0,0)", matrix3d : "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)",
			perspective : "1000px"
		}

	}

	/*
	still need to add prefix of browswer such as -webkit- or -mos- because
	- Safari doesn't accept just "transform", must use it with prefix
	- Firefox accept non-prefix version, but no hardware acceleration. must add -moz- to get animation boost.
	*/
	function setBrowsers() {

		var ua = navigator.userAgent;
		if (cb("Safari")) {
			browsers.push("-webkit-");
		} else if (cb("Firefox")) {
			browsers.push("-moz-");
		} else if (cb("MSIE")||cb("Windows")) {
			browsers.push("-ms-");
		} else if (cb("Opera")) {
			browsers.push("-o-");
		}
		function cb(tst) {return (ua.indexOf(tst) === -1)?false:true;}
		//console.log("=== detected Browsers", ua, browsers);
	}

	/*
	It's tested non-requestAnimFrame, setInterval 16 on Chrome, Safari, and Firefox.
	Chrome got 63 stady, Safari got 53~56, Firefox got 63 stady but the animation looks choppy. Firefox seems not supporting hardware accelerated animation on setinterval.
	Since using this requestAnimFrame, all three browswers show 60 stady, hardware accel smooth animation even on Firefox.
	the animation render much less, to 1 fps, when not in focused tab, battery saving, shows satisfying result.
	Must use requestAnimFrame!
	*/
	function setRequestAnimFrame() {
		window.requestAnimFrame = (function(){
			return 	window.requestAnimationFrame 		||
					window.webkitRequestAnimationFrame 	||
					window.mozRequestAnimationFrame    	||
					function( callback ){
						window.setTimeout(callback, 1000 / 60);
					};
			})();
		window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
	}

	function setTweensiRegister() {

		window.TweensiReg = function() {
			this.tws = {};
			this.trans = {};
			this.csss = [];
			this.dcalls = [];
			var sheets = document.styleSheets;
			for(var i=0; i<sheets.length; i++){
				var tlist = sheets[i];
				for(var j=0; j<tlist.cssRules.length; j++){
					this.csss.push(tlist.cssRules[j]);
				}
			}
		}

		window.TweensiReg.prototype = {
			regi : function(ttw) {
				if (this.tws[ttw.tw.id] === undefined) {
					this.tws[ttw.tw.id] = [];
				}
				if (this.tws[ttw.tw.id].length > 0) {
					this.removeOverlap(this.tws[ttw.tw.id], ttw);
				}
				this.tws[ttw.tw.id].push(ttw);
			},
			unregi : function(ttw) {
				var findIndex = this.findTw(this.tws[ttw.tw.id], ttw.name);
				this.tws[ttw.tw.id].splice(findIndex, 1);
			},
			kill : function(tid) {
				for (var i = 0; i < this.tws[tid].length; i++) {
					var ttw = this.tws[tid][i];
					ttw.stopTw();
				}
			},
			killOf : function(tid, keys) {
				for (var i = 0; i < this.tws[tid].length; i++) {
					var ttw = this.tws[tid][i];
					for (var key in ttw.tw.cals){
						for (var tkey in keys) {
							if (tkey === key) {
								delete ttw.tw.cals[key];
							}
						}
					}
				}
			},
			removeOverlap : function (tarr, ttw) {
				//for (var i = 0; i < tarr.length; i++) {
					var preTw = tarr[tarr.length-1];
					for (var key in ttw.tw.cals) {
						if (key in preTw.tw.cals) {
							//console.log("deleted key: ", key, "from: ", preTw);
							delete preTw.tw.cals[key];
						}
					}
				//}
			},
			findTw : function (tarr, tname) {
				for (var i = 0 ; i < tarr.length; i++) {
					var tobj = tarr[i];
					if (tobj.name === tname) {
						return i;
					}
				}
			},
			searchTrans : function (tdiv) {
				this.trans[tdiv.id] = {};
				var transText = "";
				if (tdiv.style.transform != undefined && tdiv.style.transform != ""){
					transText = tdiv.style.transform;
				} else {
					for (var i = 0; i < this.csss.length ; i++) {
						var tcss = this.csss[i];
						if (tcss.selectorText === "#"+tdiv.id) {
							var preps = tcss.cssText.split("{")[1].split("}")[0].replace(/\s/g, "").split(";");
							//console.log(tcss.cssText, preps);
							for (var j=0; j < preps.length; j++) {
								var item = preps[j].split(":");
								if (item[0].slice(-9) === "transform") {
									transText = item[1];
								}
							}
						}
					}
				}
				//console.log("========== searchTrans2",tdiv.id, transText);
				if (transText != "") this.regiTrans(tdiv.id, transText);
			},
			regiTrans : function (tid, tst){
				var tarr = tst.split(")");
				for (var i=0 ; i < tarr.length; i++) {
					if (tarr[i] != "") {
						var preps = tarr[i].split("(");
						this.addTrans(tid, preps[0], tarr[i]);
					}
				}
				//console.log("======= regiTrans called", this.trans);
			},
			addTrans : function (tid, key, tst) {
				//console.log("=== in addTrans", tid, key, tst);
				var tobj = this.trans[tid];
				tobj[key] = cssToObj(tst);
			},
			regiDcall : function (obj) {
				this.dcalls.push(obj);
				//onsole.log("==== in regiDcall", obj, this.dcalls);
			},
			unregiDcall : function (tname) {
				var ind;
				for (var i = 0; i < this.dcalls.length ; i++) {
					var tobj = this.dcalls[i];
					if (tobj.fnName == tname) {
						ind = i;
						clearInterval(tobj.timer);
					}
				}
				if (ind != undefined) {this.dcalls.splice(ind, 1);}
				//console.log("==== in unregiDcall", tname, ind, this.dcalls);
			}


		}
	}



	function Tweensi() {

		var tw = {};
		this.name = String(Math.random());
		this.tw = tw;
		tw.trg;
		tw.twobj = {};
		tw.poA = {};
		tw.poB = {};
		//tw.ease = easing.easeInOutCubic;
		tw.ease = easing.easeOutSine;
		tw.evs = {};
		tw.cals = {};
		tw.dura;
		tw.intv;
		tw.timer;
		
		tw.rp;
		tw.rpcount = 0;
		tw.rpdelay = 0;

		tw.autoAlpha = false;
		tw.isTween = false;
		tw.parent = this;
		tw.id = "";

		this.isTween = function(){
			return tw.isTween;
		};

		this.to = function (tobj, time, aniObj) {

			if (time === 0) {
				tw.parent.set(tobj, aniObj);
			} else if ("yoyo" in aniObj && aniObj.yoyo) {
				tw.parent.yoyo(tobj, time, aniObj);
			} else if("delay" in aniObj) {
				delayHandler(tobj, time, aniObj, tw.parent.to);
			} else {
				tw.dura = time;
				checkID(tobj);
				filterKey(aniObj);
				setCal(tw.poA, tw.poB);
				startTween();
			}	
		}

		this.from = function (tobj, time, aniObj) {

			if (time === 0) {
				tw.parent.set(tobj, aniObj);
			} else if("delay" in aniObj) {
				delayHandler(tobj, time, aniObj, tw.parent.from);
			} else {
				tw.dura = time;
				checkID(tobj);
				filterKey(aniObj);
				setCal(tw.poB, tw.poA);
				startTween();
			}	
		}

		this.set = function (tobj, aniObj) {
			checkID(tobj);
			for (var key in aniObj) {
				var v = aniObj[key];
				if (vKeys.css.indexOf(key) != -1) {
					var tc = cssToObj(v);
					tobj.style[key] = tc.values[0]+tc.unit;
				} else if (vKeys.trans.indexOf(key) != -1) {
					var tt = cssToObj(v);
					twreg.trans[tw.id][key] = tt;
				} else if (typeof v === 'number') {
					tobj[key] = v;
				}  
			}
			renderTrans();
		}

		this.yoyo = function (tobj, time, aniObj) {
			//console.log("======== yoyo", tobj, time, aniObj);
			if("delay" in aniObj) {
				delayHandler(tobj, time, aniObj, tw.parent.yoyo);
			} else if ("repeat" in aniObj && aniObj.repeat != 0) {
				tw.dura = time;
				tw.rp = aniObj.repeat;
				if ("repeatDelay" in aniObj) {tw.rpdelay = aniObj.repeatDelay;};
				checkID(tobj);
				filterKey(aniObj);
				yoyoNext();
			} 
		}

		function yoyoNext() {
			if (tw.rpcount%2 === 0) {
				setCal(tw.poA, tw.poB);
			} else {
				setCal(tw.poB, tw.poA);
			}
			startTween();
		}

		function delayHandler(tobj, time, aniObj, callback) {
			var delay = aniObj.delay*1000;
			delete aniObj.delay;
			tw.timer = setTimeout(function(){
				callback.apply(null, [tobj, time, aniObj]);
			}, delay);
		}

		function checkID(tobj) {
			if (tobj instanceof Element) {
				tw.dom = tobj;
				tw.id = tobj.id;
				if (twreg.trans[tw.id] === undefined) {
					twreg.searchTrans(tw.dom);
				}
			} else {
				tw.trg = tobj;
				if ("id" in tobj) {
					tw.id = tobj.id;
				} else {
					tw.id = String(Math.random());
				}
			}
		}

		function filterKey(aniObj) {

			if ("autoAlpha" in aniObj) {
				tw.autoAlpha = true;
				aniObj.opacity = aniObj["autoAlpha"];
			}

			for (var key in aniObj) {
				var v = aniObj[key];
				if (key === "ease" && v in easing) {
					tw.ease = easing[v];
				} else if (vKeys.css.indexOf(key) != -1) {
					parseCSS(key, v)
				} else if (vKeys.trans.indexOf(key) != -1) {
					parseTransform(key, v);
				} else if (vKeys.evs.indexOf(key) != -1) {
					tw.evs[key] = v;
					aniObj[key].apply(null, aniObj[key+"Params"]);
				} else if (typeof v === 'number') {
					parseNumber(key, v);
				} else if (vKeys.skip.indexOf(key) == -1){
					console.log("NOT GOOD. " + key, aniObj[key]+ " is not supported property currently");
				}
			}
		}

		function parseCSS(key, value) {
			tw.poA[key] = cssToObj(comCSS(tw.dom,key));
			tw.poB[key] = cssToObj(value);
		}

		function parseTransform(key, value) {

			if (!twreg.trans[tw.id].hasOwnProperty(key)) {
				twreg.addTrans(tw.id, key, vKeys.inTr[key]);
			}
			tw.poA[key] = twreg.trans[tw.id][key];
			tw.poB[key] = cssToObj(value);
		}

		function parseNumber(key, value) {
			tw.poA[key] = (tw.trg != undefined) ? {unit:"", values:[tw.trg[key]]}:{unit:"", values:[0]};
			tw.poB[key] = {unit:"", values:[value]};
		}

		function setCal(objA, objB) {
			for (var key in objA) {
				tw.cals[key] = [];
				for (var i = 0; i < objA[key].values.length; i++ ) {
					tw.cals[key].push({b:objA[key].values[i], c:objB[key].values[i]-objA[key].values[i], unit:objA[key].unit});
				}
			}
		}

		function renderTrans() {
			var tcss = objToCss(tw.id);
			//console.log("======= in renderDom", count, tw.parent.name, tcss);
			setStyle(tw.dom, "transform", tcss);
		}

		function startTween() {

			var d = new Date();
			var duration = tw.dura*1000;
			var startTime = d.getTime();
			var endTime = startTime + duration;

			var timePassed = 0;
			var count = 0;
			if (tw.rp == undefined || tw.rpcount === 0) onStart();
			tw.intv = requestAnimFrame(twRender);

			function twRender() {

				var ctime = new Date();
				timePassed = ctime.getTime() - startTime;
				count++;
				if (Object.keys(tw.cals).length > 0) {
					for (var key in tw.cals) {
						tw.twobj[key] = [];
						for (var i = 0; i < tw.cals[key].length; i++) {
							tw.twobj[key].push(tw.ease((timePassed < duration) ? timePassed:duration, tw.cals[key][i].b, tw.cals[key][i].c, duration));
						}
						if (vKeys.trans.indexOf(key) != -1) {
							twreg.trans[tw.id][key].values = tw.twobj[key];
						} else if (tw.trg != undefined) {
							tw.trg[key] = tw.twobj[key][0];
						}
					}
					if ("dom" in tw) renderDom();
					tw.intv = requestAnimFrame(twRender);
					if (timePassed < duration) {
						onUpdate();
					} else {
						if (tw.rp != undefined && tw.rpcount < tw.rp-1 || tw.rp == -1) {
							onRepeat();
						} else {
							onComplete();
						}
						cancelAnimationFrame(tw.intv);
					}
				} else {
					cancelAnimationFrame(tw.intv);
					twreg.unregi(tw.parent);
				}

			}

			function renderDom() {

				for (var key in tw.cals) {
					if (vKeys.css.indexOf(key) != -1) {
						for(var i = 0; i < tw.cals[key].length; i++) {
							if (tw.cals[key][i].unit) {
								tw.dom.style[key] = tw.twobj[key][i]+tw.cals[key][i].unit;
							} else {
								tw.dom.style[key] = tw.twobj[key][i];
							}
						}
					}
				}
				renderTrans();
			}

			function onStart() {
				//console.log("==== onStart");;
				twreg.regi(tw.parent);
				tw.isTween = true;
				if(tw.autoAlpha) {tw.dom.style.display = "block"}; 
				if (tw.evs["onStart"]) {
					tw.evs["onStart"].apply(null, tw.evs["onStartParams"]);
				}
			}

			function onUpdate() {
				if (tw.evs["onUpdate"]) {
					tw.evs["onUpdate"].apply(null, tw.evs["onUpdateParams"]);
				}
			}

			function onRepeat() {
				//console.log("==== onRepeat");
				tw.rpcount++;
				tw.timer = setTimeout(function(){
					yoyoNext();
				}, tw.rpdelay*1000);
				if (tw.evs["onRepeat"]) {
					tw.evs["onRepeat"].apply(null, tw.evs["onRepeatParams"]);
				}
			}			

			function onComplete() {				
				//console.log("=== onComplete tweensi ended: FPS was ", tw.parent.name, count);
				if(tw.autoAlpha && comCSS(tw.dom, "opacity") === "0") {tw.dom.style.display = "none"}; 
				if (tw.evs["onComplete"]) {
					tw.evs["onComplete"].apply(null, tw.evs["onCompleteParams"]);
				}
				tw.isTween = false;
				twreg.unregi(tw.parent);
			}


		}
		this.stopTw = function () {
			cancelAnimationFrame(tw.intv);
			if(tw.timer)clearInterval(tw.timer);
			twreg.unregi(tw.parent);
		}

	}

	function comCSS(tdiv, tprop) {
		var tv = document.defaultView.getComputedStyle(tdiv,null).getPropertyValue(tprop);
		return tv;
	}

	function cssToObj(tst) {
		tst = String(tst);
		var obj = {};
		obj.values = [];
		if (tst.indexOf("(") != -1) {
			var preps = tst.split("(");
			var argus = preps[1].split(",");
			obj.unit = argus[0].replace(/[^A-Za-z]/g, '');
			obj.values = [];
			for(var j=0; j < argus.length; j++){
				var tv = parseFloat(argus[j]);
				if (preps[0] === "random") {
					tv = tv*Math.random();
				}
				obj.values.push(parseFloat(tv));
			}
		} else {
			obj.unit = tst.replace(/[^A-Za-z]/g, '');
			obj.values.push(parseFloat(tst));
		}
		//console.log("======== in convertcssToObj", obj);
		return obj;	
	}

	function objToCss(tid) {
		var tst = "";
		var tobj = twreg.trans[tid];
		if (Object.keys(tobj).length > 0) {
			for (var key in tobj) {
				var tcss = key+"(";
				for (var i = 0 ; i < tobj[key].values.length; i++) {
					tcss += tobj[key].values[i];
					tcss += tobj[key].unit;
					if (i < tobj[key].values.length-1) {
						tcss += ",";
					} 
				}
				tcss += ")";
				//console.log("=== in objToCss", tcss);
				tst += tcss;
			}		
		}
		//console.log(tst);
		return tst;
	}

	function setStyle(tobj, tprop, tvalue) {
		for (var i = 0; i < browsers.length; i++) {
			var tpre = browsers[i];
			tobj.style[tpre+tprop] = tvalue;
		}
	}
	
	//https://gist.github.com/dfkaye/6384439 by "dfkaye"
	function getFnName(fn) {
		var f = typeof fn == 'function';
		var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
		return (!f && 'not a function') || (s && s[1] || 'anonymous');
	}

	function delayedCall (time, callback, params) {
		var obj = {};
		obj.fnName = getFnName(callback);
		obj.timer = setTimeout(function(){
			callback.apply(null, params);
			twreg.unregiDcall(obj.fnName);
		}, time*1000); 
		twreg.regiDcall(obj);
	}

	function killDelayedCallsTo (callback) {
		twreg.unregiDcall(getFnName(callback));
	}

	function killTweensOf(tobj, aniObj) {
		if (aniObj === undefined) {
			twreg.kill(tobj.id);
		} else {
			twreg.killOf(tobj.id, aniObj);
		}
	}

	/*
	this defines the public method.
	*/
	return {
		killTweensOf : function (o, a) {
			if("id" in o) {killTweensOf(o, a);} else {console.log("[ERROR] DOM object must have a ID")};
		}, 
		delayedCall : function(o, t, a) {
			delayedCall(o, t, a);
		}, 
		killDelayedCallsTo : function (callback) {
			killDelayedCallsTo(callback);
		},
		to : function(o, t, a) {
			var twsi = new Tweensi();
			twsi.to(o, t, a);
			return twsi;
		},
		from : function (o, t, a) {
			var twsi = new Tweensi();
			twsi.from(o, t, a);
			return twsi;
		},
		set : function (o, a) {
			var twsi = new Tweensi();
			twsi.set(o, a);
			return twsi;
		},
		yoyo : function (o, t, a) {
			var twsi = new Tweensi();
			twsi.yoyo(o, t, a);
			return twsi;
		}
	}

})();





// t = current time, b = start value, c = change in value, d = duration
// t and d can be frames or seconds/milliseconds

var easing = {

	linear: function (t, b, c, d) {
		return c*t/d + b;
	},

	easeInQuad: function (t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (t, b, c, d) {
		return c - easing.easeOutBounce (d-t, 0, c, d) + b;
	},
	easeOutBounce: function (t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (t, b, c, d) {
		if (t < d/2) return easing.easeInBounce (t*2, 0, c, d) * .5 + b;
		return easing.easeOutBounce (t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
}

