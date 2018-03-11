// ClientMgr
// 1) interface with Web-Client
// 2) configure the HTTP server

var   util = require('util');
var   AL = require('Log');
var   currSName = null;

function myTimeConvert(inTime, logger) {
    var   today = new Date();
    var hh = Math.floor(inTime/10000);
    var ms = inTime%10000; 
    var mm = Math.floor(ms/100);
    var ss = ms%100; 
    today.setHours(hh, mm, ss);
    logger.debug('Timeconvert('+inTime+') to '+hh +','+mm +','+ ss + ' ==> '+util.inspect(today));
    return today.getTime();
}

this.init = function(app, io, CE, logger) {

    logger.info('Client Mgr Init');
    // listen socket.io event

    io.sockets.on('connection',  function(socket) {
        logger.info('ClientMgr: connection ');
  
        socket.on('cmd', function(cmdData) {
            logger.info('ClientMgr: cmd ' + util.inspect(cmdData));
            if (cmdData.command == 'trace') {
                currSName = cmdData.sName;
            } else if (cmdData.command == 'start') {
                socket.emit('ClearOB');
                socket.emit('ClearChart'); 
            }
            CE.emit('cmd', cmdData);
        });

        socket.on('setup', function(sParm, sysParm) {
            logger.info('ClientMgr: setup ' + util.inspect(sParm)+','+util.inspect(sysParm));
            CE.emit('setup', sParm, sysParm);
        });

        socket.on('syssetup', function(sysParm) {
            logger.info('ClientMgr: syssetup ' + util.inspect(sysParm));
            CE.emit('syssetup', sysParm);
        });

        // internal event to web-client

        CE.on('PnL', function(PnLData) {
            logger.info('ClientM PnL: '+ util.inspect(PnLData));
            socket.emit('PnL', PnLData); 
        });

        CE.on('ordack', function(OrdData) {
            logger.info('ClientM ordack: '+ util.inspect(OrdData));
            if (OrdData.Ref.indexOf(currSName) >= 0) {
                socket.emit('ordack', OrdData); 
            } 
        });

        CE.on('chart', function(ChartData) {
            if ((ChartData.sName == currSName) && (ChartData.xtime < 239999)) {
                logger.debug('ClientM chart: '+ util.inspect(ChartData)); 
                ChartData.xtime = myTimeConvert(ChartData.xtime, logger);
                socket.emit('chart', ChartData); 
            } 
        });

        CE.on('strategy', function(StratData, stratParm) {
            logger.debug('ClientM strategy: '+ util.inspect(StratData)+', '+util.inspect(stratParm));
            socket.emit('strategy', {straData: StratData, straParam: stratParm}); 
        });
        
        // recover all strategy
        logger.info('recover all strtegy r_strategy event');
        CE.emit('r_strategy');
    });
};