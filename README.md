# MobLog-JS
JavaScript console for mobile development.

**This repo is still under development, more features will be added later**

Inspired by https://github.com/chinchang/screenlog.js, I thought screenlog.js lacked many useful features so I started working on this.

This is what it looks like
![Whoops, looks like the image won't load](http://puu.sh/o0N4L/190ddb295c.png "Preview")

Initialize it like this, near the end of your head tag
```javascript
<script src="mob-log.js"></script>
<script>
	MobLog.init({
		intercept : ['log', 'info', 'error'],
		allowInput : true
	})
</script>
```
Intercept defines which type of console commands will also be logged in MobLog (only support for log, info and error in this version).

allowInput adds an input field to the console where you can insert JavaScript code, this is done using eval() so NEVER use MobLog in production.

Once MobLog has been initialized it can't be initialized again, this is due to the fact that someone could re-initialize it and get access to the allowInput option.

**Todo**
- Syntax highlighting for objects
- Object folding (instead of showing the raw object string)
- Big array folding
- Responsiveness
- Browser support tests
- Broader range of options (e.g. for styling or position)
- Use up and down keys to navigate through command history
- Fix scrolling
- Catch every JavaScript error