<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">

<?php
/*
   Search for JSON data files in a directory called "data" below current.
   For any of those, look for the "DIST" property, and color/style
   accordingly.
   Sample Usage: ?map=US_Congress assuming there's data/US_Congress.json.
 */

if (isset($_GET['map']))
    $dataset = $_GET['map'];
else
    $dataset = NULL;

if (! empty($dataset)) {
    $datafilename = 'data/' . $dataset . '.json';
    if (file_exists($datafilename)) {
        $setname = str_replace('_', ' ', $dataset);
        $json_content = file_get_contents($datafilename);
        $title = $setname . " Districts";
    }
    else {
        $json_content = NULL;
        $setname = "";
        $title = "New Mexico Voting Districts";
    }
  }
  else {
    $title = "District Maps";
    $setname = "";
    $json_content = NULL;
  }

  require ($_SERVER['DOCUMENT_ROOT'] . "/php/banner.php");
  require ($_SERVER['DOCUMENT_ROOT'] . "/php/sidebar.php");
?>

<link rel="stylesheet" href="/css/leaflet.css">

<script src="js/leaflet.js"></script>

<style type="text/css">
#mmmapid { position:absolute; top:0; bottom:0; right:0; left:0;}

#mapid { height: 670px; width: 98%; }

.leaflet-popup-content { font-size: 1.3em; }
.leaflet-tooltip { font-size: 1.3em; }
</style>

</head>

<body>

<?php

// Buttons for all the map data available
echo "View districts: ";
foreach (scandir(dirname(__FILE__) . '/data') as $fileinfo) {
    $path_parts = pathinfo($fileinfo);
    if (strtolower($path_parts['extension']) !== 'json')
        continue;

    $prettyname = str_replace('_', ' ', $path_parts['filename']);
    $buttonclass = 'buttonlike';
    if ($prettyname === $setname)
        $buttonclass .= ' button_inactive';
    echo '<a class="' . $buttonclass . '" href="?map='
         . $path_parts['filename']
         . '">' . $prettyname . '</a> ';
}
echo "<p>";

if (empty($json_content)) {
    if (empty($dataset))
        echo "Choose the district map you'd like to see.";
    else
        echo "No map called " . $dataset;
}

?>

<div id="mapid"></div>

<script>

<?php
if (! empty($json_content))
    echo 'var boundaryData = ' . $json_content . ';';
else
    echo 'var boundaryData = {};';
echo 'var setname = "' . $setname . '";';
?>

var mapNM = L.map(
    "mapid",
     {
         center: [34.25, -105.96],
         crs: L.CRS.EPSG3857,
         zoom: 7,
         zoomControl: true,
         preferCanvas: false,
     }
 );

 var tile_layer_OSM = L.tileLayer(
     "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
     {"attribution": "Data by \u0026copy; \u003ca href=\"http://openstreetmap.org\"\u003eOpenStreetMap\u003c/a\u003e, under \u003ca href=\"http://www.openstreetmap.org/copyright\"\u003eODbL\u003c/a\u003e.", "detectRetina": false, "maxNativeZoom": 18, "maxZoom": 18, "minZoom": 0, "noWrap": false, "opacity": 1, "subdomains": "abc", "tms": false}
 ).addTo(mapNM);

 // Don't add subsequent tile layers to the map, only the one that
 // should be the default.
 var tile_layer_stamen = L.tileLayer(
     "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg",
     {"attribution": "Map tiles by \u003ca href=\"http://stamen.com\"\u003eStamen Design\u003c/a\u003e, under \u003ca href=\"http://creativecommons.org/licenses/by/3.0\"\u003eCC BY 3.0\u003c/a\u003e. Data by \u0026copy; \u003ca href=\"http://openstreetmap.org\"\u003eOpenStreetMap\u003c/a\u003e, under \u003ca href=\"http://creativecommons.org/licenses/by-sa/3.0\"\u003eCC BY SA\u003c/a\u003e.", "detectRetina": false, "maxNativeZoom": 18, "maxZoom": 18, "minZoom": 0, "noWrap": false, "opacity": 1, "subdomains": "abc", "tms": false}
 );

 var distcolors = {};
 var colornum = 0;

 // Choose colors according to "golden angle"
 function nextColor() {
     const hue = colornum * 137.508; // use golden angle approximation
     const saturation = Math.random() * 30. + 70.;
     const lightness = Math.random() * 40. + 60.;
     colornum += 1;
     return [ hue, saturation, lightness ];
}

 function geojson_boundaries_styler(feature) {
     if (! (feature.properties.DIST in distcolors))
         distcolors[feature.properties.DIST] = nextColor();
     const hue = distcolors[feature.properties.DIST][0];
     const saturation = distcolors[feature.properties.DIST][1];
     const lightness = distcolors[feature.properties.DIST][1];
     return { "fillColor": `hsl(${hue},${saturation}%,${lightness}%)`,
             "fillOpacity": .4 };
 }

 function geojson_boundaries_highlighter(feature) {
     // Make the highlighted region more saturated, darker, and more opaque
     brightcolor = `hsl(${distcolors[feature.properties.DIST][0]},`
                    + '100%,'
                    + `${distcolors[feature.properties.DIST][2]* .8}%)`;
     return { "fillOpacity": .5,
              "fillColor": brightcolor };
 }

 var popup = L.popup();

 function geojson_boundaries_onEachFeature(feature, layer) {
     if ("NAME" in feature.properties)
         namestr = feature.properties.NAME + "<br>";
     else
         namestr = "";
     layer.bindTooltip(namestr + "District " + feature.properties.DIST);
     layer.on({
         mouseout: function(e) {
             geojson_boundaries.resetStyle(e.target);
         },
         mouseover: function(e) {
             e.target.setStyle(geojson_boundaries_highlighter(e.target.feature));
             e.target.openTooltip();
         },
         /*
         click: function(e) {
             // mapNM.fitBounds(e.target.getBounds());
             popup.setLatLng(e.latlng)
                  .setContent(setname + " District " + feature.properties.DIST)
                  .openOn(mapNM);
         }
         */
     });
 };

 var geojson_boundaries = L.geoJson(boundaryData, {
     onEachFeature: geojson_boundaries_onEachFeature,
     style: geojson_boundaries_styler,
 }).addTo(mapNM);

 var layer_control = {
     base_layers : {
         "OpenStreetMap" : tile_layer_OSM,
         "Stamen Terrain" : tile_layer_stamen,
     },
     overlays :  {
         "Districts" : geojson_boundaries,
     },
 };

 L.control.layers(
     layer_control.base_layers,
     layer_control.overlays,
     {"autoZIndex": true, "collapsed": true, "position": "topright"}
 ).addTo(mapNM);

</script>

<h2>Data and Credits</h2>
<p>
Our interactive maps were made with
<a href="https://leafletjs.com/">Leaflet</a>
and <a href="https://gdal.org/">GDAL</a>;
the background map uses
<a href="https://www.openstreetmap.org/">OpenStreetMap map</a>.
<p>
Download the <a href="data/">data for New Mexico voting districts</a>
used for these maps, in GeoJSON format.

</body>
</htmlp>
