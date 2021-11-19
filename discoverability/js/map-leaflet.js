var maplayers = {
};
var map;

function init_trailmap() {
    map = new L.Map('map-canvas').setView([35.86, -106.26], 12);;

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

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    function addTrail(jsonfile) {
        // Load a trail using ajax. https://gis.stackexchange.com/a/251184
        let xhr = new XMLHttpRequest();
        xhr.open('GET', jsonfile);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'json';
        xhr.onload = function() {
            console.log("onload, status is", xhr.status);
            if (xhr.status !== 200) {
                console.log("Couldn't load, status was", xhr.status);
                return;
            }
            L.geoJSON(xhr.response).addTo(map);
        };
        xhr.send();
    }

    // jsonfiles was set by some PHP in index.html
    for (var f in jsonfiles) {
        addTrail(jsonfiles[f]);
    }
}

function toggleLayer(name, checked) {
  if (checked)
    map.addLayer(maplayers[name]);
  else
    map.removeLayer(maplayers[name]);
}

