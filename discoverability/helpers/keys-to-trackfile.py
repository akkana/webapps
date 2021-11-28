#!/usr/bin/env python3

import csv
import json
import subprocess
import sys, os

CSVFILE = "accessible-trails.csv"

# The field names in the converted CSV
fieldnames = [
    "Name", "Filename", "Ownership", "Rollator", "Wheelchair",
    "Width", "Obstacles", "Slope", "Surface", "Comments"
]

fields_to_show = [ "Name", "Rollator", "Wheelchair", "Obstacles",
                   "Width", "Surface", "Slope", "Comments" ]

def read_trail_data():
    with open(CSVFILE) as infp:
        reader = csv.DictReader(infp)

        return [ traildict for traildict in reader ]

def convert_trackfile(trackfile, traildata):
    trackbase = os.path.basename(trackfile)

    for trailentry in traildata:
        if not trailentry["Filename"]:
            # Probably a category entry, like "BANDELIER HIKES"
            continue

        if trackbase.startswith(trailentry["Filename"]):
            # print("Found a CSV match:", trailentry)

            # Convert to geojson if needed
            if trackfile.endswith(".gpx"):
                jsonfile = trackfile.replace(".gpx", ".geojson")
                subprocess.call(["ogr2ogr", "-f", "GeoJSON",  jsonfile,
                                 trackfile, "tracks"])
                print(f"Converted {trackfile} to {jsonfile}")
                trackfile = jsonfile

            with open(trackfile) as fp:
                trailjson = json.loads(fp.read())

            # Add attributes from CSV into features.properties
            if "features" not in trailjson:
                print("No 'features' in trailentry for", trailjson.keys())
                return

            # Get the first feature
            feature = trailjson["features"][0]

            if "properties" not in feature:
                feature["properties"] = {}

            for key in fields_to_show:
                if not trailentry[key]:
                    continue
                if key in feature["properties"] and \
                   feature["properties"][key]:
                    print(trackfile, "Not overwriting existing", key)
                    continue
                feature["properties"][key] = trailentry[key]

            # Write to file in current directory
            outfile = trackbase
            if outfile.endswith(".gpx"):
                outfile = outfile[:-3] + "geojson"
            if os.path.exists(outfile):
                os.rename(outfile, outfile + ".bak")

            with open(outfile, "w") as outfp:
                print(json.dumps(trailjson, indent=2), file=outfp)
                print("Wrote to", outfile)

            return

        # else:
        #     print("Not", trailentry["Filename"])

    print("Didn't find a CSV entry matching", trackbase)


if __name__ == "__main__":
    traildata = read_trail_data()

    for trackfile in sys.argv[1:]:
        convert_trackfile(trackfile, traildata)

