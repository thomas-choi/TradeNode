// JScript File
var   fs = require('fs');
var   util = require('util');
var   AL = require('Log');
var   path = require('path');
var   hash = require('hash').CreateHash();
var   SysData = require('SysData');
var   SM = require('SubMgr');
var appcfg = require('../config/realtime_server_config').configs;

function StratData() {
    this.sName = '';
    this.modPtr = null;
    this.simStream = null;
    this.sysParam = SysData.newSysData();  
};

this.init = function(app, io, CE, logger) {

    logger.info('Strat Mgr init');  
    /* ------------------ Load models & controllers ----------------- */
    (function(folder, fn){
        fs.readdir(__dirname + folder, function(err, files){
            if (err) throw err; else files.forEach(function(file){
                if (path.extname(file) == ".js") fn(file);
            });
        });
        return arguments.callee;
    })('/Strategy', function(n){
        var strat = new StratData(); 
	    strat.modPtr = require('./Strategy/' + n);
	    strat.modPtr.init(CE, logger);
	    strat.sName = strat.modPtr.data.sName;
	    logger.info('load strategy in hash:'+util.inspect(strat));
	    hash.setItem(strat.sName, strat);
	    CE.emit('strategy', strat.modPtr.data, strat.modPtr.parm);	   
    });
    
    CE.on('cmd', function(cmdData) {
        logger.info('SM:cmd '+util.inspect(cmdData)); 
        var command  = cmdData.command;
        var strat = hash.getItem(cmdData.sName);
        if (strat) {
            logger.info ('strat found:'+util.inspect(strat));
            if (command == 'start') {
                if (strat.sysParam.type == 'sim') {
                    strat.simStream = SM.startSim(strat.sysParam.simdate);
                } else { 
                    SM.start(appcfg.DDS.port, appcfg.DDS.addr);           
                } 
                strat.modPtr.start();
		    } else if (command == 'stop') {
                strat.modPtr.stop();
                if (strat.simStream) {
 //                   strat.simStream.destroy();
                    strat.simStream = null;
                 }
		    } else if (command == 'pause') {
                strat.modPtr.pause();
		    } else if (command == 'resume') {
                strat.modPtr.resume();
		    } else if (command == 'fclose') {
                strat.modPtr.fclose();
		    } 
        } 
    }); 

    CE.on('r_strategy', function() {
        logger.info('SM: r_strategy event');
        hash.traverse(function(strat) {
 	        CE.emit('strategy', strat.modPtr.data, strat.modPtr.parm);	   
       }); 
    }); 
   
    CE.on('setup', function(sParm, sysParm) {
        logger.info('StraMgr setup:'+util.inspect(sParm)+','+util.inspect(sysParm));
        var strat = hash.getItem(sParm.sName);
        if (strat) {
            logger.info('strat found:'+util.inspect(strat));
            strat.modPtr.parm.assign(sParm);
            strat.sysParam.assign( sysParm);
            logger.info('new Strat Parm:'+util.inspect(strat));
        }
    });
   
};