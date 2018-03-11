var net = require('net'),
	cfg = require('./config/its_router_config').ITS_ROUTER_CONFIG,
    logger = require('./lib/logging').getLogger("its_router");
var ORD = require('./controllers/node_modules/Order');

var monitorMap = {}, stClient = null, rtClient = null, itsClient = null;
var val510 = cfg.tag510;
var val191 = '';

// ----------------- listener for Monitor ------------------------------------------
var mnServer = net.createServer(function(client){
	client.setEncoding("utf8");
    
	var id = client.remoteAddress + ":" + client.remotePort;
    monitorMap[id] = client;
    
	logger.info("Monitor client connected: [" + id + "]");

	client.on('close', function(){
	    logger.info("Monitor client disconnected:["+id+"]");
		var cached = monitorMap[id];
		cached.destroy();
		delete monitorMap[id];
	});
});

// -------------------- listener for Straight Through ---------------------------------------
var stServer = net.createServer(function(client){
	client.setEncoding("utf8");
	stClient = client;

    logger.info("Straight Through client connected");

    client.on('data', function(data){
        logger.debug('ST> '+data); 
        itsClient.write(data);
    });

	client.on('close', function(){
	    logger.info('Straight Through Client disconnected');
		stClient.destroy();
		stClient = null;
	});
});

function getSide(bs) {
    var   omsBS ;
    if (bs == ORD.BS.BUY ) {
        omsBS = 0; 
    } else {
        omsBS =  
    }    
}
// ---------------------- listener for realtime server -------------------------------------
var rtServer = net.createServer(function(client){
	client.setEncoding("utf8");
    rtClient = client;

	logger.info("RealTime client connected");
    
	client.on('close', function(){
	    logger.info('Realtime Client disconnected');
		rtClient.destroy();
		rtClient = null;
	});

    client.on('data', function(data) {
    	logger.debug("RT > " + data);
    	
        // translate message from WebClient to ITS format
        var obj = JSON.parse(data.toString());
        var ordData = obj.ordData;
        var action = obj.action.toLowerCase();
        var itscmd = [ 'ORD', action ];

        switch(action) {
            case 'add':
                itscmd.push(0);
                itscmd.push(ordData.symbol);
                itscmd.push(4);
                itscmd.push(ordData.qty);
                itscmd.push(3);
                itscmd.push(ordData.price);
                itscmd.push(11);
                itscmd.push(ordData.bs);
                itscmd.push(40);
                itscmd.push(ordData.ordtype);
                itscmd.push(10);
                itscmd.push(ordData.account);
                itscmd.push(74);
                itscmd.push(ordData.Ref);
                break;
            case 'change':
                itscmd.push(4);
                itscmd.push(ordData.qty);
                itscmd.push(3);
                itscmd.push(ordData.price);
                itscmd.push(6);
                itscmd.push(ordData.ID);
                itscmd.push(74);
                itscmd.push(ordData.Ref);
                break;
            case 'cancel':
                itscmd.push(6);
                itscmd.push(ordData.ID);
                itscmd.push(74);
                itscmd.push(ordData.Ref);
                break;
        }

        var itsmsg = itscmd.join('|') + '|191|' + val191+ '|510|' + val510 + '|\n\r';
        logger.debug('>ITS ' + itsmsg);
        itsClient.write(itsmsg);
    });
});

mnServer.listen(cfg.MNC.port, cfg.MNC.addr);
stServer.listen(cfg.STC.port, cfg.STC.addr);
rtServer.listen(cfg.RTS.port, cfg.RTS.addr);

// --------------------- client for ITS connecting --------------------------------------
itsClient = net.connect(cfg.ITS.port, cfg.ITS.addr, function() {
	logger.info('router has connected to ITS.');
});

itsClient.on('data', function(data) {
	logger.debug('ITS > ' + data);

	Object.keys(monitorMap).forEach(function(key){
		var monitor = monitorMap[key];
		if (monitor) {
			monitor.write(data);
		}
	});

    if (stClient) {
        var arr = data.toString().split('|');
        if (arr[0] == 'session') {
            for (var i = 1, len = arr.length; i < len; i++) {
                if (i % 2 == 1) {
                    var tag = arr[i];

                    switch (tag) {
                        case '191':  val191 = arr[i+1]; break;
                    }
                }
            }
            logger.info('val191 is ' + val191); 
        }    
        stClient.write(data);
    }

    if (rtClient) {
        // translate Order Acknowledge message from ITS format to JSON string
        var arr = data.toString().split('|');
        
        if (arr[0] == 'image' && arr[1].indexOf('ORDA_') > -1) {
            var obj = {};

            for (var i = 2, len = arr.length; i < len; i++) {
                if (i % 2 == 0) {
                    var tag = arr[i];

                    switch (tag) {
                        case '0':  obj.symbol = arr[i+1]; break;
                        case '4':  obj.qty = arr[i+1]; break;
                        case '3':  obj.price = arr[i+1]; break;
                        case '11': obj.bs = arr[i+1]; break;
                        case '40': obj.ordtype = arr[i+1]; break;
                        case '5':  obj.status = arr[i+1]; break;
                        case '34': obj.filled = arr[i+1]; break;
                        case '10': obj.account = arr[i+1]; break;
                        case '6':  obj.ID = arr[i+1]; break;
                        case '74': obj.Ref = arr[i+1]; break;
                        case '33': obj.Time = arr[i+1]; break;
                        case '25': obj.remark = arr[i+1]; break;
                    }
                }
            }
            rtClient.write(JSON.stringify(obj));
        }
    }
});

itsClient.on('close', function(){
    logger.info("disconnected with ITS");
});

// --------------------------------------------------
process.on('uncaughtException', function(err) {
	logger.error("[Error] " + err.stack);
});
