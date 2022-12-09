#!/usr/bin/env python3

# Make a query of the JPL HORIZONS API.
# For now, this is for fetching physical ephemeri of Mars
# for use in the MarsMap web app,
# specifically central meridian and tilt (observer sub-longitude & sub-latitude)
# and the north pole position; the parsing hasn't been tested
# for any other quantities.

# Will cache locally, in month-long CSV files containing daily values.

# https://ssd-api.jpl.nasa.gov/doc/horizons.html
# https://ssd.jpl.nasa.gov/horizons/manual.html
# Example query: https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='499'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='2006-01-01'&STOP_TIME='2006-01-20'&STEP_SIZE='1%20d'&QUANTITIES='1,9,20,23,24,29'

import os, sys
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
import requests
import re
from collections import OrderedDict
import argparse
import cgi
import csv


CACHEDIR = os.path.expanduser("~/.config/horizons")
# CGI_CACHEDIR = "/var/www/.cache/horizons"
CGI_CACHEDIR = "./cache"

VERBOSE = False

# format=json is the default, but it isn't really json: it's json containing
# a single quantity, a string that you have to parse, the same string you'd
# get if you specified format=text.
BASEURL = "https://ssd.jpl.nasa.gov/api/horizons.api?format=text"

# List of quantities that can be requested:
# https://ssd.jpl.nasa.gov/horizons/manual.html#obsquan
QUANTITIES = [
    # 1,    # Astrometric RA & DEC: R.A.___(ICRF)___DEC or R.A_(FK4/B1950)_DEC
    # 9,    # Visual magnitude & surface brightness: APmag S-brt  (Non-comet)
    # 10,   # Illuminated fraction: Illu%
    13,   # Target angular diameter: Ang-diam
    14,   # Observer sub-longitude & sub-latitude: ObsSub-LON ObsSub-LAT
    17,   # North pole position angle & distance from disc center: NP.ang NP.ds
    # 35,   # Earth to site light-time: 399_ins_LT
]

# Mapping of planet name to COMMAND parameter numbers.
# List of bodies that can be passed as COMMAND:
# https://ssd.jpl.nasa.gov/api/horizons.api?COMMAND='MB'
# COMMAND='MB' will return a list of current major-bodies and their ID codes.
planets = {
    "moon":    301,
    "mercury": 199,
    "venus":   299,
    "earth":   399,
    "mars":    499,
    "jupiter": 599,
    "saturn":  699,
    "uranus":  799,
    "neptune": 899,
    "pluto":   999
}


def fetch_horizons(body, start, end, date_incr):
    """Fetch daily values from the HORIZONS API.
    Body is a name, like "Mars" (case insensitive).
    start and end are datetimes.
    date_incr is a string horizons recognizes, like "1 d" --
    however, the rest of this script notably the caching) assumes
    daily values and will break if you use anything else, so don't.
    """

    date_incr = date_incr.replace(' ', r'%20')
    url = f"{BASEURL}&COMMAND='{planets[body.lower()]}'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='399'&START_TIME='{start.strftime('%Y-%m-%d')}'&STOP_TIME='{end.strftime('%Y-%m-%d')}'&STEP_SIZE='{date_incr}'&QUANTITIES='{','.join([str(q) for q in QUANTITIES])}'"
    if VERBOSE:
        print("URL:", url)

    try:
        jpltext = requests.get(url).text
        return parse_horizons(jpltext)

    except Exception as e:
        error(f"Couldn't fetch HORIZONS data: {e}")
        error(f"URL was: {url}")
        return None


def parse_horizons(jpltext):
    """Parse the ridiculously chatty text from HORIZONS to extract
       the data lines therein, ignoring the rest.
    """
    prevline = ""
    headers = None
    data = []
    for line in jpltext.splitlines():
        # print(f"line: '{line}'")
        if line.startswith("******************"):
            continue
        if line.startswith("$$EOE"):
            # Done with table, the rest is just chatty text
            return data
        if headers:
            data.append(parse_horizon_line(line, headers))
            continue
        if line.startswith("$$SOE"):
            # print("found the table, hurrah")
            headers = parse_horizon_header_line(lastline)
            continue
        lastline = line
    else:    # Never saw the start line
        error("Never saw the table")
        return None


def parse_horizon_header_line(headerline):
    """Return an OrderedDict of: { 'hdrstr': [start, end] }
    """
    headers = OrderedDict()
    prev_end = 0
    for val in headerline.split(' '):
        # Separators are multiple spaces, so there will be lots of
        # empty values, but that's easy to skip.
        if not val:
            continue
        start = headerline.find(val)
        end = start + len(val)
        headers[val] = [prev_end, end]
        prev_end = end
    return headers


def parse_horizon_line(line, headers):
    retvals = {}
    for val in headers:
        strval = line[headers[val][0]:headers[val][1]].strip()
        # The first value after the date has some extra crap prepended,
        # either '*' or '*m", followed by spaces.
        # I have no idea what it's supposed to mean,
        # but it has to be stripped out.
        m = re.match(r'\*m? +', strval)
        if m:
            strval = strval[m.span()[1]:]
        retvals[val] = strval
    return retvals


def fetch_cache_horizons(body, obstime):
    """Get Mars ephemeris from the cache, fetching it from HORIZONS
       if necessary, and then interpolate between daily values to
       calclate the Central Meridian and Earth Sublongitude
       for the given time.
       (Might eventually return other values, like size and NP angle,
       which are already in the cachefiles.
       Return a dict with keys CM and Earth_sublon.
    """

    day = obstime.date()
    start = date(day.year, day.month, 1)
    end = start + relativedelta(months=1)
    # This means that the first of the next month is saved in the
    # previous month's file, as well as in the next month's file.
    # That's intentional: it will be used to interpolate.

    cachefile = f"{body.lower()}-{day.year:04d}-{day.month:02d}.csv"
    cachepath = os.path.join(CACHEDIR, cachefile)

    dayvals = None
    daystr = day.strftime("%Y-%b-%d 00:00")

    if not os.path.exists(cachepath):
        if not os.path.exists(CACHEDIR):
            if VERBOSE:
                print("Making cache directory")
            os.makedirs(CACHEDIR)

        monthdata = fetch_horizons(body, start, end, "1 d")
        with open(cachepath, 'w') as ofp:
            writer = csv.DictWriter(ofp, fieldnames=monthdata[0].keys(),
                                    lineterminator='\n')
            writer.writeheader()
            for daydata in monthdata:
                writer.writerow(daydata)

        if VERBOSE:
            print("Cached to", cachepath)

    # Now it's cached, so read the cached file
    if VERBOSE:
        print("Reading from cache", cachepath)
    with open(cachepath) as csvfp:
        reader = csv.DictReader(csvfp)
        for row in reader:
            if row['Date__(UT)__HR:MN'] == daystr:
                dayvals = row
                nextdayvals = next(reader)
                break

    if not dayvals:
        error(f"Didn't see Date__(UT)__HR:MN: {daystr} in {cachepath}")
        return None

    # print("dayvals:", dayvals)
    # print("nextdayvals:", nextdayvals)

    # Interpolate between the two days' values to get values
    # for the observation time, assuming everything is close enough
    # to linear within a 24-hour period

    dayfrac = (obstime.second / 60.
               + (obstime.minute / 60.
                  + obstime.hour)) / 24.
    # Central Meridian aka ObsSub-LON:
    # Mars rotates a little less than 360 in an Earth day, about 351.216135,
    # so add 360 before subtracting.
    retvals = { 'obstime': obstime.strftime('%Y-%m-%d %H:%M') }
    retvals['CM'] = interpolate(dayvals['ObsSub-LON'],
                                nextdayvals['ObsSub-LON'],
                                dayfrac, add360=True)
    retvals['Earth_sublon'] = interpolate(dayvals['ObsSub-LAT'],
                                          nextdayvals['ObsSub-LAT'],
                                          dayfrac)
    return retvals


def interpolate(val1, val2, dayfrac, add360=False):
    val1 = float(val1)
    val2 = float(val2)
    add = 360 if add360 else 0
    retval = val1 + (val2 + add - val1) * dayfrac
    if add360:
        retval %= 360
    return retval


def parse_args():
    parser = argparse.ArgumentParser(description="Fetch JPL HORIZONS data")
    parser.add_argument('-t', "--time", dest="date", default=None,
                        help="date, YYYY-MM-DD HH:MM, defaults to current time",
                        type=lambda s: datetime.strptime(s, '%Y-%m-%d %H:%M'))
    parser.add_argument('-b', action="store", default='Mars', dest="body",
                        help='body (default=Mars)')
    args = parser.parse_args(sys.argv[1:])
    return args.body, args.date


def parse_cgi():
    form = cgi.FieldStorage()

    print("Parsing CGI", form, file=sys.stderr)

    print("Content-type: text/plain\n")

    try:
        if 'body' in form:
            body = form['body'].value.lower
        else:
            body = 'mars'

        # For the CGI, all dates are interpreted as UT
        # since we don't know the requester's timezone.
        if 'obstime' in form:
            obstime = datetime.strptime(form['obstime'].value,
                                        '%Y-%m-%d %H:%M')
        else:
            obstime = datetime.now()
        return body, obstime

    except Exception as e:
        error(f"Error: couldn't parse arguments: {e}")
        sys.exit(0)


ERRSTR = ''
def error(s):
    global ERRSTR
    ERRSTR += s + '\n'
    if VERBOSE:
        print("Error:", s)


def main():
    if 'REQUEST_URI' in os.environ:
        # Running from a CGI. Set the cachedir to something that
        # doesn't depend on a user's homedir
        global CACHEDIR
        CACHEDIR = CGI_CACHEDIR

        body, obstime = parse_cgi()

    else:
        body, obstime = parse_args()

    if not obstime:
        obstime = datetime.now()

    marsvals = fetch_cache_horizons(body, obstime)
    if marsvals:
        print(marsvals)

    if ERRSTR:
        print(ERRSTR)


if __name__ == '__main__':
    main()

