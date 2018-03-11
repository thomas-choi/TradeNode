var path = require('path'),
	winston = require('winston')
	configs = require('../config/logging_config').configs;

var pad = function (n) {
	return n < 10 ? '0' + n.toString(10) : n.toString(10);
};

// customize the timestamp display of log info
var timestampFunc = function () {
	var d = new Date();
	
	var time = [
	    pad(d.getHours()),
	    pad(d.getMinutes()),
	    pad(d.getSeconds())
	].join(':');
	              
	return [ d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), time ].join(' ');
};

var datestringFunc = function () {
	var d = new Date();
	
	var time = [
	    pad(d.getHours()),
	    pad(d.getMinutes()),
	    pad(d.getSeconds())
	].join(':');
	              
	return [ d.getFullYear() + "" + pad(d.getMonth() + 1) + "" + pad(d.getDate()) ].join(' ');
};

// add date to the log file
winston.transports.File.prototype._getFile = function (inc) {
    var self = this,
        ext = path.extname(this._basename),
        basename = path.basename(this._basename, ext),
        remaining;
  
    if (inc) {
        if (this.maxFiles && (this._created >= (this.maxFiles - 1))) {
            remaining = this._created - (this.maxFiles - 1);
          
            if (remaining === 0) {
                fs.unlinkSync(path.join(this.dirname, basename + ext));
            } else {
                fs.unlinkSync(path.join(this.dirname, basename + remaining + ext));
            }
        }
    
        this._created += 1;
    }
  
    return this._created 
    		? basename + "_" + datestringFunc() + "_" + this._created + ext 
    		: basename + "_" + datestringFunc() + ext;
};

var customLevels = {
	levels: {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3
	}
};

var loggers = {};

for (var p in configs) {
	var config = configs[p];
	
	var logger = new (winston.Logger)({
		levels: customLevels.levels,
		transports: [
		    new (winston.transports.Console)({
		    	level: config.consoleLevel,
		    	timestamp: timestampFunc
		    }),
	        new (winston.transports.File)({
	        	level: config.fileLevel,
	        	timestamp: timestampFunc,
	        	json: false,
	        	filename: path.join(__dirname, '..', 'logs', config.filename)
	        })
	    ]
	});
	
	loggers[p] = logger;
}

this.getLogger = function(name) {
	var logger = loggers[name];
	if (logger) return logger;
	throw new Error("Logger [" + name + "] not found.");
};
