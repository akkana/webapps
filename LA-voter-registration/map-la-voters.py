#!/usr/bin/env python3

import folium
import pandas as pd
import csv
import json


precinct_data = {}   # the modified geojson data
pdata = None         # the pandas dataframe from the CSV file

# Max/min percents for the major parties (to scale the colormap)
max_percent = None
min_percent = None


def clean_precinct_number(precinct):
    precinct = int(precinct)
    if precinct not in precinct_data and precinct > 30:
        # The Los Alamos precinct map has some large-numbered entries
        # for precincts that are broken into parts. For instance,
        # 81 and 82 are both precinct 8.
        return precinct // 10
    return precinct


if __name__ == '__main__':

    m = folium.Map(location=[35.86, -106.27], zoom_start=12)

    # Read in the registration data to a pandas dataframe
    pdata = pd.read_csv("la-precinct-registration.csv")

    # Make colums for percentages
    pdata['R_PCT'] = pdata['REPUBLICAN'] * 100 / pdata['TOTAL']
    pdata['D_PCT'] = pdata['DEMOCRATIC'] * 100 / pdata['TOTAL']
    pdata['O_PCT'] = pdata['OTHER'] * 100 / pdata['TOTAL']

    # Make a column the choropleth will use.
    # Red is positive, blue is negative.
    # XXX But how do we make zero come out in the middle,
    # so it will have a neutral color?
    pdata['bluered'] = pdata['R_PCT'] - pdata['D_PCT']

    # What's the maximum partisanship percent for either party?
    # For use in scaling.
    max_percent = max(pdata['D_PCT'].max(), pdata['R_PCT'].max())
    min_percent = min(pdata['D_PCT'].min(), pdata['R_PCT'].min())

    def string_for_precinct(precinct):
        """Make a string for the popup over each precinct.
           pdata is the datafrom from the CSV file.
        """
        precinct = clean_precinct_number(precinct)
        thisprecinct = pdata[pdata["Precinct"] == precinct]

        return """Precinct:
     %s<br>
    Democratic: %d (%d%%)<br>
    Republican: %d (%d%%)<br>
    Other: %d (%d%%)<br>
    blue-red index: %d""" % (
            precinct,
            thisprecinct["DEMOCRATIC"], thisprecinct["D_PCT"],
            thisprecinct["REPUBLICAN"], thisprecinct["R_PCT"],
            thisprecinct["OTHER"], thisprecinct["O_PCT"],
            thisprecinct["bluered"])

    # Read in the JSON defining the precincts.
    # You can pass a filename to folium.GeoJson,
    # but then there's no way to control what shows up in the popup.
    # Apparently a GeoJsonPopup can only show something that's a
    # field in the JSON.
    with open("los_alamos_precincts.json") as fp:
        precinct_json = json.load(fp)
        for feature in precinct_json["features"]:
            if "V_DISTRICT" in feature["properties"]:
                precinct = int(feature["properties"]["V_DISTRICT"])
                feature["properties"]["featuretxt"] = \
                    string_for_precinct(precinct)

    cp = folium.Choropleth(
        geo_data=precinct_json,
        name="Precincts",
        data=pdata,
        columns=["Precinct", "bluered"],
        key_on="feature.properties.V_DISTRICT",
        # see https://en.wikipedia.org/wiki/Cynthia_Brewer#Brewer_palettes
        fill_color="RdBu_r",
        fill_opacity=1, # 0.7,
        line_opacity=0.2,
        legend_name="Bluer or Redder?",
    )

    # Replace the colormap with one that will have a neutral color for zero.
    def redbluestyle(feature):
        """What color should this precinct be?"""
        precinct = clean_precinct_number(feature['properties']['V_DISTRICT'])
        thisprecinct = pdata[pdata["Precinct"] == precinct]
        total = thisprecinct['TOTAL']
        normalize = max_percent - min_percent + 1

        bluefrac = (thisprecinct['D_PCT'] - min_percent) / normalize;
        redfrac  = (thisprecinct['R_PCT']  - min_percent)/ normalize;
        print("percents %2d, %2d; blue, red fracs: %03f, %03f"
              % (thisprecinct['D_PCT'] , thisprecinct['R_PCT'],
                 bluefrac, redfrac))

        color = '#%02x%02x%02x' % (int(redfrac * 256), 0, int(bluefrac * 256))
        print("color for precinct %2d:" % precinct, color)
        print()
        return { 'fillColor': color, 'fillOpacity': .75 }

    cp.geojson.style_function = redbluestyle

    cp.add_to(m)

    folium.GeoJsonPopup(['featuretxt'],
                        aliases=['']).add_to(cp.geojson)

    m.save("enhanced.html")
    print("Saved to enhanced.html")

    # Print out a sorted table of values
    pdata.sort_values(by="bluered", inplace=True)
    for index, thisprecinct in pdata.iterrows():
        print("%4d:   R %2d   D %2d   O %2d  %6d" % (
        thisprecinct['Precinct'],
        100 * (thisprecinct['REPUBLICAN'] / thisprecinct['TOTAL']),
        100 * (thisprecinct['DEMOCRATIC'] / thisprecinct['TOTAL']),
        100 * (thisprecinct['OTHER'] / thisprecinct['TOTAL']),
        thisprecinct["bluered"]))

