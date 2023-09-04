This is a Python/folium app that generates a red-blue map of registrations
by major party Los Alamos, NM, USA voting precincts.

There are two stages:

Data:

I haven't found a good source for voter registration data in an
easily machine-readable format. The NM Secretary of State website has
https://www.sos.nm.gov/voting-and-elections/data-and-maps/voter-registration-statistics/
which has links to registration data in PDF format. If you copy that
and paste it as a text file named voting-records.txt, the script
*los-alamos-voters.py* parses that text-pasted-from-PDF and turns it
into the CSV *la-precinct-registration.csv*.

Mapping:

I happened to have shapefiles for the county's voting precincts that I
got from County GIS. But if you don't have that, precinct shapefiles for
US counties are generally very easy to find.

Folium doesn't read shapefiles (and really, who wants to? GeoJSON is
so much friendlier), so I translated the shapefile to GeoJSON with:
```
ogr2ogr -t_srs EPSG:4326 -f GeoJSON los_alamos_precincts.json ../losalamos-20230802/los_alamos_voting_precincts.shp
```

Then the script *map-la-voters.py* reads *la-precinct-registration.csv*
and *los_alamos_precincts.json* and uses folium to generate a choropleth
map color-coded as redder or bluer.

The first version of map-la-voters.py used `folium.GeoJson` and a styling
function, but the colors were hard to evaluate because they were too
transparent so the colors from the basemap bled through.

There doesn't seem to be any way to control the opacity of a
`folium.GeoJson` map, so later versions of the script use a
`folium.Choropleth` map which does allow setting opacity.
(That also added a dependency on pandas.)
However, the script overrides the built-in color `RdBu_r` gradient
(red to blue, but reversed so it's really blue to red)
for a custom color styling function like the on used in the
`folium.GeoJson` version, so that it could balance the colors:
a district that's evenly divided between Republican and Democrat
should be an even purple.

The live map can be viewed at:
https://shallowsky.com/LA-voter-registration/
