var maplayers = {
};
var map;

function init_trailmap() {
    map = new L.Map('map-canvas').setView([35.84, -106.33], 12);;

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

        // Try to get trail info from the CSV first:
        if (traildata[filename]) {
            function addFeatureToPopup(prop) {
                if (traildata[filename][prop])
                    popup += "<b>" + prop + "</b>: "
                        + traildata[filename][prop] + "<br>";
            }
            var popup = "";
            addFeatureToPopup("Trail Name");
            addFeatureToPopup("name");
            addFeatureToPopup("Miles");
            addFeatureToPopup("Trail Surface");
            addFeatureToPopup("Obstacles");
            addFeatureToPopup("Accessible");
            addFeatureToPopup("Not Accessible");
            trailjson.features[0].properties.popupContent = popup;
        } else {
            console.log("No DB entry for", filename);
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
                    //feature.properties = { 'popupContent': prettyname() };
                    feature.properties.popupContent = prettyname();
                }
            }
        }
    }

    function addTrail(jsonfile, popupstr) {
        //console.log("addTrail", jsonfile);

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
            fillPopups(xhr.response, jsonfile, popupstr);
            L.geoJSON(xhr.response,
                      { onEachFeature: onEachFeature }).addTo(map);
        };
        xhr.send();
    }

    // traildata was set by some PHP in index.html.
    // It's a dictionary: here's the arcane ECMAscript 2017
    // incancation to loop over it.
    //console.log("traildata:");
    //console.log(traildata);
    for (const [key, value] of Object.entries(traildata)) {
        addTrail(key, value);
    }
}

function toggleLayer(name, checked) {
  if (checked)
    map.addLayer(maplayers[name]);
  else
    map.removeLayer(maplayers[name]);
}

