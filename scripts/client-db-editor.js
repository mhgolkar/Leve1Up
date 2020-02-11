
// Leve1Up
// client - db - editor . js

const resetRevRotator = function(index_){
	if ( index_ === false || (!open_doc_revs) || open_doc_revs.length <= 0 ){ // resetand deactivate
		attr(rev_man_rotator, 'data-active', 'false');
		rev_man_view.innerText = 'No Revisions.';
	} else {
		open_rev = ( open_doc_revs.length > index_ ? index_ : 0 );
		attr(rev_man_rotator, 'data-active', 'true');
		rev_man_view.innerText = open_doc_revs[open_rev];
		let forward = (( open_doc_revs.length == 1 || open_rev <= 0 ) ? 'false' : 'true');
				attr(rev_man_oldest, 'data-active', forward);
				attr(rev_man_previous, 'data-active', forward);
		let backward = ( (open_doc_revs.length == 1 || open_rev >= (open_doc_revs.length - 1 )) ? 'false' : 'true' );
				attr(rev_man_next, 'data-active', backward);
				attr(rev_man_latest, 'data-active', backward);
	}
};

const rotateRevision = function (direction, open_rev_idex){
	if ( open_doc_revs ){
		let rev_index_to_open = open_rev_idex || open_rev || 0;
		switch (direction) {
			case 'oldest':
				rev_index_to_open = 0;
				break;
			case 'previous':
				rev_index_to_open--;
				break;
			case 'next':
				rev_index_to_open++;
				break;
			case 'latest':
				rev_index_to_open = (open_doc_revs.length - 1);
				break;
		}
		if( rev_index_to_open < 0 ){
			rev_index_to_open = 0;
		} else if( rev_index_to_open >= open_doc_revs.length ){
			rev_index_to_open = (open_doc_revs.length - 1);
		}
		let rev_number = open_doc_revs[rev_index_to_open];
		openDocToEdit(open_doc._id, rev_number);
	}
};

const switchListOpenIncdication = function(doc_id){
	// switch openness
	attr( x('#docs-list > [data-open="true"]') , 'data-open', 'false');
	if(doc_id) attr( x(`#docs-list > [title='${doc_id}']`) , 'data-open', 'true');
};

const loadUpEditor = function(doc){
	let rev_index = open_doc_revs.indexOf(doc._rev);
	resetRevRotator(rev_index);
	let doc_string = JSON.stringify(doc, null, CONFIGS.JSON_PRETTY_PRINT_SPACING);
	editor.setValue(doc_string, true);
	switchListOpenIncdication(doc._id);
	indicate(false, A_GLIMPSE_DELAY);
};

const fetchOpenDoc = function(doc_id){
	if( docs_all_list.includes(doc_id) === true ){
		// blur editor
		openDocToEdit(false); // reset/null editor
		indicate('Fetching Doc ...');
		// fetch doc and all its revs from server
		sendJson({ action: 'fetch_doc', arguments: doc_id });
		attr(editor_lock, 'data-active', 'true');
	} else {
		notifyUser('error', 'Wrong Behavior!', 'An attempt made to get a none-existing doc! Somethings Wrong with this DB or with the app ?!');
		openDocToEdit(false); // reset/null editor
	}
};

const openFetchedDoc = function( pack ){
	if ( pack.hasOwnProperty('winner') && pack.hasOwnProperty('revisions') ){
		indicate(false);
		open_doc = pack.winner;
		open_doc_revs = [];
		open_doc_revs_by_rev_number = {};
		for (let i = 0; i < pack.revisions.length; i++) {
			let revision = pack.revisions[i];
			open_doc_revs_by_rev_number[ revision._rev ] = revision;
			open_doc_revs.unshift( revision._rev );
		}
		open_doc_winner_rev = pack.winner._rev;
		openDocToEdit(open_doc._id);
		attr(editor_lock, 'data-active', 'false');
	}
};

const openDocToEdit = function(doc_id, rev){
	if ( typeof doc_id === 'string' ){
		is_new_doc_or_empty = false;
		if ( open_doc && doc_id === open_doc._id ){ // allready loaded and opened
			if ( rev && open_doc_revs[open_rev] != rev ) { // we want another revision
				open_doc = open_doc_revs_by_rev_number[rev];
			}
			loadUpEditor( open_doc );
		} else if ( docs_all_list.includes(doc_id) ){ // if there is such doc in db ...
			fetchOpenDoc(doc_id);
			if (CONFIGS.VERBOSE) console.log('Document Opened: ', doc_id, rev);
		} else { // no such doc at all! error!
			notifyUser('error', 'Wrong Behavior!', 'An attempt made to get a none-existing doc! Somethings Wrong with this DB or with the app ?!');
			openDocToEdit(false); // reset/null editor
		}
	} else { // reset editor and null records
		if (CONFIGS.VERBOSE) console.log('Editor Reset.');
		is_new_doc_or_empty = true; // because empty doc is a new one if saved!
		editor.setValue(''); // clean editor
		switchListOpenIncdication(false);
		resetRevRotator(false);
		restDocMemory();
	}
};

const restDocMemory = function(){
	open_doc = null;
	open_doc_revs = [];
	open_doc_revs_by_rev_number = {};
	open_doc_winner_rev = null;
	open_rev = null;
};

const appendDocToList = function(doc_id, visible, open){
	let new_doc_item = document.createElement('p');
			new_doc_item.innerText = doc_id;
			new_doc_item.title = doc_id;
			new_doc_item.setAttribute('data-visible', (visible ? 'true' : 'false'));
			new_doc_item.setAttribute('data-open', (open ? 'true' : 'false'));
	if( CONFIGS.APPEND_NEWLY_SAVED_DOC_TO_THE_TOP_OF_LIST ){
		docs_list_element.insertBefore(new_doc_item, docs_list_element.firstChild);
	} else {
		docs_list_element.appendChild(new_doc_item); // apend to the end of list
	}
};

const removeDocFromList = function(doc_id){
	x(`#docs-list > [title='${doc_id}']`).remove();
};

const listUpAllDocsList = function(rows, from_scratch, just_switch_visibility, invisible_others, docs_show_preset){
	if( from_scratch === true ){
		docs_list_element.innerHTML = '';
		docs_queried = [];
	}
	if( invisible_others === true ){
		let other_visibles = x(`#docs-list > [data-visible="true"]`);
				other_visibles = ( other_visibles instanceof NodeList ? other_visibles : [other_visibles] );
		for (let i = 0; i < other_visibles.length; i++) {
			attr(other_visibles[i], 'data-visible', 'false');
		}
		docs_shown = docs_show_preset || [];
	}
	if( rows && Array.isArray(rows) && rows.length > 0 ){
		indicate('Refreshing Docs List ...');
		newly_appended = 0;
		for (let i = 0; i < rows.length; i++) {
			let __id = ( typeof rows[i] === 'string' ? rows[i] : (rows[i]._id || rows[i].id || rows[i].key ));
			if(__id) {
				if(just_switch_visibility === true){
					if(docs_all_list.includes(__id) === false){ // it might be a totally new doc queried, not a searched one that is already listed in the docs_all_list
						listUpDoc({ _id: __id }, false, false); // so append it!
						newly_appended++;
					} else {
						let doc_el_in_list = x(`#docs-list > [title="${__id}"]`);
						if( doc_el_in_list ) attr(doc_el_in_list, 'data-visible', 'true');
						if(docs_shown.includes(__id) === false) docs_shown.unshift(__id);
					}
				} else {
					listUpDoc({ _id: __id }, false, false);
				}
			}
		}
		indicate(`${rows.length} Docs ${ just_switch_visibility !== true ? 'Listed' : 'Filtered' }.${ newly_appended > 0 ? ` [+${newly_appended} Queried]` : ''}`);
		if (CONFIGS.VERBOSE) console.log(`${ from_scratch ? 'List Cleaned Up and ' : ''}${rows.length} Docs ${ just_switch_visibility !== true ? 'Listed' : 'Filtered' }.`);
	}
	updateUI();
};

const listUpDoc = function(doc, open_it, update_ui, default_append){
	if ( doc && doc.hasOwnProperty('_id') === true ){
		if( docs_all_list.includes(doc._id) === false ){
			docs_all_list.unshift(doc._id);
		}
		if( docs_queried.includes(doc._id) === false ){
			docs_queried.unshift(doc._id);
			if( docs_shown.includes(doc._id) === false ){
				docs_shown.unshift(doc._id);
			}
		}
		if(default_append !== false) appendDocToList(doc._id, true, false);
		if ( open_doc && doc._id === open_doc._id ){ //  is it new rev of the opened doc
			if ( open_doc_revs.includes(doc._rev) === false ){
				open_doc_revs.push(doc._rev);
				open_doc_revs_by_rev_number[doc._rev] = doc;
				open_doc_winner_rev = doc._rev;
			}
		}
		if ( open_it ){
			openDocToEdit(doc._id, doc._rev);
		}
		if(update_ui !== false) updateUI();
	}
};

const listDownDoc = function(doc, destruction, update_ui){
	if ( typeof doc === 'object' ){
		let _id = doc._id || doc.id || false ;
		let _rev = doc._rev || doc.rev || false ;
		if ( _id && _rev ){
		if ( destruction !== false ){
			let shall_be_destroyed = true;
			if ( destruction === 'smart' ){
				if ( open_doc && _id === open_doc._id ){
					if ( open_doc_revs.length > 1 ){ // there is other revs
						shall_be_destroyed = false; // so don't destroy the doc
						// but remove the rev
						removeFromArray(_rev, open_doc_revs);
						delete open_doc_revs_by_rev_number[_rev];
						if ( open_doc_winner_rev === _rev ) open_doc_winner_rev = open_doc_revs[ 0 ];
						openDocToEdit(_id, open_doc_winner_rev);
					}
				}
			}
			if (shall_be_destroyed){
				removeDocFromList(_id);
				removeFromArray(_id, docs_all_list);
				removeFromArray(_id, docs_queried);
				removeFromArray(_id, docs_shown);
				if ( open_doc && _id === open_doc._id ){// doc is open yet
					openDocToEdit(false); // close current doc
				}
			}
		}
		if(update_ui !== false) updateUI();
		indicate(`Document '${_id}' Removed.`, SHORT_READ_DELAY);
		}
	}
};

const newDoc = function(sample_content){
	openDocToEdit(null);
	is_new_doc_or_empty = true;
	open_doc_winner_rev = null;
	let random_id;
	do {
		let random_factor = ( Math.ceil( Math.random() * CONFIGS.NEW_DOC_RANDOMIZER_FACTOR)).toString(STRINGIFYING_BASE_FOR_RANDOM_DOC_NAME);
		random_id = `new_doc_${random_factor}`;
	} while ( docs_all_list.includes(random_id) );
	let content = ( typeof sample_content === 'string' ? sample_content : STRINGIFIED_NEW_DOC_TEMPLATE);
			content = content.replace('%random_id%', random_id);
	editor.setValue( content, true );
	if (CONFIGS.VERBOSE) console.log('Blank New Doc: ', random_id);
};

const saveDoc = function(skip_thorough_doc_validation, forced_to_write){
	let safe_content_to_save = false;
	let editor_content = editor.getValue();
	if ( editor_content.length > 0 ) {
		try {
			safe_content_to_save = JSON.parse(editor_content);
			if ( skip_thorough_doc_validation !== true ){
				if ( safe_content_to_save.hasOwnProperty('_id') == false || safe_content_to_save._id.length <= 0 ){
					safe_content_to_save = false;
					notifyUser('warn', 'Missing Document ID!', 'Documents must have a string property called "_id".');
				} else if ( (Object.keys(safe_content_to_save)).length === 1 && CONFIGS.GET_CONFIRMATION_FOR_ID_ONLY_DOCS == true ){ // only an id ?! confirm?
					safe_content_to_save = false; // don't continue
					// but get confirmation
					notifyUser('confirm', 'Are You Sure?!', 'You are trying to save a document without any data other than "_id". Are you sure ?', 'Proceed Anyway', function(){
						saveDoc(true);
					});
				} else if ( (open_doc && open_doc._id === safe_content_to_save._id)  || docs_all_list.includes(safe_content_to_save._id) === true ){ // this is an existing id sho needs to hav _rev
					if ( safe_content_to_save.hasOwnProperty('_rev') === false || safe_content_to_save._rev.length <= 0 || safe_content_to_save._rev !== open_doc_winner_rev ){
						safe_content_to_save = false; // don't continue
						// but get confirmation
						notifyUser('confirm', 'Are You Sure?!', 'You are trying to update an existing document without or with old "_rev" (revision) property. It may cause conflict. Are you sure ?', 'Force Write', function(){
							saveDoc(true, true);
						});
					}
				}
			}
		} catch (err){
			notifyUser('warn', 'Wrong Document Format!', 'Documents shall be valid JSON to be saved.');
			safe_content_to_save = false;
		}
	} else {
		notifyUser('warn', 'Nothing to Save!', "We Can't Save a Blank Document.");
	}
	if( safe_content_to_save ){
		if (CONFIGS.VERBOSE) console.log(`Saving Doc '${safe_content_to_save._id}' : `, safe_content_to_save);
		indicate('Saving Doc ...');
		if ( forced_to_write === true && open_doc_winner_rev ) safe_content_to_save._rev = open_doc_winner_rev;
		sendJson({ action: 'save_doc', arguments:{
			doc: safe_content_to_save,
			options: ( forced_to_write === true ? { force: true } : undefined )
		}}, false);
	}
};

const deleteDoc = function(){
	if( open_doc && (!is_new_doc_or_empty) ){ // there is something open to be deleted
		if ( open_doc._rev === open_doc_winner_rev || ( open_doc_winner_rev && CONFIGS.DELETE_DOCUMENT_BY_WINNER_REV === true ) ){
			notifyUser('confirm', 'Are You Sure?', `You are going to Remove a Document from DB. The Doc '${open_doc._id}' will be gone Permanently. Are you sure ?!`, 'Yes Remove', function(){
				// user confirms ? go for it...
				if (CONFIGS.VERBOSE) console.log('Delete Doc: ', open_doc._id);
				sendJson({ action: 'delete_doc', arguments: { _id: open_doc._id, _rev: open_doc_winner_rev } });
				indicate('Removing Doc ...');
			});
		} else {
			notifyUser('warn', "Won't Proceed!", 'You Can Only Remove the Winner (~latest) Document. Otherwise there would be a conflict.');
		}
	} else {
		openDocToEdit(false);
		if (CONFIGS.VERBOSE) console.log('New Doc Closed By Hitting Del Button.');
	}
};

const compactionAction = function(){
	// ask for confirmation:
	notifyUser('confirm', 'Compacting Database ?', 'Are You Sure? This reduces the database’s size by removing unused and old data, namely non-leaf revisions and attachments that are no longer referenced by those revisions.', 'Do it!', function(){
		// then do it!
		if (CONFIGS.VERBOSE) console.log('Proceeding DB Compaction...');
		sendJson({ action: 'compact_db', arguments: null }, false);
	}, function(){
		// or just dismiss it.
		if (CONFIGS.VERBOSE) console.log('DB Compaction Dismissed.');
	});
};

const refreshAll = function(reconnect_default){
	filter_input.value = '';
	docs_list_element.innerHTML = '';
	openDocToEdit(false);
	docs_all_list = [];
	docs_queried = [];
	docs_shown = [];
	if (reconnect_default !== false){
		attr(connection_spinner, 'data-active', 'true');
		connectDB(used_connection);
	}
};

const refreshListView = function(){
	filter_input.value = '';
	openDocToEdit(false);
	listUpAllDocsList(docs_all_list, false, true, false);
};

const filterDocList = function(regexp_pattern){
	if ( !regexp_pattern ) regexp_pattern = filter_input.value;
	if ( typeof regexp_pattern === 'string' && regexp_pattern.length > 0 ){
		let regex =  false;
		try {
			regex = new RegExp(regexp_pattern, 'ig');
		} catch (err){
			if ( CONFIGS.DEV_MODE ) console.error('Bad Filter! We Expect RegExp Friendly Filter. Error: ', err);
		}
		docs_shown = [];
		if(regex){
			for (let doc_id of docs_queried) {
				if ( doc_id && typeof doc_id === 'string' && doc_id.search(regex) > -1 ) docs_shown.unshift(doc_id);
			}
		}
	} else {
		docs_shown = docs_queried;
	}
	listUpAllDocsList(docs_shown, false, true, true, docs_shown);
};
