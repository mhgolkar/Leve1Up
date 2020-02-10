
// Leve1Up
// client - ui . js

// General UI Helpers

const x = function (){
	if( typeof arguments[0] == "string"){
		let q = document.querySelectorAll( arguments[0] );
		let x = ( q.length > 1 ) ? q : ( q[0] || document.getElementById( arguments[0] ) );
		if( arguments[1] !== undefined ) x.innerHTML = arguments[1];
		return x;
	} else return undefined;
};

const attr = function (element, attribute, replacement) {
	let el = (typeof element == "string") ? x(element) : element;
	if( el instanceof Element ) {
		try {
			if( replacement ){
				if( replacement === 'reverse' ){
					let reversed_flag = ( el.getAttribute(attribute) == "false" ) ? "true" : "false";
					el.setAttribute(attribute, reversed_flag);
				} else {
					el.setAttribute(attribute, replacement);
				}
			} else {
				return el.getAttribute(attribute);
			}
		} catch(e){
			console.warn("Bad attr() Call: ", e, element, attribute);
			return null;
		}
	} else return false;
};

const removeFromArray = function(item, array){
	if( Array.isArray(array) ){
		let indexOfRemovee = array.indexOf(item);
		if( indexOfRemovee > -1 ){
			array.splice(indexOfRemovee, 1);
			return indexOfRemovee;
		}
	} else {
		if(CONFIGS.DEV_MODE) console.error('removeFromArray is called without a valid array!');
		return false;
	}
};

const updateUI = function(all){
	docs_stats_print.innerText = `${docs_shown.length} of ${docs_queried.length} / ${docs_all_list.length}`;
	attr( docs_list_element, 'data-shown-count', docs_shown.length.toString() );
	if (all){
		db_name_print.innerText = db_name;
		if ( !open_doc ) openDocToEdit(false);
	}
};

var notification_confirmative_action;
var notification_dismissal_action;

const notifyUser = function (type, title, message, button, confirmative_callback, dismissal_callback){
	type = type.toLowerCase();
	type = (POSSIBLE_NOTIFICATION_TYPES.includes( type ) ? type : 'info' );
	attr(notification, 'data-type', type);
	notification_title.innerText = (typeof title === 'string' && title.length > 0 ? title : 'Unknown Problem!');
	notification_message.innerText = (typeof message === 'string' && message.length > 0 ? message : "We Don't Know What Exactly Went Wrong.");
	notification_confirm_button.innerText = (typeof button === 'string' && button.length > 0 ? button : 'OK');
	notification_confirmative_action = (typeof confirmative_callback === 'function' ? confirmative_callback : false);
	notification_dismissal_action = (typeof dismissal_callback === 'function' ? dismissal_callback : false);
	setTimeout(function(){
		attr(notification, 'data-active', 'true');
	}, SHORT_DELAY);
	if (CONFIGS.VERBOSE) console[ (type in console ? type : 'info') ](`${type}: `, title, CONFIGS.EOLTAB, message);
};

const closeNotificationWithAction = function (confirm){
	if ( confirm === true && notification_confirmative_action ){
		notification_confirmative_action();
	} else if (notification_dismissal_action){
		notification_dismissal_action();
	}
	attr(notification, 'data-active', 'false');
};

var indicator_timeout;

const indicate = function(message, extra_delay){
	if ( indicator_timeout ) clearTimeout(indicator_timeout);
	if (message !== false) {
		indicator.innerText = (typeof message === 'string' ? message : 'Processing ...');
		attr(indicator, 'data-active', 'true');
		indicator_timeout = setTimeout(()=>{
			indicator_timeout = false;
			attr(indicator, 'data-active', 'false');
		}, CONFIGS.INDICATION_POPUP_DURATION + ( extra_delay || 0) );
	} else { // promptly off it
		setTimeout(()=>{
			attr(indicator, 'data-active', 'false');
		}, (extra_delay || SHORT_DELAY));
	}
};

const saveLocalStorage = function(reset){
	if( reset === 'reset' ){
		connection_local.value = connection_url.value = connection_user.value = '';
	}
	if ( 'localStorage' in window ){
			window.localStorage._leve1Up_ = 'true';
			window.localStorage._leve1Up_connection_setting_local = connection_local.value;
			window.localStorage._leve1Up_connection_setting_network = connection_url.value;
			window.localStorage._leve1Up_connection_setting_user = connection_user.value;
	}
};

const reloadLocalStorage = function(){
	if ( ('localStorage' in window) && ('_leve1Up_' in window.localStorage) ){
			connection_local.value = window.localStorage._leve1Up_connection_setting_local;
			connection_url.value = window.localStorage._leve1Up_connection_setting_network;
			connection_user.value = window.localStorage._leve1Up_connection_setting_user;
	}
};
