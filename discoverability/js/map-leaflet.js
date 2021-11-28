/* -*- Mode: JavaScript; indent-tabs-mode: nil; js-indent-level: 4 -*- */

var maplayers = {
};

var map;

// Map colors
var wheelchairColor = "#0f0";
var rollatorColor = "blue";
var ableColor = "red";
var selectedColor = "magenta";

/* For the autocomplete input field */
var trailnames = [];

var lastSelectedLayer = null;

function getTrailStyle(accesstype) {
    // console.log("getTrailStyle", trailJSON);
    // All features in a file must have the same accesstype,
    // since they'll all be shown in the same layer.
    if (accesstype.indexOf("wheelchair") >= 0)
        return { "color": wheelchairColor };
    if (accesstype.indexOf("rollator") >= 0)
        return { "color": rollatorColor };
    return { "color": ableColor };

    // It might also be possible to highlight trails on mouseover:
    // https://stackoverflow.com/questions/36614071/leaflet-highlight-marker-when-mouseover-with-different-colors
}

function init_trailmap() {
    map = new L.Map('map-canvas').setView([35.84, -106.3], 12);;

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

    PROPERTIES = [ "Name", "Rollator", "Wheelchair",
                   "Obstacles", "Surface", "Slope", "Comments" ];

    function fillPopups(trailjson, filename) {
        // Define a popup for a GeoJSON file.
        // trailjson is the JSON read from the file, which will
        // be passed to L.geoJSON().
        // console.log("fillPopups for", filename, ":", trailjson);

        function prettyname() {
            var pretty = new String(filename)
                .substring(filename.lastIndexOf('/') + 1);
            if (pretty.lastIndexOf(".") != -1)
                pretty = pretty.substring(0, pretty.lastIndexOf("."));
            return pretty;
        }

        function popupFor(feature) {
            var props = feature.properties;
            var popup = "";
            if (props) {    // this should always exist
                for (pi in PROPERTIES) {
                    if (props[PROPERTIES[pi]]) {
                        popup += PROPERTIES[pi] + ": " + props[PROPERTIES[pi]]
                            + "<br>";
                        // console.log(PROPERTIES[pi],
                        //             "->", props[PROPERTIES[pi]]);
                    }
                    // else console.log("no", PROPERTIES[pi], "in", filename,
                    //                  props);
                }
            }
            return popup;
        }

        // Now add the popup to all the features in this layer.
        for (fi in trailjson.features) {
            var popup = popupFor(trailjson.features[fi]);
            if (! popup)
                popup = popupFor(trailjson.features[0]);
            if (! popup)
                popup = prettyname();
            trailjson.features[fi].properties.popupContent = popup;
        }
    }

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    }

    function addTrailLayer(jsonfile, popupstr, accesstype) {
        // Load a trail using ajax. https://gis.stackexchange.com/a/251184
        let xhr = new XMLHttpRequest();
        xhr.open('GET', jsonfile);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.responseType = 'json';
        xhr.onload = function() {
            if (xhr.status !== 200) {
                console.log("Couldn't load", xhr.responseURL,
                            "status was", xhr.status);
                return;
            }

            var trailJSON = xhr.response;
            console.log("*** Loaded", jsonfile, trailJSON);

            trailnames.push(trailJSON.features[0].properties.Name);

            for (fi in trailJSON.features) {
                // console.log("Adding access to",
                //             trailJSON.features[fi].properties);
                if (trailJSON.features[fi].properties)
                    trailJSON.features[fi].properties.access = accesstype;
                else
                    trailJSON.features[fi].properties
                    = { "access": accesstype };
            }
            // console.log("now trailJSON:", trailJSON);

            fillPopups(trailJSON, jsonfile);

            var layer = L.geoJSON(
                trailJSON,
                {
                    filter: function(feature) {
                        // Return true if we should be showing this accesstype
                        if (feature.properties.access &&
                            feature.properties.access.indexOf("rollator") >= 0)
                            return true;
                        return true;
                    },

                    // setting style here makes it ignore the onEachFeature.
                    // style: getTrailStyle },

                    // onEachFeature sets the popup content
                    onEachFeature: onEachFeature
                }
            );

            layer.access = trailJSON.features[0].properties.access;
            layer.properties = trailJSON.features[0].properties;

            // Another way to set style, which doesn't override onEachFeature
            layer.setStyle(getTrailStyle(layer.access));

            layer.addTo(map);
        };
        xhr.send();
    }

    var i;
    for (i in wheelchairFiles)
        addTrailLayer("traildata/" + wheelchairFiles[i],
                      "popup string",
                      "wheelchair");
    for (i in rollatorFiles)
        addTrailLayer("traildata/" + rollatorFiles[i],
                      "popup string",
                      "rollator");
    for (i in ableFiles)
        addTrailLayer("traildata/" + ableFiles[i],
                      "popup string",
                      "able");

    // traildata was set by some PHP in index.html.
    // It's a dictionary: here's the arcane ECMAscript 2017
    // incancation to loop over a dictionary.
    /*
      for (const [key, value] of Object.entries(rollatorFiles)) {
      addTrailLayer(key, value);
      }
    */
}

function unhighlightTrail() {
    if (lastSelectedLayer) {
        lastSelectedLayer.setStyle(getTrailStyle(lastSelectedLayer.access));
    }
    lastSelectedLayer = null;
}

function highlightTrail() {
    var trailname = document.getElementById("searchTrailInput").value;
    // console.log("Looking for the layer matching:", trailname);
    // console.log("Map:", map);
    // console.log("layers", map._layers, "length", map._layers.length);

    unhighlightTrail();

    // Leaflet wants you to loop over layers like this:
    // map.eachLayer(function(layer) {
    // but there's no way to break out of that loop.
    for (var i in map._layers) {
        var layer = map._layers[i];
        try {
            if (layer.properties.Name == trailname) {
                // path styling options are documented here:
                // https://leafletjs.com/reference-1.0.3.html#path
                layer.setStyle({ "color": selectedColor });
                lastSelectedLayer = layer;
                document.getElementById("selectedLegend").style.visibility
                    = "visible";
                return;
            }
        } catch {
        }
    }
    console.log("Didn't find a layer matching", trailname);
}

// When the user searches for a trail by name
function toggleLayer(name, checked) {
    if (checked)
        map.addLayer(maplayers[name]);
    else
        map.removeLayer(maplayers[name]);
}

/* Wait a few seconds before loading autocomplete */
setTimeout(function () {
    // console.log("Initializing autocomplete with", trailnames);
    autocomplete(document.getElementById("searchTrailInput"), trailnames);
}, 2000);
