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

  // Read in the the spreadsheet.
  // code from https://gist.github.com/benbalter/3173096

  $csvfile = 'traildata/accessible-trails.csv';
  $alltraildata = array();
  $errstr = "";
  try {
      $lines = explode( "\n", file_get_contents($csvfile) );
      $headers = str_getcsv( array_shift( $lines ) );
      foreach($lines as $line) {

          $row = array();

          foreach ( str_getcsv( $line ) as $key => $field )
              $row[ $headers[ $key ] ] = $field;

          $row = array_filter( $row );

          $alltraildata[] = $row;
      }

      // print_r($alltraildata);

  } catch (Exception $e) {
    // no extra spreadsheet metadata
    $errstr = $csvfile . " not found: " . $e->getMessage();
    print("errstr: " . $errstr);
  }

  // Keys from the CSV as read in by PHP will have to be turned
  // into keys in a JavaScript object, like this:
  function keyToJS($key, $phpobj) {
      if (array_key_exists($key, $phpobj))
          print("    '" . $key . "': '" .$phpobj[$key] . "',\n");
  }

  // Read in all available track files, adding metadata if there is any.
  print("<script>\n");
  print("traildata = {\n");

  // open all .json files in the traildata directory
  foreach (scandir(dirname(__FILE__) . '/traildata/') as $fileinfo) {

      $path_parts = pathinfo($fileinfo);
      if (! array_key_exists("extension", $path_parts))
          continue;
      $ext = strtolower($path_parts['extension']);
      if ($ext !== 'json' && $ext !== 'geojson')
          continue;

      // Now add the dictionary of values.

      // Is it in the spreadsheet?
      // print("//////// Looking for " . $path_parts['filename'] . "\n");
      $curdata = null;
      foreach($alltraildata as $traildata) {
          if (array_key_exists('Filename', $traildata)) {
              if ($traildata["Filename"] === $path_parts['filename']) {
                  // Found a match: $traildata describes this track file.
                  $curdata = $traildata;
                  //print("// **** Found " . $traildata["Filename"] . "\n");
                  break;
              }
          }
      }

      // Was it found?
      if ($curdata) {
          print("  'traildata/" . $path_parts['basename'] . "': {\n");

          // add other parameters
          keyToJS("Name", $curdata);
          keyToJS("Rollator", $curdata);
          keyToJS("Wheelchair", $curdata);
          keyToJS("Obstacles", $curdata);
          keyToJS("Surface", $curdata);
          keyToJS("Comments", $curdata);
          print("  },\n");

      } else {
          // print("// ignoring " . $path_parts['filename'] . "',\n");
      }
  }
  print("};\n");
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

    <div class="errors">
<?php
  print($errstr);
?>
    </div>
  </div><!--end of trailmap_bottom-->

</div><!--end of mapcontainer-->


</body>
</html>
