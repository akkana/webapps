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

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    }

    function fillPopups(trailjson, filename) {
        function prettyname() {
            var pretty = new String(filename)
                .substring(filename.lastIndexOf('/') + 1);
            if (pretty.lastIndexOf(".") != -1)
                pretty = pretty.substring(0, pretty.lastIndexOf("."));
            return pretty;
        }

        for (var i in trailjson.features) {
            var feature = trailjson.features[i];
            if (feature.properties) {
                if (feature.properties.description)
                    feature.properties.popupContent =
                        feature.properties.description;
                else if (feature.properties.name)
                    feature.properties.popupContent = feature.properties.name;
                else
                    feature.properties.popupContent = prettyname();
            } else {
                console.log("Feature without properties in", filename);
                feature.properties = { 'popupContent': prettyname() };
            }
        }
    }

    function addTrail(jsonfile) {
        // Load a trail using ajax. https://gis.stackexchange.com/a/251184
        let xhr = new XMLHttpRequest();
        xhr.open('GET', jsonfile);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'json';
        xhr.onload = function() {
            if (xhr.status !== 200) {
                console.log("Couldn't load", jsonfile,
                            "status was", xhr.status);
                return;
            }
            fillPopups(xhr.response, jsonfile);
            L.geoJSON(xhr.response,
                      { onEachFeature: onEachFeature }).addTo(map);
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

