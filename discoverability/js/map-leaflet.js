var maplayers = {
};
var map;

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
        console.log("fillPopups for", filename, ":", trailjson);

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
                        console.log(PROPERTIES[pi],
                                    "->", props[PROPERTIES[pi]]);
                    }
                    else console.log("no", PROPERTIES[pi], "in", filename,
                                     props);
                }
            }
            return popup;
        }

        // Now add the popup to all the features in this layer.
        for (fi in trailjson.features) {
            console.log("Getting popup for", trailjson.features[fi]);
            var popup = popupFor(trailjson.features[fi]);
            if (! popup)
                popup = popupFor(trailjson.features[0]);
            if (! popup)
                popup = prettyname();
            trailjson.features[fi].properties.popupContent = popup;
        }
    }

    function getTrailStyle(trailJSON) {
        console.log("getTrailStyle", trailJSON);
        // All features in a file must have the same accesstype,
        // since they'll all be shown in the same layer.
        var accesstype = trailJSON.features[0].properties.access;
        console.log("access", accesstype);
        if (accesstype == "rollator")
            return { "color": "#44f" };
        if (accesstype == "wheelchair")
            return { "color": "magenta" };
        return { "color": "red" };

        // It might also be possible to highlight trails on mouseover:
        // https://stackoverflow.com/questions/36614071/leaflet-highlight-marker-when-mouseover-with-different-colors
    }

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
    }

    function addTrailLayer(jsonfile, popupstr, accesstype) {
        console.log(":::::: addTrailLayer:", jsonfile,
                    ": accesstype=", accesstype);

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
            console.log("*** Loaded file", jsonfile, xhr, trailJSON);

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
                        console.log("filtered feature properties:",
                                    feature.properties);

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

            // Another way to set style, which doesn't override onEachFeature
            layer.setStyle(getTrailStyle(trailJSON));

            layer.access = "rollator,wheelchair";

            console.log("Created GeoJSON layer", layer);

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
    // incancation to loop over it.
    /*
    for (const [key, value] of Object.entries(rollatorFiles)) {
        addTrailLayer(key, value);
    }
    /*
    addTrailLayer("traildata/wheelchair.json");
    addTrailLayer("traildata/rollator.json");
    */
}

function toggleLayer(name, checked) {
  if (checked)
    map.addLayer(maplayers[name]);
  else
    map.removeLayer(maplayers[name]);
}

