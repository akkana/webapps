// Service worker and caching code for FeedRead

////////////////////////////////////////
// Configurable variables:

// The top level of the feed dir:
const feedTop = '/feedread/feeds/';

////////////////////// End configuration

// Tried to make this a const but that led to an undeclared error later:
// ReferenceError: can't access lexical declaration `CACHENAME' before initialization
// Javascript is so weird.
var CACHENAME = "feed-cache";
var APPCACHENAME = "feedread-app";

/*
function basename(path) {
    return path.replace(/.*\//, '');
}
*/

function dirname(path) {
    return path.match(/.*\//);
}

// The home directory from which this app was run
const appHome = dirname(document.location.href);

// Current date in format mm-dd-day
var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function formatDate(d) {
    d = d || new Date();
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

// Variables used by fetchDaily: should no longer need to be global.
//var todayStr = null;
//var manifestURL = null;
//var manifestList = null;


// Read the manifest (which should already be in the cache)
// and return (a promise of) the manifest list.
async function readManifest(manurl) {
    // For debugging: show if it's in the caches now.
    matchStatus = await caches.match(manurl);
    //console.log("Here's " + manurl + " in the caches: " + matchStatus);

    console.log("fetching " + manurl);

    // Try to fetch from network, not cache:
    var myHeaders = new Headers();
    myHeaders.append('pragma', 'no-cache');
    myHeaders.append('cache-control', 'no-cache');
    var myRequest = new Request(manurl);
    var myInit = {
        method: 'GET',
        headers: myHeaders,
    };
    response = await fetch(myRequest, myInit);

    // response = await fetch(manurl);
    if (!response.ok) {
        err = new Error("Couldn't fetch " + manurl + ": status "
                        + response.status + " " + response.statusText);
        err.code = response.status;
        throw(err);
    }
    var txt = await response.text();
    var manList = txt.split(/\r?\n/);

    // This split adds a bogus final empty entry. Remove it.
    // Note, this won't do anything about empty lines in the
    // middle of the list, but feedme shouldn't create any.
    if (manList[manList.length-1] == "")
        manList.pop();
    return manList;
}

//
// Fetch the MANIFEST file for one day's daily feeds,
// and then fetch and cache all the files referred to there.
//
async function fetchDaily(dayStr) {
    if (!dayStr)
        dayStr = formatDate(new Date());

    setStatus("Fetching feeds for " + dayStr + "...");
    console.log("Fetching feeds for " + dayStr + "...");

    var dayURL = feedTop + dayStr + '/';
    var manifestURL = dayURL + 'MANIFEST';

    try {
        const cache = await caches.open(CACHENAME);

        // Clear out the MANIFEST from the cache.
        // This is arguable, since really the MANIFEST shouldn't change,
        // but it's vaguely possible to have gotten an early copy of it
        // before it was fully written.
        // In any case, it's useful for testing.
        deleteStatus = await cache.delete(manifestURL);
        console.log("status of deleting " + manifestURL + ": " + deleteStatus);

        // Read the manifest and parse it into an array, manifestList.
        var manifestList = await readManifest(manifestURL);
        console.log("Read the manifest");
        if (!manifestList) {
            console.log("I guess reading the manifest failed");
            return;
        }

        console.log("Inside the promise, the manifest has "
                    + manifestList.length + " lines");
        await cache.add(manifestURL);

        // Fetch a new copy of feeds.css.
        await cache.add(feedTop + "feeds.css");

        newURLs = [];
        for (f in manifestList) {
            if (! manifestList[f])    // skip blank lines
                continue;
            if (manifestList[f] == ".EOF." || manifestList[f] == "MANIFEST")
                continue;

            // Is it already cached?
            newurl = dayURL + manifestList[f];
            matchResponse = await cache.match(newurl);
            if (!matchResponse) {
                console.log(" ", newurl, "not in the cache; will add");
                newURLs.push(newurl);
            }
            else
                console.log(" ", newurl, "already cached");
        }

        console.log("adding", newURLs.length, "URLs to the cache");
        await cache.addAll(newURLs);

        // Cache the files comprising the app, too, but in a different cache
        // so they don't show up when we're iterating over feeds.
        //console.log("Updating the app too");

        // Eventually the app files should be cached too.
        // But don't do that while testing: it makes it hard to
        // try new versions, and even shift-reload doesn't reload.
        // Besides, this caching should maybe happen in the
        // serviceworker install or activate event.
        //const appcache = await caches.open(APPCACHENAME);
        //await appcache.addAll(appFiles);

        setStatus("Fetched feeds")
        if (contentDoc().location.href.endsWith(TOCPAGE))
            TOCpage();
        //navigator.onLine = false;

        return 0;
    }
    catch (err) {
        alert("fetch failed:" + err);
        return err;
    }
}

//
// Parse an Apache directory listing.
//
async function dirListing(url) {
    // Try to fetch from network, not cache:
    var myHeaders = new Headers();
    myHeaders.append('pragma', 'no-cache');
    myHeaders.append('cache-control', 'no-cache');
    var myRequest = new Request(url);
    var myInit = {
        method: 'GET',
        headers: myHeaders,
    };
    response = await fetch(myRequest, myInit);

    if (!response.ok) {
        err = new Error("Couldn't fetch " + manurl + ": status "
                        + response.status + " " + response.statusText);
        err.code = response.status;
        throw(err);
    }
    var txt = await response.text();

    // Parse the HTML directory listing
    nameField = -1;
    var el = document.createElement('html');
    el.innerHTML = txt;
    trs = el.getElementsByTagName('tr');
    // Find the index for the Name column
    ths = trs[0].getElementsByTagName('th');
    for (d in ths) {
        if (ths[d].textContent == "Name") {
            nameField = d;
            break;
        }
    }
    if (nameField < 0) {
        console.log("Couldn't parse directory listing");
        return;
    }

    filenames = [];
    for (row in trs) {
        try {
            tds = trs[row].getElementsByTagName('td');
            if (!tds) {
                continue;    // For instance, the first row is all <tr>
            }
            filenames.push(tds[nameField].textContent);
        }
        catch (err) {
        }
    }

    return filenames;
}

//
// Mirror everything on the server, in case our cache expires or whatever.
//
async function mirrorAll() {
    var listing = await dirListing(feedTop);

    for (f in listing) {
        if (! listing[f].endsWith('/'))
            continue;
        // It's a directory. Make sure it starts with a number.
        if (parseInt(listing[f]) == NaN)
            continue;
        // Good enough, let's try fetching it.
        // But be sure to strip any final slash first.
        var dirstr = listing[f].replace(/\/+$/, "");
        await fetchDaily(dirstr);
    }

    setStatus("Fetched feeds")
    if (contentDoc().location.href.endsWith(TOCPAGE))
        TOCpage();
    //navigator.onLine = false;

    return 0;
}

//
// Return an array of all the URLs in the cache, in no particular order.
//
async function listCachedPages() {
    var cache = await caches.open(CACHENAME);
    var cachedFiles = await cache.keys();
    return cachedFiles;
}

//
// The sort for top-level pages is complicated:
// top-level pages look like
// http://host/feedread/feeds/09-10-Tue/A_Word_A_Day/index.html
// and the sort should sort the 09-10-Tue in reverse order but the
// part after that in normal alphabetical order.
//
function tocsort(a, b) {
    var aparts = a.split('/');
    var bparts = b.split('/');
    var adate = aparts[aparts.length-3];
    var bdate = bparts[bparts.length-3];
    if (adate > bdate)
        return -1
    if (adate < bdate)
        return 1;
    var afeed = aparts[aparts.length-2];
    var bfeed = bparts[bparts.length-2];
    if (afeed < bfeed)
        return -1
    if (afeed > bfeed)
        return 1;
    return 0;
}

//
// Return a sorted array of all the top-level pages available.
//
async function TOC() {
    var cachedFiles = await listCachedPages();

    tocPages = [];
    for (var key in cachedFiles) {
        // Skip directories and the manifest:
        var url = cachedFiles[key].url;
        if (url.endsWith('/') || url == "MANIFEST")
            continue

        // Find index.html files
        if (url.endsWith('index.html')) {
            tocPages.push(url);
        }
    }
    tocPages.sort(tocsort);
    return tocPages;
}

//
// Delete from the cache all pages that start with pat.
//
async function deleteMatching(pat) {
    var cache = await caches.open(CACHENAME);
    var cachedFiles = await cache.keys();
    for (f in cachedFiles) {
        //console.log("Checking", cachedFiles[f].url);
        if (cachedFiles[f].url.startsWith(pat)) {
            //console.log("Deleting", cachedFiles[f].url);
            // No particular need to await for the delete
            cache.delete(cachedFiles[f]);
        }
        //else
        //    console.log("No match:", cachedFiles[f].url);
    }
}

//
// Register a service worker
//
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
        .then((reg) => {
          console.log('Service worker registered.', reg);
        });
  });
}
*/
