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

  $errstr = "";

  // Read in all available track files, adding metadata if there is any.
  $wheelchairFiles = array();
  $rollatorFiles = array();
  $ableFiles = array();

  // open all .json files in the traildata directory
  foreach (scandir(dirname(__FILE__) . '/traildata/') as $fileinfo) {

      $path_parts = pathinfo($fileinfo);
      if (! array_key_exists("extension", $path_parts))
          continue;
      $ext = strtolower($path_parts['extension']);
      if ($ext !== 'json' && $ext !== 'geojson')
          continue;

      // What access type is it?
      if (str_contains($path_parts['filename'], "wheelchair"))
          array_push($wheelchairFiles, $fileinfo);
      else if (str_contains($path_parts['filename'], "rollator"))
          array_push($rollatorFiles, $fileinfo);
      else
          array_push($ableFiles, $fileinfo);
  }

  // Now write that info into JS that can call Leaflet.
  print("<script>\n");

  print("wheelchairFiles = [\n");
  for ($i=0; $i<sizeof($wheelchairFiles); ++$i)
      print('  "' . $wheelchairFiles[$i] . "\",\n");
  print("];\n");

  print("rollatorFiles = [\n");
  for ($i=0; $i<sizeof($rollatorFiles); ++$i)
      print('  "' . $rollatorFiles[$i] . "\",\n");
  print("];\n");

  print("ableFiles = [\n");
  for ($i=0; $i<sizeof($ableFiles); ++$i)
      print('  "' . $ableFiles[$i] . "\",\n");
  print("];\n");

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

    <h3>Legend</h3>
         <div style="color: magenta">&horbar; Wheelchair accessible</div>
         <div style="color: #44f;">&horbar; Rollator accessible</div>
         <div style="color: red">&horbar; Not accessible</div>

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

    <div class="errors">
<?php
  print($errstr);
?>
    </div>
  </div><!--end of trailmap_bottom-->

</div><!--end of mapcontainer-->


</body>
</html>
