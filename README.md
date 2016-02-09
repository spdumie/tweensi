# Tweensi.js

Javascript light weight FPS based Tween Engine 

I am a developer, working in the advertising world for a pretty long time.
Once Flash conquered interactive web, TweenLite was the most famous tool for animation and it was so light so it can be used even for 30kb or 50kb banners.

But after Javascript version TweenLite & TweenMax was developed, many designers & developers were so happy that they don’t need to look up for the new syntax documentation page again, but the convenience has the price.

Minified TweenLite is 22k, and it needs 5k easing pack to add nice movement.
TweenMax is 108k, some CSS plug-ins are near 40k.
Gzip helps a bit when directly download it form the URL, but it adds some HTTP calls then.
That is why I am trying to come up with this solution. Tweensi is12kb, with all easing included.

My dear friend Ian developed a CSS transition base animation engine, which is 6k, but the syntax is far from TweenLite that designers are so familiar with, and many features are also missing, like onUpdate, because it is based on CSS transition, some of the API tools are not easy to be added. Thus this new tween engine must have FPS based calculation.


Characteristics of Tweensi
--------------
- Since this should be animation controls, many of css properties will not be included, but CSS3 Transforms must be included without plugin addition.
- Once transform changes happened to an DOM element, all CSS3 transform properties are transferred to "Matrix" or "Matrix3D". It is almost impossible to retrieve the original values from Matrix or Matirx3D. So all CSS transform values such as "rotate", "scale", "translate", "skew" are stored at window.TweensiReg, as the global value, and calculated from there.
- Multiple Tweensi can be applied to one object.
```javascript

Tweensi.to($$("box"), 2, {left:"500px", top:"300px", rotate:"360deg"});
Tweensi.to($$("box"), 1, {delay:1, width:"200px", height:"200px", rotate:"90deg"});

```
- the second Tweensi starts after 1 sec of first Tweensi. but "width" & "height" are not interfered with first Tweensi, they will additionally be calculated & tweened. But the "rotate" is overlapped, first one will be cancelled, and second one "90deg" will be calculated from the current rotational position.

Known Bugs
--------------
- if you set transform scale(1.5, 1.5) in the CSS style sheet, and later trying to tween it as single value, such as scale(2), it will do nothing, because it ended up tweening scale (1.5, 1.5) to scale (2, NaN).


How to use:
--------------

```javascript
Tweensi.to($$("box"), 1, {autoAlpha:0, left:"500px", top:"300px", rotate:"360deg"});
// or
var tw = Tweensi.to($$("box"), 1, {autoAlpha:0, left:"random(500px)", top:"random(300px)", rotate:"random(360deg)"});

```
- Tweensi.to(object, time, propertyObject);
- $$(“idName”) is easy & simple element ID referring tool.
- No variable assign or class assign needed, just start with “Tweensi.to” or “Tweens.from”, etc.
- But you can assign one to control it later. (cancel etc.)
- CSS3 properties can be used directly, such as rotate, scale, translate, etc.
- “random(500px)” is equal to (500 * Math.random())+”px” for interesting test results.


How to cancel:
--------------
```javascript
	
Tweensi.yoyo($$("box"), 1, {repeat:10, repeatDelay:1, left:"400px", top:"200px", rotate:"180deg"});
	
setTimeout(function(){
	Tweensi.killTweensOf($$("box"));
}, 3000);

// or
var tween = Tweensi.to($$("box"), 1, { delay:1, left:"400px", top:"200px", rotate:"180deg"});
setTimeout(function(){
	tween.stopTw();
}, 1500);
	
```
- Tweensi.killTweensOf($$("box")) will stop every property that the ID "box" element has.
- Assigned var tween has .stopTw() to do the same, because Tweensi.to returns a Tweensi class.


Supported CSS properties
--------------
```javascript
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

```
- CSS only has "left", "top", "width", "height", "opacity", since this is animation engine. other properties can be added here.
- CSS3 Transform properties are almost all of them, using transform properties are recommended and it will start hardware acceleration on most of web browsers.
- AutoAlpha is supported, it turns display "none" or "block", in the beginning or at the end of it.
- you can tween any object, simple as {a:100, b:200}, "a" or/and "b" property, even they are not registered as vKeys, as long as the values are number.
- "delay" works too.

Events supported
--------------
```javascript

Tweensi.to($$("box"), 2, {testv1:100, testv2:1000, onStart:test1, onStartParams:[“p1”, “p2”], onComplete:test2, onUpdate:test3, onRepeat:test4});	
```
- onStart needs to have callback function name, onStartParmas needs array of parameters.
- onEachEvent has onEachEventParams for parameter inputs.
- onRepeat is only called on Tween.yoyo, when one trip is finished.


## API

### $$("idName")
```javascript
function $$(tname) {
	var tobj = document.getElementById(tname);
	return tobj;
}
```

### Tweensi.to()
```javascript
var tobj = {a:100, b:200, c:300};
Tweensi.to(tobj, 1, {a:500, b:200, c:400});
//or
Tweensi.to($$("box"), 1, {left:"100px", top:"200px", rotate:"random(360deg)"});
```
- Any object & it's property can be tweened, as long as the value is number. 
- First one tweens "a" from 100 to 500, "b" from 200 to 200, "c" from 300 to 400.
- There should be a "box" div element to work $$("box")
- the DIV element will be tweened from "current left" to "100px", "current top" to "200px", and rotate to random deg.

### Tweensi.from()
```javascript
Tweensi.from($$("box"), 1, {opacity:"random(1)", left:"random(500px)", top:"random(300px)", width:"random(200px)", height:"random(200px)", rotate:"random(360deg)"});
// or try
Tweensi.from($$("box"), 1, {opacity:1, left:"500px", top:"300px", width:"200px", height:"200px", rotate:"360deg"});
```
- First Tweensi moves the "box" to some random place, and starts moving it from there.
- Second Tweensi's opacity is number, please notice it.

### Tweensi.yoyo()
```javascript
Tweensi.to($$("box"), 1, {yoyo:true, repeat:4, repeatDelay:1, left:"400px", top:"200px", rotate:"180deg"});
Tweensi.yoyo($$("box"), 1, {repeat:4, repeatDelay:1, left:"400px", top:"200px", rotate:"180deg"});
```
- Tweensi.to with property yoyo:trun and Tweensi.yoyo are the same. Tweesi.to with yoyo:trun will be passed to Tweesi.yoyo.
- repeat:0 will do nothing, need to be at least 1.
- repeat:4, means 2 round trip, odd number stops at target location, even number stops at original position.
- repeat:-1 will do it infinitely. 
- repeatDelay is optional

### Tweensi.set()
```javascript
Tweensi.from($$("box"), 0, {left:"400px", top:"200px", rotate:"180deg"});
Tweensi.set($$("box"), {left:"400px", top:"200px", rotate:"180deg"});
```
- Tweensi.to or Tweensi.from with animation duration 0 are equal to Tweensi.set

### Tweensi.delayedCall()
```javascript
Tweensi.delayedCall(2, testCall, ["param1", "param2"]);
//or
Tweensi.delayedCall(2, testCall);
```
- after 2 seconds, function testCall() will be called.
- Params are optional

### Tweensi.killDelayedCallsTo()
```javascript
Tweensi.delayedCallsTo(testCall);
```
- This will cancel the delayedCall searched by function name

### Tweensi.killTweensOf()
```javascript
Tweensi.killTweensOf($$("box"));
//or
Tweensi.killTweensOf($$("box"), {left:true, top:true, rotate:true});
```
- First Tweensi just kill all tween and unregister it form the Tweensi Register.
- If it has properties:true, it will kill only that properties, others go to finish.  


