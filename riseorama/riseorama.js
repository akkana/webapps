/* rise-o-rama: calculate rise/set points for the sun/moon.
 * Copyright 2019 by Akkana Peck; share and enjoy under the GPLv2 or later.
 */
var map;

var targetPoint;

// Temporary static list of bearings, for testing:
var bearings = [ 118., 125., 270. ];

// Max distance in km to draw a bearing line:
var maxdist = 125;

// Radius of the Earth in km
R = 6378.1;

var currentLines = [];

function radians(deg) { return deg * Math.PI / 180.; }
function degrees(rad) { return rad * 180. / Math.PI; }

bearingPolyline = L.Polyline.extend({
    options: {
        bearing: null    // default value, override this
    }
});

/*
 * Given a centerpoint and bearing, return [lat, lon] endpoint.
 * Initial and returned lat, lon are both degrees.
 */
function bearing2latlon(latlon, bearing) {
    // Convert everything to radians:
    bearingR = radians(bearing);
    var latR = radians(latlon.lat);
    var lonR = radians(latlon.lng);

    // Haversine
    newlat = Math.asin(Math.sin(latR) * Math.cos(maxdist/R) +
                       Math.cos(latR) * Math.sin(maxdist/R)
                       * Math.cos(bearingR));
    newlon = lonR +
        Math.atan2(Math.sin(bearingR) * Math.sin(maxdist/R) * Math.cos(latR),
                   Math.cos(maxdist/R) - Math.sin(latR) * Math.sin(newlat))

    return new L.LatLng(degrees(newlat), degrees(newlon));
}

function onLineClick(e) {
    console.log("click on line with bearing: " + this.options.bearing);
    this.setStyle({ color: 'red' });
    L.DomEvent.stopPropagation(e);
}

function onMapClick(e) {
    //alert("You clicked the map at " + e.latlng + ", type " + typeof e.latlng);

    // Remove the current point:
    if (targetPoint)
        map.removeLayer(targetPoint);

    // Remove its lines too:
    for (line in currentLines) {
        console.log("Removing line with bearing: "
                    + currentLines[line].options.bearing);
        map.removeLayer(currentLines[line]);
    }
    currentLines = []

    // Set a new point:
    targetPoint = L.marker(e.latlng).addTo(map);

    var polylineOptions = {
        color: 'blue',
        weight: 6,
        opacity: 0.9
    };

    // Draw lines for everything in the variable bearings.
    for (bearing in bearings) {
        polylineOptions.bearing = bearings[bearing];
        endpt = bearing2latlon(e.latlng, bearings[bearing]);
        plinepts = [ e.latlng, endpt ];
        polyline = new bearingPolyline(plinepts, polylineOptions);
        map.addLayer(polyline);
        polyline.on('click', onLineClick);
        currentLines.push(polyline);
        console.log("Adding polyline with bearing " + polyline.options.bearing);
    }
}

function init_map() {
    map = new L.Map('mapcanvas').setView([35.81, -106.22], 11);

    map.on('click', onMapClick);

    var Stamen_Terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 18,
        ext: 'png'
       });
    Stamen_Terrain.addTo(map);

    var OSM = L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
            maxZoom: 18
        });

    var Esri_WorldImagery = L.tileLayer(
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

/* http://leaflet-extras.github.io/leaflet-providers/preview/ lists some maps.
   These need an API key:
var Thunderforest_OpenCycleMap = L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={apikey}', {
	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	apikey: '<your apikey>',
	maxZoom: 22
});
var HERE_hybridDay = L.tileLayer('https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/hybrid.day/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
	attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
	subdomains: '1234',
	mapID: 'newest',
	app_id: '<your app_id>',
	app_code: '<your app_code>',
	base: 'aerial',
	maxZoom: 20,
	type: 'maptile',
	language: 'eng',
	format: 'png8',
	size: '256'
});
*/

    var baseMaps = {
        'Stamen Terrain' : Stamen_Terrain,
        'OpenStreetMap' : OSM,
        'ESRI World Imagery' : Esri_WorldImagery,
    };
}


