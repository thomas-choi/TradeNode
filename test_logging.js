var log = require('./lib/logging').getLogger("server");
// var clog = require('./lib/logging').getLogger("SVR");

log.debug("this is for debug...");
log.info("hello,world");
log.warn("this is a warning message...");
log.error("error occured!!!");
/*
clog.debug("SVR this is for debug!!");
clog.info("SVR hello,world!!");
clog.warn("SVR this is a warning message!!");
clog.error("SVR error occured!!!");
*/