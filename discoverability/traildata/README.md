# Accessibility Trail Data

The list of trails and their properties is in *accessible-trails.csv*.

The map uses GeoJSON files for the trails it displays.
The GeoJSON for a trail should specify each segment's accessibility:
this is used to colorize trail segments on the map.
An example of how to do this is in the file *SR4.geojson*.

If you have GPX track files, convert them to GeoJSON as follows:

## Convert GPX to geojson:

```
ogr2ogr -f GeoJSON file.geojson file.gpx tracks
```

or convert multiple files (using zsh syntax):

```
foreach fil (*.gpx)
  ogr2ogr -f GeoJSON$fil:t:r.geojson  $fil tracks
end

```

