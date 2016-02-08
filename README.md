# tweensi
Javascript Light weight FPS based Tween Engine 

I am a developer, working in the advertising world for a pretty long time.
Once Flash conquered interactive web, TweenLite was the most famous tool for animation and it was so light so it can be used even for 30kb or 50kb banners.

But after Javascript version TweenLite & TweenMax was developed, many designers & developers were so happy that they don’t need to learn new syntax again, but the convenience has the price.

Minified TweenLite is 22k, and it needs 5k easing pack to add nice movement.
TweenMax is 108k, some CSS plug-ins are near 40k.
Gzip helps a bit when directly download it form the URL, but it adds some HTTP calls then.

My dear friend Ian developed a CSS transition base animation engine, which is 6k, but the syntax is far from TweenLite that designers are so familiar with, and many features are also missing, like onUpdate, because it is based on CSS transition, some of the API tools are not easy to be added.

That is why I am trying to come up with this solution. Tweensi, 12k with all easing included.

How to use:
--------------

```javascript
Tweensi.to($$("box"), 1, {autoAlpha:0, left:"500px", top:"300px", rotate:"360deg"});

Tweensi.to($$("box"), 1, {autoAlpha:0, left:"random(500px)", top:"random(300px)", rotate:"random(360deg)”});

```
- $$(“idName”) is easy & simple element ID referring tool.
- No variable assign or class assign needed, just start with “Tweensi.to” or “Tweens.from”, etc.
- But you can assign one to control it later. (cancel etc.)
- CSS3 properties can be used directly, such as rotate, scale, translate, etc.
- “random(500px)” is equal to (500 * Math.random())+”px” for interesting test resolute.



How to cancel:
--------------
```javascript
	
Tweensi.yoyo($$("box"), 1, {repeat:10, repeatDelay:1, left:"400px", top:"200px", rotate:"180deg"});
	
setTimeout(function(){
	Tweensi.killTweensOf($$("box"));
}, 3000);

// or
var tween = Tweensi.to($$("box"), 1, { left:"400px", top:"200px", rotate:"180deg"});
setTimeout(function(){
	tween.stopTw();
}, 500);
	
```



