//
// Service Workers for FeedRead.
//

var CACHENAME = "feed-cache";
var APPCACHENAME = "feedread-app";

// Program files that implement the app.
// These shouldn't be cached during development,
// because then reload doesn't change them, making debugging difficult.
const progFiles = [ "index.html",
                    "feedcache.js",
                    "pageactions.js",
                    "pageui.css",
                    "cache.html",
                    "cacheedit.js",
                    "initial.html"
                  ];
// feeds/feeds.css also needs to be cached, but fetchFeeds will do that.

const appHome = "/feedread/";

// Place to tore our current origin once we've initialized.
// But it can't live here, because this code might get run
// whenever the thread is restarted, resetting origin.
var origin = null;

// Is the app online? By default, it's not, but during fetchDaily
// this will be temporarily toggled to true.
self.online = false;

//
// Install: fired the first time the user visits.
//
self.addEventListener('install', function(event) {
    console.log('Service Worker: Install....');

    /* During testing, caching program files prevents making changes
     * them, making debugging much more difficult.
    event.waitUntil( // Open the Cache
        caches.open(APPCACHENAME).then(function(cache) {
            console.log('Service Worker: Caching App');
            // Add Files to the Cache
            return cache.addAll(progFiles.map((x) => "${appHome}/${x}"););
        })
    );
     */
});

//
// activate: fired when the service worker starts up.
// In theory, thispdates the cache whenever any of the app shell files change.
// In practice, it hardly ever fires, and doesn't update anything when it does.
//
self.addEventListener('activate', function(event) {
    console.log('Service Worker: Activate....');
    event.waitUntil( caches.keys()
        .then(function(cacheNames) {
            return Promise.all(cacheNames.map(function(key) {
                if (key !== APPCACHENAME && key != CACHENAME) {
                    console.log('Service Worker: Removing Old Cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

function basename(path) {
    return path.replace(/.*\//, '');
}

//
// fetch: fired for every fetch request.
//

// simple cache then network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});


/*
self.addEventListener('fetch', function(event) {
    console.log('Service Worker: Fetch', event.request.url);
    event.respondWith(caches.match(event.request)
        .then(function(response) {
            if (response && response.ok) {
                console.log(event.request.url, "is cached");
                return response;
            }
         }

            if (navigator.online) {
                console.log("App is online, fetching", event.request.url);
                return fetch(event.request);
            }
            console.log("App is OFFLINE", event.request.url);

            // Allow fetching program files, like initial.html
            var fname = basename(event.request.url);
            if (progFiles.includes(fname)) {
                console.log("Allowing fetch of program file",
                            event.request.url);
                return fetch(event.request);
            }
            if (fname == "feeds.css") {
                console.log("Allowing fetch of feeds.css",
                            event.request.url);
                return fetch(event.request);
            }

            // Anything else that's not in the cache should be refused.
            console.log(event.request.url, "is not in the cache, refusing");
            //return Response();   // cache-only
        })
    );
});
*/
