(function(){
	// --- HELPERS ---
	// Branches-JS element builder
	String.prototype.$ = function(attr){
		var ele = document.createElement(this);
		if(attr) for(key in attr) ele.setAttribute(key, attr[key]);

		var branchesInstance = new Branches(ele);
		return branchesInstance;
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
		'.MobLog-line': {
			padding: '3px',
			color: '#34495e'
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
			// padding: '1px 10px 1px 8px',
			color : '#34495e'
		}
	}

	var typeTransform = {
		info : '<span class="MobLog-type-info MobLog-type">i</span> ',
		log : '<span class="MobLog-type-regular MobLog-type">-</span>',
		error : '<span class="MobLog-type-error MobLog-type">!</span> '
	}

	var app = {
		state : {
			isInitialized : false,
			isHidden : true
		},
		cache : {
			outputElement : undefined, // [DOM Node]
			logsBeforeDOMLoad : [], // Whenever a console call happens before the MobLog element has been inserted, cache it
			_console : {} //Save the original console fn
		}
	}

	function init(options){
		if(app.state.isInitialized) throw "UNAUTHORIZED: MobLog has already been initialized, due to security reasons you may not initialize it again.";
		app.state.isInitialized = true;
		var intercepts = options.intercept || false;
		var hasInput = options.allowInput || false;

		// Generate the CSS
		document.head.appendChild(generateCSS());

		// Generate the HTML and DOM apply events
		var MobLogHTML = buildConsole(hasInput);
		document.addEventListener('DOMContentLoaded', function(){
			document.body.appendChild(MobLogHTML);
			app.cache.outputElement = document.getElementById('MobLog-output');
			insertCachedConsoleCalls();
			applyEvents(hasInput);
		}, false);

		// Extend console calls
		if(intercepts){
			intercepts.forEach(function(name){
				app.cache._console[name] = console[name];
				console[name] = extendConsole(name);
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
		return 'div'.$({'id' : 'MobLog'}).add([
			'div'.$({'id' : 'MobLog-triggerShow'}).add([
				'div'.$({'id' : 'MobLog-triggerShow-text'}).txt('«')
			]),
			'div'.$({'id' : 'MobLog-output'}),
			(function(){if(hasInput) return 'input'.$({'type' : 'text', 'id' : 'MobLog-input'}); else return 'span'.$()})()
		]).frag();
	}

	function insertCachedConsoleCalls(){
		app.cache.logsBeforeDOMLoad.forEach(function(data){
			var element = 'div'.$({'class' : 'MobLog-line'}).html(typeTransform[data.type]+data.args[0]).frag();
			app.cache.outputElement.appendChild(element);
		});
	}

	function applyEvents(hasInput){
		// Input events
		if(hasInput){
			var input = _id('MobLog-input');
			input.addEventListener('keyup', function(e){
				if(e.keyCode == 13 || e.which == 13){
					eval(this.value);
					this.value = '';
				}
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

	function extendConsole(name){
		var newLog = function(){
			if(app.cache.outputElement){
				var output = '';
				for (var i = 0; i < arguments.length; i++) {
					switch(typeof arguments[i]){
						case 'number' :
							output += '<span style="color : #3694D3">'+arguments[i]+'</span>'
						break;

						case 'object' :
							if(Array.isArray(arguments[i])){
								output += '[';
								var argsBind = arguments[i];
								argsBind.forEach(function(t, ind){
									if(typeof t == 'string') output += '<span style="color : #e74c3c;">"'+t+'" </span>';
									else if(typeof t == 'number') output += '<span style="color : #3694D3;">'+t+'</span>';

									output += (argsBind.length !== ind+1 ? ', ' : '');
								})
								output += ']';
							}
							else{
								output += JSON.stringify(arguments[i]);
							}
						break;

						case 'string' :
							output += '"<span style="color : #e74c3c">'+arguments[i]+'</span>"'
						break;

						default:
							output += arguments[i];
					}
					output += ' ';
				};
				var element = 'div'.$({'class' : 'MobLog-line'}).html(typeTransform[name]+output).frag();
				app.cache.outputElement.appendChild(element);
			}
			else app.cache.logsBeforeDOMLoad.push({type : name, args : arguments});
		}

		return function(){
			newLog.apply(this, arguments);
			if (typeof app.cache._console[name] === 'function') {
				app.cache._console[name].apply(console, arguments);
			}
		};
	}

	function test(txt){
		var newLine = 'div'.$({'class' : 'MobLog-line'}).txt(txt).frag();
		_id('MobLog-output').appendChild(newLine);
	}

	window.MobLog = {
		init : init,
		log : test
	}
})();
