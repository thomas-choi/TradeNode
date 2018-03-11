// JScript File
var APL = require('Log');
var EM = require('ExecMgr');
var PL = require('PositionMgr');
var SM = require('SubMgr');
var appcfg = require('../config/realtime_server_config').configs;

this.init = function(app, io, CE, logger) {

    logger.info('Services Mgr Init');

    APL.inittrade('TradeEngine', '1.0.0.1');       // init trade file
    SM.init(logger);
    EM.start(appcfg.ITS.port, appcfg.ITS.addr, CE, logger);             // start up Execution Mgr
    PL.start(CE, logger);              // start up Position Mgr

};

