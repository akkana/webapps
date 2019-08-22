

//
// Clear all caches we have access to. Hopefully we won't need this much.
//
function clearCaches() {
    caches.keys().then(function(keyList) {
        console.log(keyList.length + " files are cached:");
        for (f in keyList) {
            console.log("    deleting all of cache " + keyList[f]);
            caches.delete(keyList[f]);
        }
    });
}

//
// Given a URL for the top level of a feed,
// e.g. http://localhost/feeds/08-18-Sun/A_Word_A_Day/
// delete all the files associated with that feed.
//
async function deleteDayFeed(urlpat) {
    cache = await caches.open(CACHENAME);
    keyList = await cache.keys();
    for (key in keyList) {
        // keyList[key] is a Request. Show its URL.
        url = keyList[key].url;

        if (url.startsWith(urlpat)) {
            console.log("Deleting", url, "from the cache");
            await cache.delete(url);
            // Ultimately await probably won't be needed; the user
            // can go on reading other things while this is deleting.
            // But for testing, it's necessary.
        }
    }
}

//
// Show everything in a specific cache.
//
async function showNamedCache(cachename) {
    outstr = "<h1>" + cachename + "</h2>\n<table>\n";
    cache = await caches.open(cachename);
    keyList = await cache.keys();
    keyList.sort();
    for (key in keyList) {
        // keyList[key] is a Request. Show its URL.
        url = keyList[key].url;
        outstr += "<tr>\n";
        if (url.endsWith('/')) {
            outstr += '<td><input type=button value="Delete" onclick="deleteDayFeed(\''
                + url + '\');">\n<th>';
            outstr += url;
        }
        else {
            outstr += "<td><td>";
            outstr += url;
        }
        outstr += "</tr>\n";
    }
    outstr += "</table>\n";

    output = document.getElementById("output");
    return outstr;
}

//
// Show everything in both caches.
//
async function showCached() {
    console.log("Showing", CACHENAME);
    var outstr = await showNamedCache(CACHENAME);
    console.log("Showing", APPCACHENAME);
    outstr += await showNamedCache(APPCACHENAME);
    output.innerHTML = outstr;
}
