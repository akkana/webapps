// IndexedDB
// https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/

var db;

var DB_NAME         = "feedReadDB";
var PREF_STORE_NAME = "prefs";

function listDB(store) {
    console.log("Trying to list DB", store);
    var tx = db.transaction([store], "readonly");
    var store = tx.objectStore(store);
    var req = store.count();

    // Requests are executed in the order in which they were made against the
    // transaction, and their results are returned in the same order.
    // Thus the count text below will be displayed before the actual pub list.
    req.onsuccess = function(evt) {
        console.log('There are ', evt.target.result,
                    'record(s) in the", store, "store.');
    };
    req.onerror = function(evt) {
        console.error("error reading prefs:", this.error);
    };

    req = store.openCursor();
    req.onsuccess = function(evt) {
        var cursor = evt.target.result;

        // If the cursor is pointing at something, ask for the data
        if (cursor) {
            //console.log("displayPubList cursor:", cursor);
            req = store.get(cursor.key);
            req.onsuccess = function (evt) {
                var blob = evt.target.result;
                console.log(cursor.key + ": " + blob);
                // Shouldn't happen:
                if (blob.hasOwnProperty('blob'))
                    console.log(cursor.key, "  has blob of type "
                                + typeof blob.blob);
            };

            // Move on to the next object in store
            cursor.continue();
        } else {
            console.log("No more entries");
        }
    };
}

function set_pref(key, val) {
    // Open a transaction to the database
    //var readWriteMode = (typeof IDBTransaction.READ_WRITE == "undefined"
    //                     ? "readwrite" : IDBTransaction.READ_WRITE);
    var tx = db.transaction([PREF_STORE_NAME], "readwrite");

    // Put the val into the dabase as a blob and give it a key:
    var put = tx.objectStore(PREF_STORE_NAME).put(val, key);

    console.log("Set pref", key, "to", val);
}

/*
 * Open the database.
 * Note: The recommended way to do this is assigning it to window.indexedDB,
 * to avoid potential issues in the global scope when web browsers start
 * removing prefixes in their implementations.
 * You can assign it to a varible, like var indexedDB… but then you have
 * to make sure that the code is contained within a function.
 */
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
var dbVersion = 1.0;

function openDb() {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, dbVersion, db,
                             createObjectStore = function (dataBase) {
                                 // Create an objectStore if it doesn't already exist.
                                 // Once it's created, it should persist.
                                 console.log("Creating objectStore")
                                 dataBase.createObjectStore("feeds");
                             });
    req.onsuccess = function (evt) {
        // Equal to: db = req.result;
        db = this.result;
        console.log("openDb DONE");
    };
    req.onerror = function (evt) {
        console.error("openDb:", evt.target.errorCode);
    };

    req.onupgradeneeded = function (evt) {
        console.log("openDb.onupgradeneeded");
        var store = evt.currentTarget.result.createObjectStore(PREF_STORE_NAME)

        //var store = evt.currentTarget.result.createObjectStore(
        //    PREF_STORE_NAME, { keyPath: 'id', autoIncrement: true });

        // Might need some createIndex calls here?
        // Worry about that if the db version ever needs to be bumped.
        //store.createIndex('title', 'title', { unique: false });
    };
}

function clearAllPrefs() {
    var store = getObjectStore(PREF_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
        displayActionSuccess("Prefs store cleared");
        displayPubList(store);
    };
    req.onerror = function (evt) {
        console.error("clearAllPrefs:", evt.target.errorCode);
        displayActionFailure(this.error);
    };
}

// Whatever else we do, it will require opening the db,
// so do that for sure:
openDb();
