
// Leve1Up
// configs .js
// Shared Configurations
// Used by both the server and client sides of Leve1Up

const configurations = {

	HTTP_SERVER_HOST: 'localhost',
	HTTP_SERVER_PORT: 1234,

	HTTP_SERVER_TIMEOUT: 60000, // milliseconds
	MAX_HTTP_BODY_SIZE: 64 * 1000 * 1000, // bytes (64MBs)

	DEV_MODE: false, // Developement Events will be loged
	DEBUG: false, // important events will be loged to console
	VERBOSE: false, // almost all events will be loged
	POUCH_DB_DEBUG: false, // even pouchdb logs will be loged (and a lot of them will be there.)

	DB_AUTO_COMPACTION: false, // This turns on auto compaction, which means pouchdb tries to compact db (remove older revisions) after every change
	DB_REV_LIMIT: 1000, // Specifies how many old revisions pouchdb keeps track (not a copy) of.
	DB_DETERMINISTIC_REVS: true, // Use a md5 hash to create a deterministic revision number for documents. Setting it to false will mean that the revision number will be a random UUID.

	// our database automatically gets first x docs (id only) on startup and lists them
	// more than this must be queried
	MAX_SIZE_OF_THE_FETCHED_DOCS_ID_LIST_ON_STARTUP: 256, // doc-titles
	// -1 or false means no limit

	// user can turn off server app by sending any GET request to this path:
	REQUEST_URL_PATH_TO_TURN_SERVER_SIDE_OFF: '/turn-off',
	// -> http://localhost:1234/turn-off
	// flase or blank string will disable this function

	ACE_CODE_EDITOR_DEFAUL: {
		mode: "ace/mode/json",
		theme: "ace/theme/vibrant_ink", // some more dark themes: ambiance, chaos, terminal, drakula, vibrant_ink
		selectionStyle: "line",
		highlightGutterLine: true,
		showInvisibles: true,
		highlightActiveLine: true,
		wrap: false,
		highlightSelectedWord: true,
		wrapBehavioursEnabled: true,
		autoScrollEditorIntoView: true,
		useSoftTabs: true,
		enableMultiselect: true,
		fontSize: "1.125rem",
		fontFamily: 'monospace',
		scrollPastEnd: true,
	},
	// overwrite ?
	DOCUMENT_TEXT_EDITOR_FONT_SIZE: '1.125rem',
	QUERY_INPUT_TEXT_EDITOR_FONT_SIZE: '0.75rem',

	INDICATION_POPUP_DURATION: 2500, // milliseconds

	NEW_DOC_TEMPLATE: {
		_id: "%random_id%"
	},
	NEW_DOC_RANDOMIZER_FACTOR: 1000000,
	RANDOM_NUMBER_STRINGIFYING_BASE: 36, // <= 36
	GET_CONFIRMATION_FOR_ID_ONLY_DOCS: true,

	JSON_PRETTY_PRINT_SPACING: '\t',
	JSON_PRETTY_PRINT_SPACING_FOR_QUERY_EDITOR: 2,


	APPEND_NEWLY_SAVED_DOC_TO_THE_TOP_OF_LIST: true,

	DELETE_DOCUMENT_BY_WINNER_REV: true,

	FILTERING_REFRESH_RATE: 500, // milliseconds after any change in the filter input, filtering function will be triggered

	CC: { // console.log collor factors
		Reset: "\x1b[0m",
		K: "\x1b[30m", G: "\x1b[32m", C: "\x1b[36m", Y: "\x1b[33m", R: "\x1b[31m", B: "\x1b[34m", M: "\x1b[35m",
		bC: "\x1b[46m", bG: "\x1b[42m", bR: "\x1b[41m", bY: "\x1b[43m", bB: "\x1b[44m"
	},

	DISABLE_X_POWERED_BY: false, // if true, removes x-powered-by from expressjs communications

	EOL: '\r\n',
	EOLTAB: '\r\n\t',

};

// modular for nodejs
try { // just to ditch error in browser
	module.exports = configurations;
} catch(err){}
