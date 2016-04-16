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
		// Note that the css is being prepended with "MobLog-" after the selector
		'#MobLog' : {
			background: 'white',
			width: '300px',
			position: 'fixed',
			top: '5px',
			right: '-295px',
			boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
			fontFamily: "'Arial', 'Helvetica', 'sans-serif' !important",
			transition: 'right 0.5s ease-out',
			fontSize: '12px !important'
		},
		'.showLog' : {
			right: '5px !important'
		},
		'#output' : {
			maxHeight: '200px',
			overflowY: 'auto'
		},
		'#input' : {
			width: '100%',
			padding: '2px 2px 5px 4px',
			margin: '0',
			border: '0',
			boxSizing: 'border-box'
		},
		'#input:focus' : {
			outline: '0',
			borderBottom: '1.5px solid #95a5a6'
		},
		'#triggerShow' : {
			background: '#3498db',
			boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
			color: '#ecf0f1',
			fontSize : '26px',
			fontWeight: 'bold',
			width: '40px',
			height: '35px',
			marginLeft: '-40px',
			marginBottom: '-35px',
			padding: '7px',
			textAlign: 'center',
			boxSizing: 'border-box',
			borderTopLeftRadius: '20px',
			borderBottomLeftRadius: '20px',
			cursor: 'pointer'
		},
		'#triggerShow-text' : {
			marginTop: '-6.5px'
		},
		'.rotate' : {
			transform: 'rotate(180deg)',
			'-webkit-transform': 'rotate(180deg)',
			marginTop: '-3.5px !important'
		},
		'.line' : {
			padding: '3px',
			color: '#34495e'
		},
		'.systemError' : {
			backgroundColor : '#e74c3c !important',
			color : 'white !important'
		},
		'.errorLineLink' : {
			fontWeight : 'bold',
			color : 'white'
		},
		'.codeBlock' : {
			background: '#34495e !important',
			color: 'white'
		},
		'.fileName' : {
			background : 'rgba(44, 62, 80,1.0)',
			margin : '-2px -2px 0px -2px',
			padding: '4px 4px 2px 4px',
			fontWeight : 'bold'
		},
		'.tab' : {
			background : '#34495e',
			padding : '2px 12px 2px 15px',
			marginLeft : '20px',
			borderTopLeftRadius : '7px',
			borderTopRightRadius : '7px'
		},
		'.tab-exit' : {
			background : '#e74c3c',
			borderRadius: '50%',
			width: '7px',
			height: '7px',
			margin: '1px 0px 0px 4px',
			display: 'inline-block',
			cursor : 'pointer'
		},
		'.line-error-highlight' : {
			background : 'rgba(231, 76, 60, 0.4)'
		},
		'.line:nth-child(even)': {
		   backgroundColor: '#ecf0f1'
		},
		'.line:nth-child(odd)': {
		   backgroundColor: '#DCE3E5'
		},
		'.type' : {
			fontSize: '16px',
			fontWeight: 'bold',
			padding: '1px 9px 1px 9px',
		},
		'.type-info' : {
			color: '#3498db',
		},
		'.type-error' : {
			color : '#e74c3c'
		},
		'.type-regular' : {
			color : '#34495e'
		},
		'.type-systemError' : {
			fontSize : '0.82em',
			marginLeft : '-3.5px',
			color : '#fff !important'
		}
	}

	var app = {
		settings : { // Settings which aren't major enough to let the user adjust in the init call
			codeViewerScope : 2 // The amount of lines surrounding the error line when opening the code inspector
		},
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
		options.api = options.api || false;

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
		String.prototype.toDashedCase = function(){return this.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();}
		Object.keys(css).forEach(function(selector){
			if(selector !== '#MobLog') styleString += selector.replace(selector[0], selector[0]+'MobLog-')+'{';
			else styleString += selector+'{';
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
			(function(){ return hasInput ? 'input'.$({'type' : 'text', 'id' : 'MobLog-input'}) : 'span'.$() })()
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
				addClass(_id('MobLog'), 'MobLog-showLog');
				addClass(_id('MobLog-triggerShow-text'), 'MobLog-rotate');
				app.state.isHidden = false;
			}
			else{
				removeClass(_id('MobLog'), 'MobLog-showLog');
				removeClass(_id('MobLog-triggerShow-text'), 'MobLog-rotate');
				app.state.isHidden = true;
			}
		}, false);
	}

	function extendConsole(type){
		var newLog = function(){
			if(app.cache.outputElement) write(arguments, type);
			else app.cache.logsBeforeDOMLoad.push({args : arguments, type : type});
		}

		return function(){
			newLog.apply(this, arguments);
			if (typeof app.cache._console[type] === 'function') {
				app.cache._console[type].apply(console, arguments);
			}
		};
	}

	function write(args, type){
		var typeTransform = {
			info 		: 'span'.$({'class' : 'MobLog-type MobLog-type-info'}).txt('i'),
			log 		: 'span'.$({'class' : 'MobLog-type MobLog-type-regular'}).txt('-'),
			error 		: 'span'.$({'class' : 'MobLog-type MobLog-type-error'}).txt('!'),
			systemError : 'span'.$({'class' : 'MobLog-type MobLog-type-systemError'}).html('&#10060;')
		}
		var newLineClassName = 'MobLog-line';
		if(type == 'systemError'){
			var output = args.join(' ');
			newLineClassName += ' MobLog-systemError';
		}
		else{
			var output = '';
			for (var i = 0; i < args.length; i++) {
				if(typeof args[i] == 'object') output += handleObjectType(args[i]);
				else output += colorByType(args[i]);
				output += ' ';
			}
		}
		var newLine = 'div'.$({'class' : newLineClassName}).html(typeTransform[type].raw()+' '+output).frag();
		app.cache.outputElement.appendChild(newLine);

		app.cache.outputElement.scrollTop += app.cache.outputElement.lastChild.offsetHeight;
		applyNewLineEvents(app.cache.outputElement.lastChild);
	}

	function writeCachedConsoleCalls(){
		app.cache.logsBeforeDOMLoad.forEach(function(data){
			write(data.args, data.type);
		});
	}

	function applyNewLineEvents(newLineNode){
		var errorLineLink = newLineNode.querySelector('.MobLog-errorLineLink');
		if(errorLineLink){
			errorLineLink.addEventListener('mouseup', function(e){
				e.preventDefault();
				var url = this.getAttribute('data-url');
				var file = this.getAttribute('data-file');
				var line = parseInt(this.getAttribute('data-line'));
				displayErrorLine(url, file, line);
			}, false);
		}
	}

	function handleWindowError(message, source, lineno){
		sourceArr = source.split('/');
		var file = sourceArr[sourceArr.length-1];
		source = 'a'.$({
					'href' : '#',
					'class' : 'MobLog-errorLineLink',
					'data-url' : source,
					'data-file' : file,
					'data-line' : lineno
				 }).txt('['+file+':'+lineno+']').raw();
		var errorLine = [message, source];
		if(app.cache.outputElement) write(errorLine, 'systemError');
		else app.cache.logsBeforeDOMLoad.push({args : errorLine, type : 'systemError'});
	}

	function displayErrorLine(url, file, line){
		var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) buildCodeBlock(request.responseText);
            else console.error('MobLog: Error loading file data for file '+file);
        };
        request.onerror = function() {
            console.error('MobLog: Error loading file data for file '+file);
        };
        request.send();

        function buildCodeBlock(serverData){
        	var scope = app.settings.codeViewerScope;
            var fileContent = serverData.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\t/g, '&nbsp;&nbsp;').split('\n');
            var output = {
            	before : [],
            	after : []
            }
            for (var i = 0; i < scope; i++) {
            	output.before.push((line-(i+1))+' : '+fileContent[line-(i+2)]);
            	output.after.push((line+(i+1))+' : '+fileContent[line+i]);
            };
            var fileOutput =
                	output.before.reverse().join('<br>')+
                	'div'.$({'class' : 'MobLog-line-error-highlight'}).html((line)+' : '+fileContent[line-1]).raw()+
                	output.after.join('<br>');
           	var outputFragment = 'div'.$({'class' : 'MobLog-line MobLog-codeBlock'}).html('<div class="MobLog-fileName"><span class="MobLog-tab">'+file+' <div class="MobLog-tab-exit"></div></span></div>'+fileOutput).frag();
            app.cache.outputElement.appendChild(outputFragment);

            app.cache.outputElement.scrollTop += app.cache.outputElement.lastChild.offsetHeight;
        }
	}

	function colorByType(inp){
		switch(typeof inp){
			case 'number' :
				var coloredType = 'span'.$({'style' : 'color: #3694D3'}).txt(inp);
			break;

			case 'boolean':
				var coloredType = 'span'.$({'style' : 'color: #9b59b6'}).txt(inp);
			break;

			case 'string' :
				var coloredType = 'span'.$({'style' : 'color: #e74c3c'}).txt('"'+inp+'"');
			break;

			default:
				return inp;
		}
		return coloredType.raw();
	}

	function handleObjectType(obj){
		var output = '';
		if(Array.isArray(obj)){
			output += '[';
			obj.forEach(function(t, ind){
				output += colorByType(t)+(obj.length !== ind+1 ? ', ' : '');
			});
			output += ']';
		}
		// ADD CODE HIGHTLIGHTING
		else output += JSON.stringify(obj);
		return output;
	}

	// Assign safe functions to global scope (learned this from screenlog.js, fantastic solution!)
	window.MobLog = {
		init : init
	}
})();
