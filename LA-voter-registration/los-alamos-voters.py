#!/usr/bin/env python3

"""
Parse the horrible NM SoS PDF since they don't make any actual data available.
Then turn it into a more accessible format,
and plot party registration data.

A paste from the NM SoS PDF, from
https://www.sos.nm.gov/voting-and-elections/data-and-maps/voter-registration-statistics/
looks like:

LOS ALAMOS County As of November 30, 2022
PRECINCT DEMOCRATIC REPUBLICAN LIBERTARIAN OTHER TOTAL
PCT 001 325 41
%
257 33 % 11 1 % 194 25
%
787 5 %
PCT 002 251 33
%
311 41 % 11 1 % 183 24

which will be read in to a data line as:
325 41 % 257 33 % 11 1 % 194 25 % 787 5 %

which means:

PCT 001 = Precinct 001
325 Dem   41 %
257 Rep   33 %
 11 Lib    1 %
194 Other 25 %
"""

import re


# Precincts in Los Alamos County:
WHITE_ROCK_PRECINCTS = [ 1, 2, 3, 4, 5, 6, 7, 8 ] # really 71, 72, 82
LOS_ALAMOS_PRECINCTS = [ 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                        21, 22, 23 ]     # 151, 152 are a split of p 15


precincts = {}
partynames = []

# This seems like it should capture 5 non-percentage numbers,
# but apparently re can't capture multiple separated groups (??)
# DATA_RE = re.compile(r'(?(\d+)\s+\d+\s*%\s*){5}')
# So instead, split it up and repeat it five times:
NUMBER_RE = r'(\d+)\s+\d+\s*%\s*'
DATA_RE = re.compile(NUMBER_RE * 5)


def parse_precinct(pct, data):
    precinct = int(pct)
    precincts[precinct] = [ int(x) for x in DATA_RE.match(data).groups() ]


def scrape_voting_records(filename):
    global partynames
    with open(filename) as fp:
        cur_pct = None   # Cur precinct number as a string, 001
        cur_data = ''  # The rest of the line, with space instead of newline
        for line in fp:
            line = line.strip()
            if not line:
                continue

            # Get the header line, which has the party names
            if line.startswith("PRECINCT"):
                partynames = line.split()[1:]

            if line.startswith("PCT"):
                # New precinct. Parse the old one.
                if cur_pct and cur_data:
                    parse_precinct(cur_pct, cur_data)

                # start a new precinct
                words = line.split()
                cur_pct = words[1]
                cur_data = ' '.join(words[2:])
                continue

            if not cur_pct:
                continue

            # There's an active precinct. Add the current line's data to it,
            # without any newline.
            cur_data = ' '.join([ cur_data, line.strip() ])

        # Done with loop, handle the last precinct
        if cur_pct and cur_data:
            parse_precinct(cur_pct, cur_data)

    print()
    from pprint import pprint
    pprint(precincts)
    print("Party names:", partynames)

    # Save to CSV
    outfile = "la-precinct-registration.csv"
    with open(outfile, "w") as outfp:
        print("Precinct,%s" % ','.join(partynames), file=outfp)
        for precinct in sorted(precincts.keys()):
            print("%s,%s" % (precinct,
                             ','.join([str(p) for p in precincts[precinct]])),
                  file=outfp)
        print("Wrote to", outfile)


if __name__ == '__main__':
    scrape_voting_records('voting-records.txt')

    totals = {}

    totals["White Rock"] = [ 0 ] * len(partynames)
    for precinct in WHITE_ROCK_PRECINCTS:
        for i, val in enumerate(precincts[precinct]):
            totals["White Rock"][i] += val

    totals["Los Alamos"] = [ 0 ] * len(partynames)
    for precinct in LOS_ALAMOS_PRECINCTS:
        for i, val in enumerate(precincts[precinct]):
            totals["Los Alamos"][i] += val

    # The printing code is a little tricky because a str % will only
    # take a tuple, not a list, so the partynames list must be
    # converted to a tuple.
    fmtstr = "%11s" + " %12s" * len(partynames)
    print(fmtstr % tuple((" ",) + tuple(partynames)))
    for town in totals:
        allvoters = totals[town][-1]
        totalstrings = [ "%d (%d%%)" % (x, x*100/allvoters)
                         for x in totals[town] ]
        print(fmtstr % tuple([town] + totalstrings))

