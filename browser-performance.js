function Performance(name, decimals){
	this.name = name;
	this.decimals = decimals || 2;
	this.start = performance.now();
	this.end = 0;
}
Performance.prototype = {
	measure : function(){
		this.end = performance.now();
		console.info('"'+this.name+'" performance : '+(this.end-this.start).toFixed(this.decimals)+' ms');
	}
}

function Perf(name, decimals){
	this.name = name;
	this.decimals = decimals || 2;
	this.performance = 0;
	this.start = 0;
	this.end = 0;
}
Perf.prototype = {
	start : function(){
		this.start = performance.now();
	},
	end : function(){
		this.end = performance.now();
		this.performance = (this.end-this.start).toFixed(this.decimals);
	},
	measure : function(){
		console.info('"'+this.name+'" performance : '+this.performance+' ms');
	}
}