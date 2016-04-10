# MobLog-JS
JavaScript console for mobile development.

**This repo is still under development, more features will be added later**

Inspired by https://github.com/chinchang/screenlog.js, I thought screenlog.js lacked many useful features so I started working on this.

This is what it looks like
![Whoops, looks like the image won't load](http://puu.sh/ocZMI/c8aa771e9a.png "Preview")

Initialize it like this, in your document's head before any other script is loaded.
```javascript
<script src="mob-log.js"></script>
<script>
	MobLog.init({
		intercept : ['log', 'info', 'error'],
		catchErrors : true
		allowInput : true
	});
</script>
```

## Options

**intercept [array]**

Defines which type of window.console calls will also be logged in MobLog (only support for .log(), .info() and .error() in this version).

**catchErrors [boolean]**

Enables or disables logging window errors (often caused by bugs/typos/malfunctioning code or browser incompatibility).

**allowInput [boolean]**

Adds an input field to the console where you can insert JavaScript code, this is done using eval() so NEVER EVER use this option in production.

Once MobLog has been initialized it can't be initialized again, this is due to the fact that someone could re-initialize it and get access to the allowInput option.

## Todo
- Syntax highlighting for objects
- Object folding (instead of showing the raw object string)
- Big array folding
- Responsiveness
- Browser support tests
- Broader range of options (e.g. for styling or position)
- Upon a system error, make a link to the file in which the error occured, leading to the exact rule as well
- Might add console.table and console.time to the intercept option, but I'm not sure if it's worth

## Changelog

**10-04**

- Added auto scrolling whenever a new line is written

---

**09-04**

- Added error catching
- Added catchErrors option
- Added navigating through command history using up and down arrow keys

---

