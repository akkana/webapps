#!/usr/bin/env python3

import ephem
from ephem import cities

import argparse
import datetime
import re
import sys

import cgi
import json


# Slop allowed in phase calculation, in percent:
PHASESLOP = 5


def find_target_point_rise_set(target_obs, body, action, start, end, phase):
    '''
    Given a target location, phase, start/end dates,
    find all rise and set bearings through that location.
    target_obs is type ephem.Observer, but note that it isn't really
    an observer, it's just a location behind which the body will rise or set,
    though it has all the same attributes as an observer.

    Returns a list of dictionaries with date, azimuth in degrees, phase
    '''

    vals = []

    observer.date = start
    while observer.date < end:
        if action == 'rise':
            observer.date = observer.next_rising(body)
        else:
            observer.date = observer.next_setting(body)
        body.compute(observer)

        if phase > 0 and abs(body.phase - phase) > PHASESLOP:
            continue

        vals.append({ 'date':   observer.date,
                      'az':     body.az * 180. / ephem.pi,
                      'action': action,
                      'body':   body.name,
                      'phase':  body.phase })

    return vals


def find_target_az_rise_set(observer, body, action, start, end, targetaz,
                            phase, slop):
    '''
    Given an observer location and a target azimuth, phase, start/end dates,
    find rises or sets close to the target azimuth.
    Returns a list of dictionaries with date, azimuth in degrees, phase
    '''

    vals = []

    # convert angles to radians
    slop *= ephem.pi / 180
    targetaz *= ephem.pi / 180

    observer.date = start
    while observer.date < end:
        if action == 'rise':
            observer.date = observer.next_rising(body)
        else:
            observer.date = observer.next_setting(body)
        body.compute(observer)

        if phase > 0 and abs(body.phase - phase) > PHASESLOP:
            continue

        if abs(body.az - targetaz) < slop:
            vals.append({ 'date':  observer.date,
                          'az':    body.az * 180. / ephem.pi,
                          'phase': body.phase })

    return vals


def observer_for_city(city):
    try:
        return ephem.city(city)
    except KeyError:
        pass

    try:
        return cities.lookup(city)
    except ValueError:
        pass

    # Add some cities pyephem doesn't know:
    if city == 'San Jose':     # San Jose, CA at Houge Park
        observer = ephem.Observer()
        observer.name = "San Jose"
        observer.lon = '-121:56.8'
        observer.lat = '37:15.55'
        observer.elevation = 100
        return observer

    elif city == 'Los Alamos':  # Los Alamos, NM Nature Center
        observer = ephem.Observer()
        observer.name = "Los Alamos"
        observer.lon = '-106:18.36'
        observer.lat = '35:53.09'
        observer.elevation = 2100
        return observer

    elif city == 'White Rock':  # White Rock, NM Visitor Center
        observer = ephem.Observer()
        observer.name = "White Rock"
        observer.lon = '-106:12.75'
        observer.lat = '35:49.61'
        observer.elevation = 1960
        return observer

    return None


if __name__ == '__main__':
    # Called as a CGI script? Sample args:
    # rise_set_az.cgi?lat=35.9&lon=137.4&body=moon&action=rise&phase=100&ele=6500
    # lat, lon in decimal degrees, phase in percent, ele in feet
    form = cgi.FieldStorage()
    # form = {
    #     'phase':  '100',
    #     'lat':    '35.856779',
    #     'lon':    '-106.147884',
    #     'action': 'set',
    # }

    if 'lat' in form and 'lon' in form:
        observer = ephem.Observer()
        observer.lat = ephem.degrees(form['lat'].value)
        observer.lon = ephem.degrees(form['lon'].value)

        if 'ele' in form:
            observer.elevation = int(form['ele'].value)

        if 'body' in form:
            if form['body'].value.lower() == 'sun':
                body = ephem.Sun()
            elif form['body'].value.lower() == 'moon':
                body = ephem.Moon()
            else:
                sys.exit(1)
        else:
            body = ephem.Moon()

        if 'action' in form:
            action = form['action'].value.lower()
        else:
            action = 'rise'

        if 'phase' in form:
            phase = int(form['phase'].value)
        else:
            phase = 0

        if 'start' in form:
            start = datetime.datetime.strptime(form['start'].value, '%Y-%m-%d')
        else:
            start = datetime.datetime.now()
        if 'end' in form:
            end = datetime.datetime.strptime(form['end'].value, '%Y-%m-%d')
        else:
            end = start.replace(month=12, day=31, hour=23)

        vals = find_target_point_rise_set(observer, body, action,
                                          ephem.Date(start),
                                          ephem.Date(end),
                                          phase)

        # 'date' in vals is ephem.date. For JSON, convert it to ISO 8601:
        for val in vals:
            val['date'] = val['date'].datetime() \
                                     .strftime('%Y-%m-%dT%H:%M:%SZ')

        print('Content-type: application/json\n')
        print(json.dumps(vals))

        sys.exit(0)


    # Lots of arg parsing in case of not being called as CGI
    parser = argparse.ArgumentParser(
        description="""Calculate sun/moon rise/set.""")

    # Required argument: the observer's location
    parser.add_argument("-o", "--observer", action="store", required=True,
                        dest="observer", default="White Rock",
                        help='Observer location: city name or '
                             'lat(dd),lon(dd)[,elevation(m)[,name]]')

    # Required argument: azimuth where the rise or set is wanted
    parser.add_argument("-a", "--azimuth", action="store",
                        dest="az", type=int, required=True,
                        help='Target rise/set azimuth, in decimal degrees')

    # The rest of the arguments are optional.
    parser.add_argument("--moon", dest="moon", default=False,
                        action="store_true", help="Moon (default)")
    parser.add_argument("--sun", dest="sun", default=False,
                        action="store_true", help="Sun (rather than moon)")

    parser.add_argument("-r", "--rise", dest="rise", default=False,
                        action="store_true", help="Rise (default)")
    parser.add_argument("-s", "--set", dest="set", default=False,
                        action="store_true", help="Set (rather than rise)")

    parser.add_argument("-p", "--phase", action="store", default=0,
                        dest="phase", type=int,
                        help='Phase percent (default: all phases)')

    parser.add_argument("--slop", action="store", dest="slop", default=1,
                        type=int,
                        help="Slop degrees allowed (default 2)")

    parser.add_argument("-S", "--start", dest="start", default=None,
                        help="Start date, YYYY-MM-DD, "
                             "default: today",
                        type=lambda s: datetime.datetime.strptime(s,
                                                                  '%Y-%m-%d'))
    parser.add_argument("-E", "--end", dest="end", default=None,
                        help="End date, YYYY-MM-DD, "
                             "default: end of start year",
                        type=lambda s: datetime.datetime.strptime(s,
                                                                  '%Y-%m-%d'))

    args = parser.parse_args(sys.argv[1:])

    obsparts = args.observer.split(',')
    if len(obsparts) > 1:
        floatexp = r"[-+]?\d*\.\d+|\d+"
        try:
            lat = re.findall(floatexp, obsparts[0])[0].strip()
            lon = re.findall(floatexp, obsparts[1])[0].strip()
            if len(obsparts) > 2:
                ele = re.findall(floatexp, obsparts[2])[0].strip()
            else:
                ele = '0'
            if len(obsparts) > 3:
                obsname = ','.join(obsparts[3:]).strip()
            else:
                obsname = 'Custom'

            print("lat", lat, "lon", lon, "ele", ele, "obsname", obsname)

            observer = ephem.Observer()
            observer.name = obsname
            observer.lon = ephem.degrees(lon)
            observer.lat = ephem.degrees(lat)
            observer.elevation = float(ele)
        except RuntimeError:
            observer = None
    else:
        observer = None

    if not observer:
        observer = observer_for_city(args.observer)

    if not observer:
        print("Couldn't parse observer '%s'" % args.observer)
        parser.print_help()
        sys.exit(1)

    print("Observer:", observer)

    if args.sun:
        body = ephem.Sun()
    else:
        body = ephem.Moon()

    rise = not args.set
    if rise:
        print("Finding %srises" % body.name)
    else:
        print("Finding %ssets" % body.name)

    if not args.start:
        args.start = datetime.datetime.now()
    if not args.end:
        args.end = args.start.replace(month=12, day=31, hour=23)

    vals = find_rise_set(observer, body, rise,
                         ephem.Date(args.start), ephem.Date(args.end),
                         args.az, args.phase, args.slop)

    for trip in vals:
        # (date, azimuth in radians, phase)
        print("%s: %.1f at %d%% illuminated" % (trip['date'],
                                                trip['az'] * 180 / ephem.pi,
                                                trip['phase']))
