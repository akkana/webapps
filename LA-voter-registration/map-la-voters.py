#!/usr/bin/env python3

import folium
import random
import csv
import json


precinct_data = {}


def colorize(row):
    # Each row is an OrderedDict,
    # keys Precinct,DEMOCRATIC,REPUBLICAN,LIBERTARIAN,OTHER,TOTAL
    # Calculate a shade of purple based on D vs. R
    print("row:", row)
    total = float(row['TOTAL'])
    print("total", total)
    bluefrac = float(row['DEMOCRATIC']) / total
    redfrac  = float(row['REPUBLICAN']) / total
    color = '#%02x%02x%02x' % (int(redfrac * 256), 0, int(bluefrac * 256))
    print("bluefrac =", bluefrac, "redfrac =", redfrac, "-->", color)
    return color


def clean_precinct_number(precinct):
    precinct = int(precinct)
    if precinct not in precinct_data and precinct > 30:
        # The Los Alamos precinct map has some large-numbered entries
        # for precincts that are broken into parts. For instance,
        # 81 and 82 are both precinct 8.
        return precinct // 10
    return precinct


def string_for_precinct(precinct):
    """Make a string for the popup over each precinct.
       precinct_data must already be populated.
    """
    precinct = clean_precinct_number(precinct)
    thisprecinct = precinct_data[precinct]
    return """Precinct:
 %s<br>
Democratic: %d (%d%%)<br>
Republican: %d (%d%%)<br>
Other: %d (%d%%)""" % (
        precinct,
        thisprecinct["DEMOCRATIC"],
        thisprecinct["DEMOCRATIC"] * 100 / thisprecinct["TOTAL"],
        thisprecinct["REPUBLICAN"],
        thisprecinct["REPUBLICAN"] * 100 / thisprecinct["TOTAL"],
        thisprecinct["OTHER"],
        thisprecinct["OTHER"] * 100 / thisprecinct["TOTAL"])


def style_by_precinct(feature):
    precinct = clean_precinct_number(feature['properties']['V_DISTRICT'])
    # if precinct not in precinct_data:
    #     precinct_data[precinct] = random_html_color()
    #     # print("precinct", precinct, "-->", precinct_data[precinct])

    return { 'fillColor': precinct_data[precinct]["color"] }


if __name__ == '__main__':
    # First read in the precinct data
    with open("la-precinct-registration.csv") as csvfp:
        reader = csv.DictReader(csvfp)
        for row in reader:
            p = int(row['Precinct'])
            if p not in precinct_data:
                precinct_data[p] = {}
            for key in row:
                precinct_data[p][key] = int(row[key])
            precinct_data[p]["color"] = colorize(row)
            print(row, "->", precinct_data[p])
    from pprint import pprint
    pprint(precinct_data)

    m = folium.Map(location=[35.86, -106.27], zoom_start=12)

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

    folium.GeoJson(precinct_json,    # 'los_alamos_precincts.json',
                   style_function=style_by_precinct,
                   # highlight_function= lambda feat: {'fillColor': 'red' if feat['properties']['Party'] == "Democrat" else "green"},
                   opacity=1,
                   highlight_function=lambda feat: {'fillColor': "red"},
                   popup=folium.GeoJsonPopup(
                       fields=['featuretxt'],
                       labels=False,
                       aliases=['Precinct']
                   )).add_to(m)

    tooltip = folium.GeoJsonTooltip(fields=['V_DISTRICT'])

    m.save("index.html")
    print("Saved to index.html")

