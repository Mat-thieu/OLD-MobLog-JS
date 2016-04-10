(function(){
	// --- HELPERS ---
	// Branches-JS element builder
	String.prototype.$ = function(attr){
		var ele = document.createElement(this);
		if(attr) for(key in attr) ele.setAttribute(key, attr[key]);

		return new Branches(ele);
	};
	var Branches = function(ele){this.ele = ele}
	Branches.prototype = {
		txt : function(content){
			var txtNode = document.createTextNode(content);
			this.ele.appendChild(txtNode);
			return this;
		},
		html : function(customHtml){
			this.ele.innerHTML = customHtml;
			return this;
		},
		add : function(content){
			var self = this;
			content.forEach(function(val, ind){
				if(val == '[object NodeList]' || val == '[object HTMLCollection]'){
					for (var i = val.length - 1; i >= 0; i--) { self.ele.appendChild(val[i]) };
				}
				else self.ele.appendChild(val.ele);
			})
			return this;
		},
		raw : function(){
			return this.ele.outerHTML;
		},
		get : function(){
			return this.ele;
		},
		frag : function(){
			var frag = document.createDocumentFragment();
			frag.appendChild(this.ele);
			return frag;
		}
	}
	// id selector
	function _id(query){return document.getElementById(query);}
	// classList replacements
	function addClass(node,className){
		className = className.split(",");
		for(var i=0; i < className.length; i++){
			if((" "+node.className+" ").indexOf(" "+className[i]+" ") == -1)node.className+=" "+className[i];
		}
	}
	function removeClass(node, className){
		var nodeClasses = node.className;
		className = className.split(",");
		for(var i=0; i < className.length; i++){
            nodeClasses = nodeClasses.replace(className[i], '');
        }
        node.className = nodeClasses;
	}
	// ./ --- HELPERS ---

	// --- MobLog Code ---
	var css = {
		'#MobLog' : {
			background: 'white',
			width: '300px',
			position: 'fixed',
			top: '5px',
			right: '-295px',
			boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
			fontFamily: "'Arial', 'Helvetica', 'sans-serif'",
			transition: 'right 0.5s ease-out',
			fontSize: '12px'
		},
		'#MobLog.showLog' : {
			right: '5px'
		},
		'#MobLog-output' : {
			maxHeight: '200px',
			overflowY: 'auto'
		},
		'#MobLog-input' : {
			width: '100%',
			padding: '2px 2px 5px 4px',
			margin: '0',
			border: '0',
			boxSizing: 'border-box'
		},
		'#MobLog-input:focus' : {
			outline: '0',
			borderBottom: '1.5px solid #95a5a6'
		},
		'#MobLog-triggerShow' : {
			background: '#3498db',
			boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
			color: '#ecf0f1',
			fontSize : '26px',
			fontWeight: 'bold',
			width: '50px',
			height: '35px',
			marginLeft: '-50px',
			marginBottom: '-35px',
			textAlign: 'center',
			boxSizing: 'border-box',
			borderTopLeftRadius: '7px',
			borderBottomLeftRadius: '7px',
			cursor: 'pointer'
		},
		'.MobLog-line' : {
			padding: '3px',
			color: '#34495e'
		},
		'.MobLog-systemError' : {
			backgroundColor : '#e74c3c !important',
			color : 'white !important'
		},
		'#MobLog-triggerShow-text' : {
			width: '50px',
			height: '34px'
		},
		'.MobLog-rotate' : {
			transform: 'rotate(180deg)',
			'-webkit-transform': 'rotate(180deg)'
		},
		'.MobLog-line:nth-child(even)': {
		   backgroundColor: '#ecf0f1'
		},
		'.MobLog-line:nth-child(odd)': {
		   backgroundColor: '#DCE3E5'
		},
		'.MobLog-type' : {
			fontSize: '16px',
			fontWeight: 'bold',
			padding: '1px 9px 1px 9px',
		},
		'.MobLog-type-info' : {
			color: '#3498db',
		},
		'.MobLog-type-error' : {
			color : '#e74c3c'
		},
		'.MobLog-type-regular' : {
			color : '#34495e'
		},
		'.MogLog-type-systemError' : {
			fontSize : '0.82em',
			marginLeft : '-3px'
		}
	}

	var typeTransform = {
		info 		: '<span class="MobLog-type-info MobLog-type">i</span> ',
		log 		: '<span class="MobLog-type-regular MobLog-type">-</span>',
		error 		: '<span class="MobLog-type-error MobLog-type">!</span> ',
		systemError : '<span class="MogLog-type-systemError MobLog-type">&#10060;</span> '
	}

	var app = {
		state : {
			isInitialized : false,
			isHidden : true
		},
		cache : {
			outputElement : undefined, // [DOM Node]
			logsBeforeDOMLoad : [], // Whenever a console call happens before the MobLog element has been inserted, cache it
			_console : {}, // Save the original console fn
			commands : [], // Store commands exectuted by the user
			cmdHistoryIndex : 0 // Index of command hostory navigation
		}
	}

	function init(options){
		if(app.state.isInitialized) throw "UNAUTHORIZED: MobLog has already been initialized, due to security reasons you may not initialize it again.";
		app.state.isInitialized = true;
		options.intercept = options.intercept || false;
		options.allowInput = options.allowInput || false;
		options.catchErrors = options.catchErrors || false;

		// Generate the CSS
		document.head.appendChild(generateCSS());

		// Generate the HTML and DOM apply events
		var MobLogHTML = buildConsole(options.allowInput);
		document.addEventListener('DOMContentLoaded', function(){
			document.body.appendChild(MobLogHTML);
			app.cache.outputElement = document.getElementById('MobLog-output');
			writeCachedConsoleCalls();
			applyEvents(options.allowInput);
		}, false);

		// Catch errors caused by malfunctioning code
		if(options.catchErrors){
			window.onerror = function(message, source, lineno) {
				handleWindowError(message, source, lineno);
			}
		}

		// Extend console calls
		if(options.intercept){
			options.intercept.forEach(function(type){
				app.cache._console[type] = console[type];
				console[type] = extendConsole(type);
			});
		}
	}

	function generateCSS(){
		var styleString = '';
		String.prototype.toDashedCase = function(){return this.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}
		Object.keys(css).forEach(function(selector){
			styleString += selector+'{';
			for(style in css[selector]){
		    	styleString += style.toDashedCase()+':'+css[selector][style]+';';
		    }
			styleString += '}';
		});

		return 'style'.$().txt(styleString).frag();
	}

	function buildConsole(hasInput){
		var consoleFragment =
		'div'.$({'id' : 'MobLog'}).add([
			'div'.$({'id' : 'MobLog-triggerShow'}).add([
				'div'.$({'id' : 'MobLog-triggerShow-text'}).txt('«')
			]),
			'div'.$({'id' : 'MobLog-output'}),
			(function(){if(hasInput) return 'input'.$({'type' : 'text', 'id' : 'MobLog-input'}); else return 'span'.$()})()
		]).frag();

		return consoleFragment;
	}

	function applyEvents(hasInput){
		// Input events
		if(hasInput){
			var input = _id('MobLog-input');
			input.addEventListener('keyup', function(e){
				if(e.keyCode == 13 || e.which == 13){
					app.cache.commands.push(this.value);
					eval(this.value);
					this.value = '';
				}
				else if(e.keyCode == 38 || e.which == 38){
					if(app.cache.cmdHistoryIndex !== (app.cache.commands.length)){
						var commandList = app.cache.commands;
						var commandIndex = (commandList.length-1)-app.cache.cmdHistoryIndex;
						app.cache.cmdHistoryIndex += 1;
						this.value = commandList[commandIndex];
					}
				}
				else if(e.keyCode == 40 || e.which == 40){
					if(app.cache.cmdHistoryIndex == 1){
						this.value = '';
						app.cache.cmdHistoryIndex = 0;
					}
					else if(app.cache.cmdHistoryIndex !== 0){
						app.cache.cmdHistoryIndex -= 1;
						var commandList = app.cache.commands;
						var commandIndex = (commandList.length)-app.cache.cmdHistoryIndex;
						this.value = commandList[commandIndex];
					}
					else this.value = '';
				}
				else app.cache.cmdHistoryIndex = 0;
			}, false);
		}

		// Display events
		var triggerShow = _id('MobLog-triggerShow');
		triggerShow.addEventListener('mouseup', function(){
			if(app.state.isHidden){
				addClass(_id('MobLog'), 'showLog');
				addClass(_id('MobLog-triggerShow-text'), 'MobLog-rotate');
				app.state.isHidden = false;
			}
			else{
				removeClass(_id('MobLog'), 'showLog');
				removeClass(_id('MobLog-triggerShow-text'), 'MobLog-rotate');
				app.state.isHidden = true;
			}
		}, false);
	}

	function colorByType(inp){
		switch(typeof inp){
			case 'number' :
				var coloredType = '<span style="color : #3694D3">'+inp+'</span>'
			break;

			case 'boolean':
				var coloredType = '<span style="color : #9b59b6">'+inp+'</span>'
			break;

			case 'string' :
				var coloredType = '"<span style="color : #e74c3c">'+inp+'</span>"'
			break;

			default:
				var coloredType = inp;
		}
		return coloredType;
	}

	// ADD CODE HIGHTLIGHTING
	function handleObjectType(obj){
		var output = '';
		if(Array.isArray(obj)){
			output += '[';
			var argsBind = obj;
			argsBind.forEach(function(t, ind){
				output += colorByType(t)+(argsBind.length !== ind+1 ? ', ' : '');
			})
			output += ']';
		}
		else output += JSON.stringify(obj);
		return output;
	}

	function handleWindowError(message, source, lineno){
		sourceArr = source.split('/');
		source = '<b>['+sourceArr[sourceArr.length-1]+':'+lineno+']</b>';
		var errorData = [message, source];
		if(app.cache.outputElement) write(errorData, 'systemError');
		else app.cache.logsBeforeDOMLoad.push({type : 'systemError', args : errorData});
	}

	function write(args, type){
		var newLineClass = 'MobLog-line';
		if(type !== 'systemError'){
			var output = '';
			for (var i = 0; i < args.length; i++) {
				if(typeof args[i] !== 'object') output += colorByType(args[i]);
				else output += handleObjectType(args[i]);
				output += ' ';
			}
		}
		else{
			var output = args.join(' ');
			newLineClass += ' MobLog-systemError';
		}
		var newLine = 'div'.$({'class' : newLineClass}).html(typeTransform[type]+output).frag();
		app.cache.outputElement.appendChild(newLine);

		app.cache.outputElement.scrollTop += app.cache.outputElement.lastChild.offsetHeight;
	}

	function writeCachedConsoleCalls(){
		app.cache.logsBeforeDOMLoad.forEach(function(data){
			write(data.args, data.type);
		});
	}

	function extendConsole(type){
		var newLog = function(){
			if(app.cache.outputElement) write(arguments, type);
			else app.cache.logsBeforeDOMLoad.push({type : type, args : arguments});
		}

		return function(){
			newLog.apply(this, arguments);
			if (typeof app.cache._console[type] === 'function') {
				app.cache._console[type].apply(console, arguments);
			}
		};
	}

	// Assign safe functions to global scope (learned this from screenlog.js, fantastic solution!)
	window.MobLog = {
		init : init
	}
})();
