// IndexedDB
// https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/

////////////////////////////////////////
// Configurable variables:

// The top level of the feed dir:
var feedTop = '/feeds';

////////////////////// End configuration

var db;

var DB_NAME       = "feedReadFiles";
var DB_STORE_NAME = "feeds";

function listDb() {
    console.log("Trying to list DB");
    var tx = db.transaction(["feeds"], "readonly");
    var store = tx.objectStore(DB_STORE_NAME);
    var req = store.count();

    // Requests are executed in the order in which they were made against the
    // transaction, and their results are returned in the same order.
    // Thus the count text below will be displayed before the actual pub list
    // (not that it is algorithmically important in this case).
    req.onsuccess = function(evt) {
        console.log('There are ' + evt.target.result +
                    'record(s) in the object store.');
    };
    req.onerror = function(evt) {
        console.error("add error", this.error);
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
                console.log(cursor.key + ": " + blob.type);
                // if (blob.hasOwnProperty('blob'))
                //     console.log("  has blob of type " + typeof blob.blob);
            };

            // Move on to the next object in store
            cursor.continue();
        } else {
            console.log("No more entries");
        }
    };
}

function displayFile(url) {
    // Retrieve the file whose key is the url.
    var tx = db.transaction(["feeds"], "readonly");
    tx.objectStore("feeds").get(url).onsuccess = function (event) {
        var fetchedBlob = event.target.result;
        console.log("Got the file!" + fetchedBlob);
        console.log("It's type " + fetchedBlob.type);

        if (fetchedBlob.type == "text/html") {
            var maincontent = document.getElementById("maincontent");
            console.log("Fetched blob is text/html. Inserting");
            maincontent.innerHTML = fetchedBlob;
            var reader = new FileReader();
            reader.onload = (function(evt) {
                var html = evt.target.result;
                maincontent.innerHTML = html;
            });
            reader.readAsText(fetchedBlob);
        }
    };
}

// Current date in format mm-dd-day
var days = ["Sun", "Mon", "Tues", "Wed", "Thu", "Fri", "Sat"];
function formatDate(d) {
    var d = new Date();
    var date = d.getDate();
    if (date < 10) date = '0' + date;
    var month = d.getMonth() + 1;
    if (month < 10) month = '0' + month;
    var day = days[d.getDay()];
    return month + '-' + date + '-' + day;
}

// Fetch all the feeds generated today.
// Start with $feedTop/mm-dd-day/MANIFEST
// and then fetch all the files referenced there.

// Variables used by fetchDaily:
var todayStr;
var manifest = null;

function fetchDaily(url, callback) {
    todayStr = formatDate(new Date());
    if (!manifest)
        fetchFile(feedTop + '/' + todayStr + '/MANIFEST',
                  function(key, blob) {
                      console.log("fetchDaily: " + key + " got fetched, yay");
                      console.log("blob type: " + blob.type);
                      if (!blob.type.startsWith("text/")) {
                          console.log("MANIFEST isn't text, it's " + blob.type);
                          return;
                      }
                      console.log("Making a reader");
                      // Split it into an array of lines
                      var reader = new FileReader();
                      reader.onload = (function(evt) {
                          var text = evt.target.result;
                          manifestLines = text.split(/\r?\n/);
                          console.log("The manifest has "
                                      + manifestLines.length + " lines");
                          for (var i in manifestLines) {
                              // console.log(i + ": " + manifestLines[i]);
                          }
                      });
                      reader.readAsText(blob);
                  });
}

// Fetch a file by URL, store it in the db using the URL as the key,
// and then call the callback (if any) passing the key and blob.
function fetchFile(url, callback) {
    // Create XHR
    var xhr = new XMLHttpRequest(), blob;

    console.log("Making request for " + url);
    xhr.open("GET", url, true);
    // Set the responseType to blob
    xhr.responseType = "blob";

    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
            console.log("File retrieved");

            // Blob as response
            blob = xhr.response;
            console.log("Blob from xhr response:" + blob);
            console.log("Blob type:", blob.type);

            // Put the received blob into IndexedDB
            storeBlobInDb(url, blob);

            // Call the callback, if any, passing it the key and blob
            // of the fetched file
            if (callback) {
                console.log("There's a callback -- calling it");
                callback(url, blob);
            }
        } else {
            console.log("Couldn't fetch " + url);
        }
    }, false);
    // Send XHR
    xhr.send();
}

//
// Store a blob in the database.
//
function storeBlobInDb(key, blob) {
    console.log("Storing a blob in IndexedDB with key '" + key + "'");

    // Open a transaction to the database
    //var readWriteMode = (typeof IDBTransaction.READ_WRITE == "undefined"
    //                     ? "readwrite" : IDBTransaction.READ_WRITE);
    var tx = db.transaction(["feeds"], "readwrite");

    // Put the blob into the dabase and give it a key:
    var put = tx.objectStore("feeds").put(blob, key);
}

/*
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
        var store = evt.currentTarget.result.createObjectStore(
            DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });

        // Might need some createIndex calls here?
        // Worry about that if the db version ever needs to be bumped.
        //store.createIndex('title', 'title', { unique: false });
    };
}

function clearObjectStore() {
    var store = getObjectStore(DB_STORE_NAME, 'readwrite');
    var req = store.clear();
    req.onsuccess = function(evt) {
        displayActionSuccess("Store cleared");
        displayPubList(store);
    };
    req.onerror = function (evt) {
        console.error("clearObjectStore:", evt.target.errorCode);
        displayActionFailure(this.error);
    };
}

// Whatever else we do, it will require opening the db,
// so do that for sure:
openDb();
