<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>Discoverability: Accessible Trails around Los Alamos</title>

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link rel="stylesheet" href="css/mapstyle.css" />

<link rel="stylesheet" href="leaflet/leaflet.css" />

<script src="leaflet/leaflet.js"></script>

<?php
    print("<script>\n");
    print("jsonfiles = new Array(\n");
    // open all .json files in the traildata directory
    foreach (scandir(dirname(__FILE__) . '/traildata/')
             as $fileinfo) {
        $path_parts = pathinfo($fileinfo);
        if (! array_key_exists("extension", $path_parts))
            continue;
        $ext = strtolower($path_parts['extension']);
        if ($ext !== 'json' && $ext !== 'geojson')
            continue;
        print("    \"traildata/" . $path_parts['filename']
              . "." . $path_parts['extension'] . "\",\n");
    }
    print(");\n");
    print("</script>\n");
?>


<!-- The code that uses leaflet to show the map -->
<script src="js/map-leaflet.js"></script>



</head>

<body onLoad="javascript:init_trailmap();">

<h1>Discoverability: Accessible Trails around Los Alamos</h1>

<noscript>
The interactive trail map requires Javascript.
</noscript>

<div id="mapcontainer">
  <div id="trailmap_leftbox">

    <h3 class="trailmap_h3">Show/hide:</h3>

    <div id="trail_chooser">
      <input name="kmlfiles" type="checkbox" value="somevalue" checked
       onclick="toggleLayer('layername', this.checked);">Something</a>
    </div>

  </div><!--end of trailmap_leftbox-->

  <div id="map-canvas"></div>

  <div id="trailmap_bottom">

    <h2>Other information</h2>
    <p>
    <a href="WhatisanAccessibleTrail.html">What Is an Accessible Trail?</a>

  </div><!--end of trailmap_bottom-->

</div><!--end of mapcontainer-->


</body>
</html>
