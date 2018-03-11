The controllers folder has the main controllers
1) ClientMgr.js : interface with Web-Client and configure the HTTP server
2) StratMgr.js  : Strategy Manager that can load strategy module from "Strategy" folder
3) ServicesMgr.js : Manager startup the important services of the system: 
                    TradeEngine, SubscribeMgr, PositionMgr, ExecutionMgr
