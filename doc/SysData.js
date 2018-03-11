// JScript File

BS = {
	UNDE : 0,
	BUY : -1,
	SELL : 1
}

STATUS = {
	UNDE : 0,
	PEND : 1,
	REJE : -1,
	COMP : 3,
	CANC : 4
}

TYPE = {
	LMT : 0,
	MKT : 1
}

function OrdData() {
	this.symbol = '';
	this.qty = 0.0;
	this.price = 0.0;
	this.bs = BS.UNDE;
	this.ordtype = TYPE.LMT;
	this.status = STATUS.UNDE;
	this.filled = 0.0;
	this.avgPx = 0.0;
	this.account = '';
	this.ID = '';
	this.ver = 1;
	this.Ref = '';
}

function PnLData() {
	this.account = '';
	this.TotalPnL = 0.0;
	this.TotalFloat = 0.0;
}

function ChartData() {
	this.sName = ''; 		// e.g. "Simulation 1"
	this.chartName = ''; 	// e.g. "chart-1" or "chart-2"
	this.xtime = ''; 		// e.g. 10:25:10 or 15:42:46
	this.yvalue = 0.0; 		// 2.5 or
}

function StratData() {
	this.sName = ''; 		// e.g. "Simulation 1"
	this.status = ''; 		// e.g. "running", "stopped", "paused"
	this.realizedPnL = 0.0;
	this.floatPnL = 0.0;
}

function CmdData() {
	this.sName = ''; 		// e.g. "Simulation 1"
	this.command = ''; 		// start, stop, pause, resume, fclose, trace
}

/*
 * An example of Simulation parameter data; The SimPram is used to allow uer
 * collect simulation parameter with default value. UI layout refer to the
 * "Simulation Param Popup" of screenlayout.xls
 */
function StrategyParm() {
	this.sName = 'StopLoss';
	this.symbol = 'HSIV1';
	this.qty = 1;
	this.count = 1;
	this.interval = 180; // 180 seconds
	this.account = 'E10019'; //
	this.exch = 'HKFE';
}
