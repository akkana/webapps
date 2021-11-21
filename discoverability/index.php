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

      # The filename is the key
      print("  'traildata/" . $path_parts['basename'] . "': {\n");

      // Now add the dictionary of values.

      // Is it in the spreadsheet?
      // print("//////// Looking for " . $path_parts['filename'] . "\n");
      $curdata = null;
      foreach($alltraildata as $traildata) {
          if (array_key_exists('Filename', $traildata)) {
              if ($traildata["Filename"] === $path_parts['filename']) {
                  $curdata = $traildata;
                  //print("// **** Found " . $traildata["Filename"] . "\n");
                  break;
              }
              /*
              else
                  print("  // " . $traildata["Filename"] .  ' != '
                        . $path_parts['filename']
                        . "\n");
          }
          else {
              print("//  No filename key in:\n");
              print_r($traildata);
               */
          }
      }

      // Was it found?
      if ($curdata) {
          /*
          if (array_key_exists('Trail Name', $curdata))
              print("    'name': '" .$curdata["Trail Name"] . "',\n");
          else
              print("    'name': '" . $path_parts['filename'] . "',\n");
          if (array_key_exists('Miles', $curdata))
              print("    'miles': '" . $curdata["Miles"] . "',\n");
              */

          // add other parameters
          keyToJS("Trail Name", $curdata);
          keyToJS("Miles", $curdata);
          keyToJS("Accessible", $curdata);
          keyToJS("Not Accessible", $curdata);
          keyToJS("Obstacles", $curdata);
          keyToJS("Trail Surface", $curdata);

      } else {
          print("    'name': '" . $path_parts['filename'] . "',\n");
      }
      print("  },\n");
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
