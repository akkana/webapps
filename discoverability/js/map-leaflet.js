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

    function fillPopups(trailjson, filename) {
        console.log("fillPopups for", filename);

        function prettyname() {
            var pretty = new String(filename)
                .substring(filename.lastIndexOf('/') + 1);
            if (pretty.lastIndexOf(".") != -1)
                pretty = pretty.substring(0, pretty.lastIndexOf("."));
            return pretty;
        }

        // Try to get trail info from the CSV first:
        if (traildata[filename]) {
            function addAttrToPopup(prop) {
                if (traildata[filename][prop])
                    popup += "<b>" + prop + "</b>: "
                        + traildata[filename][prop] + "<br>";
            }

            var popup = "";
            addAttrToPopup("Name");
            addAttrToPopup("name");
            // addAttrToPopup("Miles");
            addAttrToPopup("Obstacles");
            addAttrToPopup("Surface");
            addAttrToPopup("Slope");
            addAttrToPopup("Comments");
            console.log("popup will be:", popup, "for",
                        trailjson.features.length, "features");

            // trailjson.features[0].properties.popupContent = popup;
            for (fid in trailjson.features) {
                trailjson.features[fid].properties.popupContent = popup;
            }

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
                    // feature.properties = { 'popupContent': prettyname() };
                    feature.properties.popupContent = prettyname();
                }
            }
        }
    }

    function getTrailStyle(trailJSON) {
        // console.log("getTrailStyle:", trailJSON);
        return { "color": "purple" };

        // It might also be possible to highlight trails on mouseover:
        // https://stackoverflow.com/questions/36614071/leaflet-highlight-marker-when-mouseover-with-different-colors
    }

    function onEachFeature(feature, layer) {
        console.log("onEachFeature", feature);

        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.popupContent) {
            console.log("Binding a popup");
            layer.bindPopup(feature.properties.popupContent);
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
            var trailJSON = xhr.response;
            var layer = L.geoJSON(
                trailJSON,

                // setting style here makes it ignore the onEachFeature.
                // { style: getTrailStyle },

                // onEachFeature sets the popup content
                { onEachFeature: onEachFeature }
            );

            // Another way to set style, which doesn't override onEachFeature
            layer.setStyle(getTrailStyle(trailJSON));

            layer.addTo(map);
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

