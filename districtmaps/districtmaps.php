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

/*
function startsWith($haystack, $needle)
{
     $length = strlen($needle);
     return (substr($haystack, 0, $length) === $needle);
}
*/

// Calculate setname (data file path) and title
if (! empty($dataset)) {
    $datafilename = 'data/' . $dataset . '.json';
    if (file_exists($datafilename)) {
        $GLOBALS["setname"] = str_replace('_', ' ', $dataset);
        $json_content = file_get_contents($datafilename);
        $title = basename($GLOBALS["setname"]);

        $title = $title . " Districts";
    }
    else {
        $json_content = NULL;
        $GLOBALS["setname"] = "";
        $title = "Districts";
    }
}
else {
    $title = "District Maps";
    $GLOBALS["setname"] = "";
    $json_content = NULL;
}

$GLOBALS["title"] = $title;
?>

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">

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

<?php

if (empty($json_content)) {
    if (empty($dataset))
        echo "Choose the district map you'd like to see:";
    else
        echo "No map called " . $dataset;
}
echo "<p>";

function buttonrow($subdir, $buttonclass) {
    // PHP <5.4 can't do function dereferencing, so use an intermediate var:
    $mapinfo = pathinfo($_GET['map']);
    $mapname = $mapinfo['basename'];

    // base path for the data, not a database
    $data_base = dirname(__FILE__) . '/data/';

    // Make a row of buttons for the given directory,
    // plus additional rows for each subdirectory.

    if ($subdir) {
        $datapath = $subdir . '/';
        print(str_replace('_', ' ', $subdir) . ":");
    } else {
        $datapath = '';
        print("Statewide districts: ");
    }
    print(PHP_EOL);

    if ($buttonclass === "select") {
        print('<select class="districtsel" name="select_'
              . $subdir . '" id="select_' . $subdir
              . '" onchange="selectChange(\'' . $subdir . '\')">');
        print(PHP_EOL);
        print('  <option value="none"> </option>');
        print(PHP_EOL);
    }

    $savedirs = array();
    $curpretty = "";
    foreach (scandir($data_base . $datapath) as $fileinfo) {
        if ($fileinfo[0] == '.')
            continue;

        $fullpath = $data_base . $datapath . $fileinfo;
        if (is_dir($fullpath)) {
            array_push($savedirs, $datapath . $fileinfo);
            continue;
        }

        $path_parts = pathinfo($fileinfo);
        if (! array_key_exists("extension", $path_parts))
            continue;
        if (strtolower($path_parts['extension']) !== 'json')
            continue;

        $prettyname = str_replace('_', ' ', $path_parts['filename']);
        $thisbuttonclass = $buttonclass;
        if ($prettyname === $curpretty) {
            $thisbuttonclass .= ' button_inactive';
            //error_log($prettyname . " is inactive");
        }

        // I don't know any better way to get the tilde back in Dona Ana;
        // SWCP doesn't support nonascii characters in filenames.
        if ($prettyname === "Dona Ana Co")
            $prettyname = "Do&ntilde;a Ana Co";

        if ($buttonclass === "select") {
            if ($mapname == $path_parts['filename'])
                $is_sel = " selected";
            else
                $is_sel = "";
            print('  <option value="' . $path_parts['filename'] . '"'
                  . $is_sel . '>'
                  . $prettyname . '</option>');
        }
        else {
            print('<a class="' . $thisbuttonclass . '" href="?map='
                               . $datapath . $path_parts['filename']
                               . '">' . $prettyname . "</a>");
        }
        print(PHP_EOL);
    }
    if ($buttonclass === "select") {
        print("</select>");
    }

    if ($savedirs)
        print("<p>");

    foreach ($savedirs as $savedir) {
        print(PHP_EOL);
        buttonrow($savedir, "select");
    }
}

// Buttons for all the map data available
buttonrow('', 'buttonlike');
echo PHP_EOL;
echo "<p>";
print PHP_EOL;

?>

<div id="mapid"></div>

<script>

function selectChange(whichdir) {
    cururl = location.protocol + '//' + location.host + location.pathname;

    var selectname = "select_" + whichdir;
    var select = document.getElementById(selectname);
    var selectedValue = select.options[select.selectedIndex].value;
    if (selectedValue == "none") {
        window.location = cururl;
        return;
    }

    // Get the current URL without query string parameters
    newurl = cururl + "?map=" + whichdir + '/' + selectedValue;
    window.location = newurl;
}

<?php
if (! empty($json_content))
    echo 'var boundaryData = ' . $json_content . ';';
else
    echo 'var boundaryData = {};';
echo 'var setname = "' . $GLOBALS["setname"] . '";';
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
     // A tooltip is the easiest way to show something on mouseover;
     // but it's bound to the center of the object, and if that's
     // offscreen, the tooltip will be too.
     //layer.bindTooltip(namestr + "District " + feature.properties.DIST);
     layer.on({
         mouseout: function(e) {
             geojson_boundaries.resetStyle(e.target);
         },
         /*
            Mouseover disabled because it's super annoying:
            it tries to bring up the popup in the center of the region,
            which might be out of the window, in which case it pans
            and even zooms to somewhere else, and then even after all
            that, the popup may not come up over the right region.
            The click function works much better.
         mouseover: function(e) {
             // e.target.setStyle(geojson_boundaries_highlighter(e.target.feature));
             // e.target.openTooltip();

             // .setLatLng(e.latlng) will set it to the mouse coordinates,
             // which is on the edge of the feature.
             popup.setLatLng(e.target.getBounds().getCenter())
                  .setContent(setname + " District " + feature.properties.DIST)
                  .openOn(mapNM);
         },
         */
         click: function(e) {
             // mapNM.fitBounds(e.target.getBounds());
             popup.setLatLng(e.latlng)
                  .setContent(setname + " District " + feature.properties.DIST)
                  .openOn(mapNM);
         }
     });
 };

 /* You can use this to make the map pan when you click,
    but it's pretty annoying and not recommended.
 mapNM.on('popupopen', function(e) {
     console.log("popupopen");
    var px = mapNM.project(e.target._popup._latlng); // find the pixel location on the map where the popup anchor is
    px.y -= e.target._popup._container.clientHeight/2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
    mapNM.panTo(mapNM.unproject(px),{animate: true}); // pan to new center
});
  */

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
Source code for the map viewer:
<a href="https://github.com/akkana/webapps/tree/master/districtmaps">districtmap</a>,
which in turn uses <a href="https://leafletjs.com/">Leaflet</a>
Data files were processed with <a href="https://gdal.org/">GDAL</a>.
the background map uses
<a href="https://www.openstreetmap.org/">OpenStreetMap data</a>.
<p>
Download the <a href="data/">data for New Mexico voting districts</a>
used for these maps, in GeoJSON format.

</body>
</htmlp>
