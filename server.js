/* ----------------------- Dependences ------------------------ */
var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    socketio = require('socket.io'),
    CE =  require('./controllers/node_modules/CentralEvent'),
    logger = require('./lib/logging').getLogger("server");

/* ----------------------- Config server ------------------------ */
var appcfg = require('./config/realtime_server_config').configs;
var app = express.createServer();
var io = socketio.listen(app);

app.configure(function(){
    app.use(express.logger({ format: ':method :url :status' }));
    app.use(express.errorHandler({ dump: true, stack: true }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'keyboard cat' }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
});

/* ------------------ Load models & controllers ----------------- */
(function(folder, fn){
    fs.readdir(__dirname + folder, function(err, files){
        if (err) throw err; else files.forEach(function(file){
            if (path.extname(file) == ".js") fn(file);
        });
    });
    return arguments.callee;
})('/controllers', function(n){
	require('./controllers/' + n).init(app, io, CE, logger);
});

/* ------------------------ Start server ----------------------- */
app.listen(process.env.PORT || appcfg.SERVER_PORT);
logger.info("Server listening on port " + app.address().port + " in " + app.settings.env + " mode");
