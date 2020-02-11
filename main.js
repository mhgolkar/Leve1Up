/*
		Leve1Up
		-----------
		LevelDB/CouchDB GUI
		v1.0.0 [2020]
		-----------
		Morteza H. Golkar 1988.7.25
*/


// Configs
const ROOT = __dirname;
const LEVE1UP_APP_DIR = `${ROOT}/`;
const {
	HTTP_SERVER_HOST, HTTP_SERVER_PORT, HTTP_SERVER_TIMEOUT, MAX_HTTP_BODY_SIZE,
	REQUEST_URL_PATH_TO_TURN_SERVER_SIDE_OFF,
	DEBUG, VERBOSE, POUCH_DB_DEBUG, DISABLE_X_POWERED_BY,
	CC, EOL
} = require(`${ROOT}/configs.js`);


// Saying Hi
console.log(CC.G, EOL, `
	██╗     ███████╗██╗   ██╗███████╗ ██╗██╗   ██╗██████╗
	██║     ██╔════╝██║   ██║██╔════╝███║██║   ██║██╔══██╗
	██║     █████╗  ██║   ██║█████╗  ╚██║██║   ██║██████╔╝
	██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝   ██║██║   ██║██╔═══╝
	███████╗███████╗ ╚████╔╝ ███████╗ ██║╚██████╔╝██║
	╚══════╝╚══════╝  ╚═══╝  ╚══════╝ ╚═╝ ╚═════╝ ╚═╝
`, CC.Reset);


// Modules
const http = require('http');
const express = require('express');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser'); // to handle json request body as express middleware
const cors = require('cors'); // to enable cross origin requests from the app
const database = require(`${ROOT}/scripts/server-database.js`);


// Database Handling
var DB;

const connectDB = async function (connection_settings){
	if ( DB ) await DB.closeDB();
	DB = new database({ debug: DEBUG, verbose: VERBOSE, pouchDB_debug: POUCH_DB_DEBUG });
	return DB.connectDB(connection_settings);
};

const databaseJobs = async function(req, res){
	let request = req.body;
	let args = request.arguments;
	let act = request.action;
	let result, error_ = false;
	if ( request.hasOwnProperty('_leve1UpConnection_') ){
		if ( !DB ) await connectDB(request._leve1UpConnection_);
		delete request._leve1UpConnection_;
	}
	if (VERBOSE) console.log(CC.C, '▲ Request: ', CC.Reset, EOL, request, EOL);
	try {
		switch (act) {
			case 'connect':
				result = await connectDB(args);
				break;
			case 'list_all_docs':
				result = await DB.allDocsList(args);
				break;
			case 'save_doc':
				result = await DB.saveDoc(args);
				break;
			case 'fetch_doc':
				result = await DB.getDocAndRevsAll(args);
				break;
			case 'delete_doc':
				result = await DB.deleteDoc(args);
				break;
			case 'compact_db':
				result = await DB.compactDB();
				break;
			case 'close_db':
				result = await DB.closeDB();
				break;
			case 'query_db':
				result = await DB.queryDB(args);
				break;
			case 'xyz':
				break;
		}
	} catch(err) {
		error_ = err.message;
		if (VERBOSE) console.log('Error Happened! ', err);
	}
	if ( (!error_) && result){
		if (VERBOSE) console.log(CC.G, '▼ Response: ', CC.Reset, EOL, result, EOL);
		res.status(200).json(result);
	} else {
		res.status(400).json({ error: error_ || 'Unknow Error' });
	}
};

const terminateApp = async function(req, res){
	console.log( CC.M, 'Safely Closing Leve1Up [due to turn-off request...]', CC.Reset, EOL );
	res.status(200).json({ off: true });
	setImmediate(()=>{
		process.exit(0);
	});
};
process.on('exit', function (){
	console.log(CC.Y, 'See You ...', CC.Reset, EOL);
});


// ExpressJs Server
const EXPRESS_APP = express();

// enable CORS
// more info: http://expressjs.com/en/resources/middleware/cors.html
EXPRESS_APP.options( '*', cors({
	origin: '*',
	methods: ['POST', 'GET'],
	allowedHeaders: ['Content-Type', 'Cache-Control'],
	preflightContinue: false,
}));

// ExpressJs middlewares
// 1. parse application/json
EXPRESS_APP.use( bodyParser.json({ // using a built-in middleware function in Express which parses incoming requests with JSON payloads.
	// A new body object containing the parsed data is populated on the request object after the middleware (i.e. req.body), or an empty object ({}) if there was no body to parse, the Content-Type was not matched, or an error occurred.
	inflate: false, // Enables or disables handling deflated (compressed), It's an Expensive Operation -> disabled: will reject compressed requests.
	limit: MAX_HTTP_BODY_SIZE, // Controls the maximum request body size
	strict: true, // Enables or disables only accepting arrays and objects; when disabled will accept anything JSON.parse accepts.
	type: 'application/json' // This is used to determine what media type the middleware will parse
}));
// 2. beautification!?
if ( DISABLE_X_POWERED_BY ) EXPRESS_APP.disable('x-powered-by');
// 3. serve leve1Up app
EXPRESS_APP.use('/', serveStatic( LEVE1UP_APP_DIR, {
	'index': ['index.html', 'index.htm', 'main.html', 'main.htm']
}));

// and finally manage db job requests
EXPRESS_APP.all('/db', databaseJobs);
// and turn off path
if( typeof REQUEST_URL_PATH_TO_TURN_SERVER_SIDE_OFF === 'string' &&  REQUEST_URL_PATH_TO_TURN_SERVER_SIDE_OFF.length > 0 ){
	EXPRESS_APP.all(REQUEST_URL_PATH_TO_TURN_SERVER_SIDE_OFF, terminateApp);
}

const httpServer = http.createServer({}, EXPRESS_APP);

httpServer.listen( HTTP_SERVER_PORT, HTTP_SERVER_HOST, () => {
	console.log(CC.C, `Leve1Up's up and running: http://${HTTP_SERVER_HOST}:${HTTP_SERVER_PORT}`, CC.Reset);
	if ( DEBUG ){ // if debug or no-ssl (probably local server) prints the interface we're running on
		let os = require('os');
		let ifaces = os.networkInterfaces();
		Object.keys(ifaces).forEach(function (ifname) {
			let alias = 0;
			ifaces[ifname].forEach(function (iface) {
				if ('IPv4' !== iface.family || iface.internal !== false) {
					// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
					return;
				}
				console.log(CC.Y, `[ ${ifname}${ alias > 0 ? `:${alias}` : '' } ${iface.address} ]`, CC.Reset);
				alias++;
			});
		});
	}
	console.log(EOL);
});

httpServer.on('error', (err) => {
	console.log('Server Error!!', err);
});

httpServer.timeout = HTTP_SERVER_TIMEOUT;
