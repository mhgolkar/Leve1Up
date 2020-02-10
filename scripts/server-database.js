
// Leve1Up
// server - database . js

// Database Handler Modules

const ROOT = `${__dirname}/..`;
const { CC, EOL } = require(`${ROOT}/configs.js`);

const { EventEmitter } = require('events');
const PouchDB = require('pouchdb');
const pouchDBFind = require('pouchdb-find');

const DB =  class extends EventEmitter {

	constructor(options){

		super();

		this._ready = false;
		let __self = this;

		this._DB = undefined;

		this._DEBUG = options.debug || false;
		this._VERBOSE = options.verbose || false;
		this._POUCH_DB_DEBUG = options.pouchDB_debug || false;

		this.connectDB = async function (connection) {
			if ( typeof connection === 'object' && connection.hasOwnProperty('name') && connection.hasOwnProperty('adapter') ){ // if it is right
				if ( this._VERBOSE ) console.log(CC.Y, 'Connecting... ', EOL, CC.Reset, connection, EOL);
				if ( connection.adapter.toLowerCase() === 'leveldb' ) {
					let pouch_leveldb_adapter = require('pouchdb-adapter-leveldb');
					PouchDB.plugin(pouch_leveldb_adapter);
				}
				this._DB = new PouchDB(connection); // create database
				try { // test connection
					let info = await this._DB.info();
					if (typeof info === 'object' && info.hasOwnProperty('error') ){ // we are connected to db serivce but not the db itself
						if (this._VERBOSE) console.log(info);
						throw new Error( info.reason );
					} else {
						if (this._VERBOSE) console.log(CC.G, 'Successful Connection. ', CC.Reset, EOL);
						PouchDB.plugin(pouchDBFind);
						return info;
					}
				} catch(err){ // got rejected promiss
					if (this._VERBOSE) console.log(err);
					throw new Error( 'Fatal Error! Testing DB Failed. ' + err.message );
				}
				if ( this._POUCH_DB_DEBUG === true && PouchDB.hasOwnProperty('debug') ) {
					PouchDB.debug.enable('*');
				} else if ( this._POUCH_DB_DEBUG === true ) {
					var pouchDBDebug = require('pouchdb-debug');
					PouchDB.plugin(pouchDBDebug);
					PouchDB.debug.enable('*');
				}
			} else {
				throw new Error( 'Fatal Error! Trying to ConnectDB with Invalid Connection Settings.' );
			}
		};

		this.closeDB = async function(){
			try {
				await this._DB.close();
			} catch(err){
				if(this._DEBUG) console.log('Error Closing DB! ', err);
			}
			return true;
		};

		this.allDocsList = async function(){
			let docs_all = this._DB.allDocs({
				include_docs: false,
				attachments: false,
				conflicts: false
			});
			return docs_all;
		};

		this.saveDoc = async function( saveDocObject ){
			let done = false;
			if( saveDocObject.hasOwnProperty('doc') && saveDocObject.doc.hasOwnProperty('_id') ){
				if ( saveDocObject.hasOwnProperty('options') && saveDocObject.options && typeof saveDocObject.options === 'object'){
					done = await this._DB.put(saveDocObject.doc, saveDocObject.options);
				} else {
					done = await this._DB.put(saveDocObject.doc);
				}
			} else {
				throw new Error('Wrong Document Sent to be Saved! There is either no "doc" or the doc has no "_id". ');
			}
			if(this._VERBOSE) console.log(done, EOL);
			if ( done && done.hasOwnProperty('ok') ){
				let final_doc = await this._DB.get( (done.id || done._id), { rev: (done.rev || done._rev) } );
				return final_doc;
			} else {
				throw new Error('Problem Updating DB!');
			}
		};

		this.getDocAndRevsAll = async function(doc_id){
			if( typeof doc_id === 'string' && doc_id.length > 0 ){
				let all = { winner: false, revisions: [] };
				all.winner = await this._DB.get(doc_id, { revs_info: true });
				if( all.winner && all.winner.hasOwnProperty('_revs_info') === true ){
					if ( Array.isArray(all.winner._revs_info) && all.winner._revs_info.length > 0 ){
						for (let i = 0; i < all.winner._revs_info.length; i++) {
							let rev_info = all.winner._revs_info[i];
							if( rev_info.status === 'available' ){
								let revision_doc = await this._DB.get( doc_id, { rev: rev_info.rev } );
								all.revisions.push(revision_doc);
							}
						}
					}
					delete all.winner._revs_info; // some clean up
				}
				return all;
			} else {
				throw new Error('Trying to fetch doc without mentioning doc _id !');
			}
		};

		this.deleteDoc = async function(doc){
			if( doc && typeof doc === 'object' && doc.hasOwnProperty('_id') && doc.hasOwnProperty('_rev') ) {
				return ( await this._DB.remove(doc) );
			} else {
				throw new Error('Trying to Delete Doc with Wrong Request. We expect an object with at least "_id" and "_rev" properties.');
			}
		};

		this.compactDB = async function(){
			try {
				let done = await this._DB.compact();
				if ( done.ok ){
					done.compacted = true;
					return done;
				} else {
					throw new Error('Internal Server Error!');
				}
			} catch (err){
				if( this._DEBUG ) console.log(err);
				throw new Error('Internal Server Error!');
			}
		};

		this.queryDB = async function(request){
			if ( request && typeof request === 'object' && request.hasOwnProperty('selector') ){
				let result = await this._DB.find(request);
				if ( result && result.hasOwnProperty('docs') ){
					if ( result.hasOwnProperty('warning') ) delete result.warning;
					return result;
				}
			} else {
				throw new Error('Bad Query DB Request!');
			}
		};

	}

};

module.exports = DB;
