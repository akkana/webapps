# Discoverability

This is part of the Pajarito Environmental Education Center (PEEC)
"Discoverability" effort to catalog the accessibility of our local
trails in Los Alamos County, NM.






Convert GPX to geojson:

```
gpsbabel -i gpx -f filename.gpx -o geojson -F filename.geojson
```

or convert multiple files in zsh:

```
foreach fil (*.gpx)
  gpsbabel -i gpx -f $fil  -o geojson -F $fil:t:r.geojson
end

```

