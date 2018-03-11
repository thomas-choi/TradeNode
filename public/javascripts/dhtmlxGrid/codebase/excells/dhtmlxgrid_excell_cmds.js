function eXcell_cmds(cell){
	this.cell = cell;
    this.grid = this.cell.parentNode.grid;
    this.isDisabled = function(){ return true; }
	this.edit = function(){}
	this.detach = function(){}
	
	this.setValue = function(val){
		this.cell.val = val;
		
		this.cell.innerHTML = [
		    '<button class="cmd-btn">Setting</button>',
		    '<button class="cmd-btn">Start</button>',
		    '<button class="cmd-btn">Stop</button>',
		    '<button class="cmd-btn">Pause</button>',
		    '<button class="cmd-btn">Resume</button>',
		    '<button class="cmd-btn">fclose</button>',
		    '<button class="cmd-btn">Trace</button>'
		].join('');
		
		var grid = this.grid;
		
		this.cell.childNodes[0].onclick = function(){ grid.callEvent('onCommand', ["setting", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
		this.cell.childNodes[1].onclick = function(){ grid.callEvent('onCommand', ["start", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
		this.cell.childNodes[2].onclick = function(){ grid.callEvent('onCommand', ["stop", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
		this.cell.childNodes[3].onclick = function(){ grid.callEvent('onCommand', ["pause", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
		this.cell.childNodes[4].onclick = function(){ grid.callEvent('onCommand', ["resume", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
		this.cell.childNodes[5].onclick = function(){ grid.callEvent('onCommand', ["fclose", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
		this.cell.childNodes[6].onclick = function(){ grid.callEvent('onCommand', ["trace", grid, this.parentNode.parentNode.idd, this.parentNode._cellIndex]); };
	}
	
	this.getValue = function() {
		return (this.cell.val || "");
	}
}

eXcell_cmds.prototype = new eXcell;
