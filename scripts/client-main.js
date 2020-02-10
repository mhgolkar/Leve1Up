
// Leve1Up
// client - main . js


const CLICK = 'click';
const CONFIGS = configurations;
const SHORT_DELAY = 25;
const LESS_SHORT_DELAY = 150;
const A_GLIMPSE_DELAY = 500;
const SHORT_READ_DELAY = 1500;
const SERVER_DB_GATEWAY = `http://${ CONFIGS.HTTP_SERVER_HOST.replace('http://', '') }:${CONFIGS.HTTP_SERVER_PORT}/db/`;
const POSSIBLE_NOTIFICATION_TYPES = ['error', 'warn', 'info', 'confirm']; // NOTE: same as console[type]
const UNEXPECTED_RESPONSE_MESSAGE = 'Please Check That Your Server is Up and Running. Check your dev console for more detailed logs if intrested.';
const STRINGIFYING_BASE_FOR_RANDOM_DOC_NAME = ( CONFIGS.RANDOM_NUMBER_STRINGIFYING_BASE <= 36 ? CONFIGS.RANDOM_NUMBER_STRINGIFYING_BASE : 36 );
const STRINGIFIED_NEW_DOC_TEMPLATE = JSON.stringify( CONFIGS.NEW_DOC_TEMPLATE, null, CONFIGS.JSON_PRETTY_PRINT_SPACING);

var root;
var notification, notification_title, notification_message, notification_confirm_button, notification_dismiss_button;
var connection_page, connection_local, connection_url, connection_user, connection_pass, connecttion_auto_setup, connection_open;
var connection_spinner;
var editor_page, db_name_print, docs_list_element, docs_stats_print, editor_lock, editor_element, editor, tags_input, indicator;
var rev_man_rotator, rev_man_oldest, rev_man_previous, rev_man_view, rev_man_next, rev_man_latest;
var query_input_page, query_input_text_editor, filter_input, quer_input_operatior_select, query_input_field_input, query_input_match_input, query_input_limit_input, query_input_skip_input, query_locker;

var used_connection = false;
var db_name = 'unknown';
var docs_all_list = [];
var docs_queried  = [];
var docs_shown = [];
var open_doc = null;
var open_doc_revs = [];
var open_doc_revs_by_rev_number = {};
var open_doc_winner_rev = null;
var open_rev = null;
var is_new_doc_or_empty = false; // TODO: to test for id duplication

var state_of_query_input = {
	selectors: [],
	match_mode: '$and', // default, may be updated from html on document load
	limit: 0,
	skip: 0
};


// Load !
// ...
document.addEventListener("DOMContentLoaded", function() {

	// root element
	root = document.getRootNode().documentElement;

	// Notification
	notification = x('#notification');
	notification_title = x('#notification-title');
	notification_message = x('#notification-message');
	notification_confirm_button  = x('#notification-confirm');
	notification_dismiss_button  = x('#notification-dismiss');
	// notification action
	notification_confirm_button.addEventListener(CLICK, function(){ closeNotificationWithAction(true); });
	notification_dismiss_button.addEventListener(CLICK, function(){ closeNotificationWithAction(false); });

	// Connection Page
	connection_page  = x('#connection-page');
	connection_local = x('#connection-local-path');
	connection_url   = x('#connection-network-url');
	connection_user  = x('#connection-username');
	connection_pass  = x('#connection-password');
	connection_open  = x('#open-connection-button');
	connecttion_auto_setup = x('#create-db-on-open');
	// and spinner
	connection_spinner = x('#connection-spinner');
	// only one input for connection, local or network
	connection_url.addEventListener('input', function(){ connection_local.value = ''; });
	connection_local.addEventListener('input', function(){ connection_url.value = ''; });
	// open action
	connection_open.addEventListener(CLICK, connectDB);


	// Editor Page
	editor_page = x('#db-editor');
	// code editor
	editor_lock = x('#code-editor-lock');
	editor_element = x('#code-editor');
	editor = ace.edit(editor_element, CONFIGS.ACE_CODE_EDITOR_DEFAUL);
	editor.setFontSize(CONFIGS.DOCUMENT_TEXT_EDITOR_FONT_SIZE);
	// elements
	db_name_print = x('#db-name');
	docs_list_element = x('#docs-list');
	docs_stats_print = x('#docs-stats');
		// revision manager
	rev_man_rotator = x('#revision-rotator');
	rev_man_oldest = x('#rev-action-oldest');
	rev_man_previous = x('#rev-action-previous');
	rev_man_view = x('#rev-current-view');
	rev_man_next = x('#rev-action-next');
	rev_man_latest = x('#rev-action-latest');
	indicator = x('#processing-indicator');
	// actions
	x('#action-compact-db').addEventListener(CLICK, compactionAction);
	x('#action-refresh-db').addEventListener(CLICK, refreshAll);
	x('#action-close-db').addEventListener(CLICK, closeConnection);
	x('#action-new-doc').addEventListener(CLICK, newDoc);
	x('#action-save-doc').addEventListener(CLICK, saveDoc);
	x('#action-delete-doc').addEventListener(CLICK, deleteDoc);
	docs_list_element.addEventListener(CLICK, (ev)=>{
		let selected_doc_id = ev.srcElement.innerText;
		if ( selected_doc_id && selected_doc_id.length > 0 && docs_all_list.includes(selected_doc_id) ){
			openDocToEdit(selected_doc_id);
		}
	});
	rev_man_oldest.addEventListener(CLICK, ()=>{ rotateRevision('oldest'); });
	rev_man_previous.addEventListener(CLICK, ()=>{ rotateRevision('previous'); });
	rev_man_next.addEventListener(CLICK, ()=>{ rotateRevision('next'); });
	rev_man_latest.addEventListener(CLICK, ()=>{ rotateRevision('latest'); });

	// filter
	filter_input = x('#docs-list-filter');
	let filter_refresh_rate_timeout;
	filter_input.value = ''; // make sure it's blank on page reload
	filter_input.addEventListener('input', ()=>{
		if( filter_refresh_rate_timeout ) clearTimeout(filter_refresh_rate_timeout);
		filter_refresh_rate_timeout = setTimeout(filterDocList, CONFIGS.FILTERING_REFRESH_RATE);
	});

	// query input
	tags_input_element = x('input#query-selector-criteria-array[type="tags"]');
	query_locker = x('#query-locker');
	query_input_page = x('#query-input-editor-subpage');
	x('#action-query-db').addEventListener(CLICK, function(){ attr(query_input_page, 'data-active', 'true'); });
	x('#action-refresh-list').addEventListener(CLICK, refreshListView);
	x('#query-back').addEventListener(CLICK, function(){ attr(query_input_page, 'data-active', 'false'); });
	tags_input = tagsInput(tags_input_element);
	query_input_text_editor = ace.edit( x('#query-selector-manual-editor'), CONFIGS.ACE_CODE_EDITOR_DEFAUL);
	query_input_field_input = x('#query-selector-field');
	query_input_match_input = x('#query-selector-match');
	query_input_limit_input = x('#query-selector-limit');
	query_input_skip_input = x('#query-selector-skip');
	quer_input_operatior_select = x('#query-selector-operator');
	quer_input_operatior_select.addEventListener('change', updateQueryInput);
	QUERY_OPERATOR_TO_CRITERIA_RELATIONS = {
		'$lt'     : { input: x('#query-selector-criteria-textual'),     type: 'text-or-number', operator: '$lt' },
		'$gt'     : { input: x('#query-selector-criteria-textual'),     type: 'text-or-number', operator: '$gt' },
		'$lte'    : { input: x('#query-selector-criteria-textual'),     type: 'text-or-number', operator: '$lte' },
		'$gte'    : { input: x('#query-selector-criteria-textual'),     type: 'text-or-number', operator: '$gte' },
		'$eq'     : { input: x('#query-selector-criteria-textual'),     type: 'text-or-number', operator: '$eq' },
		'$ne'     : { input: x('#query-selector-criteria-textual'),     type: 'text-or-number', operator: '$ne' },
		'$exists' : { input: x('#query-selector-criteria-for-exists'),  type: 'boolean', operator: '$exists' },
		'$type'   : { input: x('#query-selector-criteria-for-type'),    type: 'select-lowercase', operator: '$type' },
		'$in'     : { input: x('#query-selector-criteria-array'),       type: 'list', operator: '$in' },
		'$nin'    : { input: x('#query-selector-criteria-array'),       type: 'list', operator: '$nin' },
		'$all'    : { input: x('#query-selector-criteria-array'),       type: 'list', operator: '$all' },
		'$size'   : { input: x('#query-selector-criteria-numeral'),     type: 'integer', operator: '$size' },
		'$regex'  : { input: x('#query-selector-criteria-textual'),     type: 'regexp', operator: '$regex' },
		// '$mod' : '',
		// '$elemMatch' : '',
	};
	x('#query-selector-add-new').addEventListener(CLICK, addNewSelectorToQuery);
	query_input_match_input.addEventListener('input', function(){
		state_of_query_input.match_mode = query_input_match_input.value.toLowerCase();
		stringifyQueryToManualEditor();
	});
	query_input_limit_input.addEventListener('input', function(){
		let integer = parseInt(query_input_limit_input.value);
				if ( Number.isInteger(integer) != true ) integer = 0;
		state_of_query_input.limit = integer;
		query_input_limit_input.value = integer;
		stringifyQueryToManualEditor();
	});
	query_input_skip_input.addEventListener('input', function(){
		let integer = parseInt(query_input_skip_input.value);
				if ( Number.isInteger(integer) != true ) integer = 0;
		state_of_query_input.skip = integer;
		query_input_skip_input.value = integer;
		stringifyQueryToManualEditor();
	});
	x('#query-reset').addEventListener(CLICK, resetQueryInput);
	x('#query-proceed').addEventListener(CLICK, proceedQuery);
	// initialize query input
	updateQueryInput();
	resetQueryInput();
	state_of_query_input.match_mode = query_input_match_input.value.toLowerCase();
	query_input_text_editor.setFontSize(CONFIGS.QUERY_INPUT_TEXT_EDITOR_FONT_SIZE);

	// Startup
	reloadLocalStorage();
	if( !CONFIGS.DEV_MODE && 'clear' in console ) setTimeout( function(){
		console.clear();
	}, SHORT_READ_DELAY);

});
