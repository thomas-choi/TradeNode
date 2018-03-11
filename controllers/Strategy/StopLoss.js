// JScript source code
// Stop Loss strategy
var util = require('util');
var SM = require('SubMgr');
var PF = require('TickData');
var EM = require('ExecMgr');
var ORD = require('Order');
var MS = require('MktStatus');
var Port = require('Portfolio');
var SData = require('SysData').newStratData();
var CE = null;
var myLog = null;

function  StrategyParm() {
    this.sName = 'StopLoss';
    this.symbol = 'HSIG2';
    this.qty = 1;
    this.stopGain = 10;
    this.stopLoss = -3;
    this.count = 1;
    this.interval = 300;          // // 300 seconds 
    this.account = 'E10019';   // default trading account 
    this.exch = '';
    this.assign = function (p) {
        this.sName =  p.sName;
        this.symbol = p.symbol;
        this.qty = p.qty;
        this.stopGain = p.stopGain;
        this.stopLoss = p.stopLoss;
        this.count = p.count;
        this.interval = p.interval;
        this.account = p.account;
        this.exch = p.exch;
    }  
}

var  DefaultStrategyParm = new StrategyParm();
var  currParm = new StrategyParm();

var   Mark = {
    started : 0,
    high : 0.0,
    openCost : 0.0, 
    openPos : true,
    inited: false,
    prevPrice: null,
    mktstatus : null, 
    direction: 0       // >0 is up; <0 is down 
};

var curChart = {
    sName : '',
    chartName : '',
    xtime : 0,
    yvalue : 0.0,
    note : ''
};  

function PriceEvent(Price) {
    curChart.sName = currParm.sName;
    curChart.chartName = Price.symbol;
    curChart.xtime = Price.time;
    curChart.yvalue = Price.last;
    curChart.note = '';
    
    if (!Mark.inited) {
        myLog.info('First Tick:'+util.inspect(Price));
        Mark.inited = true;
        Mark.high = Price.last;
        Mark.prevPrice = new PF.TickData();
        Mark.prevPrice.Assign(Price);
        myLog.info('First prevPrice: ' + util.inspect(Mark.prevPrice));
        CE.emit('chart', curChart);
    } else {   
        var   cTime = Price.time;
        var   pTime = Mark.prevPrice.time;
        var   tdiff = (cTime - pTime) ;  
     
        if (tdiff > currParm.interval) {
            Mark.direction = Price.last - Mark.prevPrice.last;
            myLog.info('Time interval up : '+util.inspect(Mark) + '  curTime= ' + cTime + ' pTime=' + pTime + ' tdiff = ' + tdiff + '  currParm.interval = ' + currParm.interval); 
            if (Mark.openPos) 
                genOpenOrder(Price);
            else 
                genCloseOrder(Price);           
       
            Mark.prevPrice.Assign(Price);
     	    CE.emit('strategy', SData, currParm);	   
            CE.emit('chart', curChart);
        }
    }
}

function genCloseOrder(Px) {
    var   pt = Port.getPortfolio(currParm.account);
    if (!pt) {
        myLog.info('Close: account port not found for '+currparm.account);   
        return;
    }  
    var   pos = pt.getPosition(currParm.symbol);
    if (!pos) {
        myLog.info('Close: position not found for '+currParm.symbol);
        return; 
    }
    var    bs;
    if (pos.cost > 0)
        bs =  ORD.BS.BUY;
    else
        bs =  ORD.BS.SELL;
    pt.adjustPrice(Px.symbol, Px.last, bs);
    SData.realizedPnL = pos.tPnL;
    SData.floatPnL = pos.uPnL;   
    
   myLog.log('Closing P & L = ' + pos.uPnL + ' Price=' + util.inspect(Px)); 
   if ((pos.uPnL <  currParm.stopLoss) || (pos.uPnL > currParm.stopGain)) {
        var order = ORD.create();
        order.symbol = currParm.symbol;
        order.qty = Math.abs(pos.qty);
        order.price = Px.last;
        order.account = currParm.account;
        order.bs = bs;
        order.Ref = currParm.sName+':C'+ ':'+pos.uPnL;
        curChart.note = 'C:'+pos.uPnL;
        myLog.info('DIR='+Mark.direction+' Closing Order = ' + order.toString()+' Pos=' + util.inspect(pos)+' Price=' + util.inspect(Px)); 
        EM.submit(order);
        Mark.openPos = true;
   } 
}

function genOpenOrder(Px) {
    var dir = '';
    if (Mark.started > 0) {
        Mark.started -= 1;
        return;
    }  
    var order = ORD.create();
    order.symbol = currParm.symbol;
    order.qty = currParm.qty;
    order.price = Px.last;
    order.account = currParm.account;
    if (Mark.direction > 0) {
        order.bs = ORD.BS.BUY;
        dir = 'UP';
    } else {
        order.bs = ORD.BS.SELL; 
        dir = 'DN';
    }
    order.Ref = currParm.sName + ':O';        
    curChart.note = 'O:'+dir;
    Mark.openCost = order.price * order.bs;
    myLog.info('DIR='+Mark.direction+' Open Order: '+ order.toString()+' @ Px='+util.inspect(Px)); 
    EM.submit(order);
    Mark.openPos = false;
}

function init(CEvent, logger) {
    SData.sName = 'StopLoss';
    SData.status = 'stop';
    SData.realizedPnL = 0.0;
    SData.floatPnL = 0.0;   
    CE = CEvent; 
    myLog = logger;
    myLog.info('Strategy is inited: '+ util.inspect(SData));
};

function start() {
    myLog.info('Strategy is started. ' + util.inspect(currParm));
    SData.status = 'start';  
    SM.on(currParm.symbol, PriceEvent);
    Mark.started = currParm.count;
    Mark.high = 0.0;  
    Mark.mktstatus = MS.getMktStatus(currParm.exch);
}

function stop() {
    SData.status = 'stop';
 //   SM.removeListener(currParm.symbol, PriceEvent);
}

function fclose() {
}

module.exports.init = init;
module.exports.start = start;
module.exports.stop = stop;
module.exports.pause = stop;
module.exports.resume = start;
module.exports.fclose = fclose;
module.exports.data = SData;
module.exports.parm = currParm;
