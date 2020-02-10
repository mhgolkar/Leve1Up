
// Leve1Up
// client - query - input . js

var QUERY_OPERATOR_TO_CRITERIA_RELATIONS;
var current_state_of_query_input = {};

const updateQueryInput = function(){
	let operator = quer_input_operatior_select.selectedOptions[0].value;
	if (operator){
		let was_input = current_state_of_query_input.input || x('.query-selector-criteria[data-active="true"]');
		if( was_input ) attr(was_input, 'data-active', 'false');
		let will = QUERY_OPERATOR_TO_CRITERIA_RELATIONS[operator];
		attr(will.input, 'data-active', 'true');
		current_state_of_query_input = will;
	}
};

const getTagsOfInput = function(input_element){
	let holder = input_element.nextElementSibling;
	let tags_elements = holder.querySelectorAll('.tag');
	let tags_array = [];
	for (let i = 0; i < tags_elements.length; i++) {
		let item = tags_elements[i].innerText;
		if(item && item.length > 0){
			let numeral = parseFloat(item);
			if ( numeral && ( Number.isFinite(numeral) ) ){ // it is number only string
				item = numeral; // so get the number form back instead of string
			}
		}
		tags_array.push( item );
	}
	return tags_array;
};

const parseQueryInput = function(){
	let input = current_state_of_query_input.input;
	let value = undefined; /* jshint ignore : line */
	switch (current_state_of_query_input.type) {
		case 'text':
			value = ( input.value.length > 0 ? input.value : undefined );
			break;
		case 'text-or-number':
			value = ( input.value.length > 0 ? input.value : undefined );
			if(value && value.length > 0){
				let numeral = parseFloat(value);
				if ( numeral && ( Number.isFinite(numeral) ) ){ // it is number only string
					value = numeral; // so get it as number
				}
			} else {
				value = undefined;
			}
			break;
		case 'boolean':
			value = ( input.value.length > 0 ? input.value.toLowerCase() : undefined );
			if( value !== undefined ){
				if (value === true || value === 'true'){
					value = true;
				} else if (value === false || value === 'false'){
					value = false;
				} else {
					value = undefined;
				}
			}
			break;
		case 'select-lowercase':
			value = ( input.value.length > 0 ? input.value.toLowerCase() : undefined );
			break;
		case 'select':
			value = ( input.value.length > 0 ? input.value : undefined );
			break;
		case 'list':
			value = getTagsOfInput(input);
			if ( Array.isArray(value) === false || value.length <= 0 ) value = undefined;
			break;
		case 'integer':
			value = parseInt(input.value);
			if ( Number.isInteger(value) !== true ) value = undefined;
			break;
		case 'regexp':
			try {
				let valid_regexp = new RegExp(input.value);
				if (valid_regexp) value = input.value;
			} catch(err){}
			break;
	}
	if( value !== undefined ){
		return {
			operator: current_state_of_query_input.operator,
			criteria: value
		};
	} else {
		return false;
	}
};

const addNewSelectorToQuery = function(){
	let selector = parseQueryInput();
	let field = query_input_field_input.value;
	if (selector && field && field.length > 0){
		let final_selector = {};
				final_selector[field] = {};
				final_selector[field][selector.operator] = selector.criteria;
		state_of_query_input.selectors.push(final_selector);
		stringifyQueryToManualEditor();
	} else {
		notifyUser('warn', 'Invalid Input', `One of required inputs (value or field) is blank or invalid, concerning the chosen operator ${current_state_of_query_input.operator}.`);
	}
};

const stringifyQueryToManualEditor = function(){
	let query_string = { selector : {} };
			if ( state_of_query_input.skip > 0 ) query_string.skip = state_of_query_input.skip;
			if ( state_of_query_input.limit > 0 ) query_string.limit = state_of_query_input.limit;
			query_string.selector[state_of_query_input.match_mode] = state_of_query_input.selectors;
			query_string = JSON.stringify(query_string, null, CONFIGS.JSON_PRETTY_PRINT_SPACING_FOR_QUERY_EDITOR);
	query_input_text_editor.setValue(query_string, true);
};

const resetQueryInput = function(){
	query_input_text_editor.setValue('');
	state_of_query_input.match_mode = query_input_match_input.value.toLowerCase();
	state_of_query_input.selectors = [];
	query_input_limit_input.value = state_of_query_input.limit = 0;
	query_input_skip_input.value = state_of_query_input.skip = 0;
};

const proceedQuery = function(){
	let final_query = query_input_text_editor.getValue();
	if( final_query && final_query.length > 0 ){
		try {
			final_query = JSON.parse( final_query );
			if ( final_query && final_query.hasOwnProperty('selector')){
				sendJson({ action: 'query_db', arguments: final_query }, false);
				attr(query_locker, 'data-active', 'true');
				indicate('Query DB ...');
				attr(query_input_page, 'data-active', 'false');
			}
		} catch (err) {
			notifyUser('error', 'Invalid Query', 'Query Code is Must be Valid JSON ! We Can Not Proceed.');
		}
	} else {
		notifyUser('warn', 'Invalid Query', 'Query Code is Empty! We Can Not Proceed.');
	}
};

const showQueryResult = function( response ){
	if( response && response.hasOwnProperty('docs') && Array.isArray(response.docs) && response.docs.length > 0 ){
		listUpAllDocsList(response.docs, false, true, true);
	} else {
		notifyUser('info', 'Nothing Found.', 'Requested Query Resulted in No Docs.');
	}
	attr(query_locker, 'data-active', 'false');
	indicate(false, A_GLIMPSE_DELAY);
};
