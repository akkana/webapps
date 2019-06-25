/* rise-o-rama: calculate rise/set points for the sun/moon.
 * Copyright 2019 by Akkana Peck; share and enjoy under the GPLv2 or later.
 */
var map;

var targetPoint;

var body = "moon";
var riseset = "rise";

// Default (non-selected) line color:
var linecolor = 'blue';
var selectedlinecolor = 'red';

// Max distance in km to draw a bearing line:
var maxdist = 125;

// Radius of the Earth in km
R = 6378.1;

var currentLines = [];

function radians(deg) { return deg * Math.PI / 180.; }
function degrees(rad) { return rad * 180. / Math.PI; }

risesetPolyline = L.Polyline.extend({
    options: {
        date: null,
        bearing: null,
        phase: null
    }
});

var polylineOptions = {
    color: linecolor,
    weight: 5,
    opacity: 0.9
};

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
    // "this" is the polyline clicked on
    console.log("click on line with date: " + this.options.date
                + ', phase ' + this.options.phase + '%'
                + ', bearing ' + this.options.bearing );

    // Set all lines back to the default
    for (line in currentLines)
        currentLines[line].setStyle({ color: linecolor });
    // then set this one to the selected color:
    this.setStyle({ color: selectedlinecolor });

    popupContent = this.options.date + "<br>" + body + riseset;
    if (this.options.phase > 0 && body != 'sun')
        popupContent += "<br>Phase: " + parseInt(this.options.phase) + '%';

    var popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);

    L.DomEvent.stopPropagation(e);
}

function draw_lines_from_JSON(responseJSON) {
    //console.log("Would draw from JSON: " + JSON.stringify(responseJSON));
    for (res in responseJSON) {
        // These objects should have date, az, and phase.
        var ev = responseJSON[res];

        az = 360. - parseFloat(ev['az']);

        endpt = bearing2latlon(targetPoint.getLatLng(), az);
        plinepts = [ targetPoint.getLatLng(), endpt ];

        polylineOptions.bearing = az;
        polylineOptions.date = ev['date'];
        polylineOptions.phase = ev['phase'];

        polyline = new risesetPolyline(plinepts, polylineOptions);

        map.addLayer(polyline);
        polyline.on('click', onLineClick);
        currentLines.push(polyline);
    }
}

function onMapClick(e) {
    console.log("Clicked the map at " + e.latlng);

    // Remove the current point:
    if (targetPoint)        map.removeLayer(targetPoint);

    // Remove its lines too:
    for (line in currentLines) {
        //console.log("Removing line with bearing: "
        //            + currentLines[line].options.bearing);
        map.removeLayer(currentLines[line]);
    }
    currentLines = []

    // Set a new point:
    targetPoint = L.marker(e.latlng).addTo(map);

    // First check the toggle button states:
    body = document.querySelector('input[name="bodybtn"]:checked').value;
    action = document.querySelector('input[name="actionbtn"]:checked').value;

    // Now build up the CGI URL.
    cgiurl = 'rise_set_az.cgi?lat=' + e.latlng.lat
        + '&lon=' + e.latlng.lng
        + '&body=' + body + '&action=' + action
        + '&phase=100';
    console.log("CGI URL: " + cgiurl);

    // Get the rise or set data for this point from the CGI.
    var req = new window.XMLHttpRequest();
    req.open('GET', cgiurl, true);    // async = true
    req.onreadystatechange = function() {
        if (req.readyState != 4) return;
        if (req.status == 200)
            draw_lines_from_JSON(JSON.parse(req.responseText));
    };
    req.send(null);
}

function init_map() {
    map = new L.Map('mapcanvas').setView([35.81, -106.22], 11);

    map.on('click', onMapClick);

    //
    // Add the menu to choose different basemaps:
    //
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

    var baseMaps = {
        'Stamen Terrain' : Stamen_Terrain,
        'OpenStreetMap' : OSM,
        'ESRI World Imagery' : Esri_WorldImagery,
    };
    var overlayMaps = { };
    L.control.layers(baseMaps, overlayMaps).addTo(map);}


