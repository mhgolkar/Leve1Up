
// Leve1Up
// client - communications . js

const sendJson = function ( obj, callback ){
	obj._leve1UpConnection_ = used_connection;
	let json_string = JSON.stringify( obj );
	httpRequest = new XMLHttpRequest();
	if (callback && typeof callback === 'function'){
		httpRequest.onreadystatechange = callback.bind(null, obj, httpRequest);
	} else { // dispatch result to main communication handler
		httpRequest.onreadystatechange = communicationHandler.bind(null, obj, httpRequest);
	}
	httpRequest.open('POST', SERVER_DB_GATEWAY);
	httpRequest.setRequestHeader('Cache-Control','no-cache');
	httpRequest.setRequestHeader('Content-Type', 'application/json'); // our server gate only accepts applcation/json
	httpRequest.send(json_string);
	if (CONFIGS.VERBOSE) console.log('Request: ', obj);
};

const getConnectionSettings = function (){
	if ( connection_local.value.length > 0 || connection_url.value.length > 0 ){
		saveLocalStorage();
		let is_local = (connection_local.value.length > 0);
		let settings = {
			name: ( is_local ? connection_local.value : connection_url.value ),
			auth: {
				username: (connection_user.value.length > 0 ? connection_user.value: undefined),
				password: (connection_pass.value.length > 0 ? connection_pass.value: undefined)
			},
			adapter: (is_local === true ? 'leveldb' : 'http'),
			auto_compaction: CONFIGS.DB_AUTO_COMPACTION, // if true means compact() is called after every change to the database
			revs_limit: CONFIGS.DB_REV_LIMIT, // how many old revisions we keep track of
			skip_setup: ( ! connecttion_auto_setup.checked ), // won't automatically create a db if it doesn't exist
			deterministic_revs: CONFIGS.DB_DETERMINISTIC_REVS // Use a md5 hash to create a deterministic revision number for documents otherwise would be a random number // NOTE IMPORTANT using hash we can compare the server and client copies of document to be identical
		};
		return settings;
	} else {
		return false;
	}
};

const connectDB = function(manual_connection){
	used_connection = ((manual_connection && typeof manual_connection === 'object' && manual_connection.hasOwnProperty('name')) ? manual_connection : getConnectionSettings());
	if ( used_connection != false ){
		if (CONFIGS.VERBOSE) console.dir('Connecting to DB: ', used_connection);
		attr(connection_page, 'data-active', 'false');
		attr(connection_spinner, 'data-active', 'true');
		sendJson({ action: 'connect', arguments: used_connection }, false);
	} else {
		saveLocalStorage('reset');
		notifyUser('warn', 'Invalid Database Settings!', 'We need atleast one local or network path to connect to!', 'Return', false);
	}
	return false;
};

const handleConnectionResult = function(response){
	if ('doc_count' in response){
		indicate('Reading Out DB Info ...');
		let report = '';
		try {
			let db_name_parts = response.db_name.split('/');
			if( db_name_parts.length > 0 ){
				do {
					db_name = db_name_parts.pop();
				} while ( ((!db_name) || db_name.length == 0) && db_name_parts.length > 0 );
				if ((!db_name) || db_name.length == 0) db_name = 'unknown';
			}
		} catch (err){}
		for (let variable in response) {
			if ( response.hasOwnProperty(variable) ) {
				report += `${CONFIGS.EOL}${variable} :  ${(variable !== 'db_name' ? response[variable] : db_name )}`;
			}
		}
		let total_docs_count = parseInt(response.doc_count);
		if ( total_docs_count > 0 ){ // there is some docs to query so query all on first connection
			let loadlimit = CONFIGS.MAX_SIZE_OF_THE_FETCHED_DOCS_ID_LIST_ON_STARTUP;
			if( Number.isFinite(loadlimit) && loadlimit > 0 && total_docs_count > loadlimit  ){ // less than limit, get them all
				report += `${CONFIGS.EOL}--------${CONFIGS.EOL}Caution!${CONFIGS.EOL}First  ${CONFIGS.MAX_SIZE_OF_THE_FETCHED_DOCS_ID_LIST_ON_STARTUP}  Docs are getting listed. You can Query more Docs to be listed later. To avoid this limit, edit 'config.js' file.`;
				sendJson({ action: 'query_db', arguments: { "selector": {}, "limit": loadlimit } }, false);
			} else {
				sendJson({ action: 'list_all_docs', arguments: null }, false); // false callback means it's going to main communication handler
			}
			indicate('Fetching Docs List ...');
		} else {
			indicate(false, A_GLIMPSE_DELAY);
		}
		updateUI(true);
		notifyUser('info', 'Connected.', report, 'Enter', false);
		attr(connection_page, 'data-active', 'false');
		attr(editor_page, 'data-active', 'true');
		attr(connection_spinner, 'data-active', 'false');
	} else if ('error' in response ){
		notifyUser('error', 'Unable to Connect!', `Got This Error From Server: ${CONFIGS.EOLTAB} ${response.error}`, 'OK!', function(){
			attr(connection_spinner, 'data-active', 'false');
			attr(connection_page, 'data-active', 'true');
		});
	} else {
		if (CONFIGS.DEBUG) console.error('Unexpected Response: ', response);
		notifyUser('error', 'Unexpected Response From Server!', UNEXPECTED_RESPONSE_MESSAGE, 'OK!', function(){
			attr(connection_spinner, 'data-active', 'false');
			attr(connection_page, 'data-active', 'true');
		});
	}
};

const closeConnection = function(){
	if (CONFIGS.VERBOSE) console.dir('Connection Closed.');
	attr(connection_spinner, 'data-active', 'true');
	sendJson({ action: 'close_db', arguments: null }, false);
};

const backToConnectionForm = function(){
	used_connection = null;
	refreshAll(false);
	attr(connection_spinner, 'data-active', 'false');
	attr(editor_page, 'data-active', 'false');
	attr(connection_page, 'data-active', 'true');
};

const communicationHandler = function(sent, com) {
	if ( com.readyState === 4 ){ // response ready to use
		let requested = sent.action;
		let response  = false;
		try { // communications with server must be in valid json so...
			response = ( com.response.length > 3 ? JSON.parse(com.response) : false );
		} catch (err) {
			response = 'error';
			if (CONFIGS.DEBUG) console.error('Erro Parsing Server Response! ', err);
		}
		if (CONFIGS.VERBOSE) console.log(`Response to '${requested}' : `, response);
		if ( (!response) || response === 'error'){
			notifyUser('error', 'Unexpected Response From Server!', UNEXPECTED_RESPONSE_MESSAGE);
			indicate('Error!', A_GLIMPSE_DELAY);
		} else if ( response.hasOwnProperty('error') && (Object.keys(response)).length === 1 ){
			notifyUser('error', 'Server Error!', response.error);
			indicate('Error!', A_GLIMPSE_DELAY);
			switch (requested) { // and special action on specified errors?
				case 'connect':
					backToConnectionForm();
					break;
				case 'query_db':
					showQueryResult( false ); // close query lock
					break;
			}
		} else {
			switch (requested) {
				case 'connect':
					handleConnectionResult(response);
					break;
				case 'list_all_docs':
					listUpAllDocsList(response.rows, true, false, false);
					break;
				case 'save_doc':
					listUpDoc(response, ((open_doc && open_doc._id === response._id) || is_new_doc_or_empty), true, (!docs_queried.includes(response._id)) );
					indicate(`Doc '${response._id}' Saved.`);
					break;
				case 'fetch_doc':
					openFetchedDoc(response);
					break;
				case 'delete_doc':
					listDownDoc( response , true, true );
					break;
				case 'compact_db':
					indicate('DB Compacted.');
					openDocToEdit(false);
					break;
				case 'close_db':
					backToConnectionForm();
					break;
				case 'query_db':
					showQueryResult( response );
					break;
			}
		}
	}
};
