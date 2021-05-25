/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc

 License is BSD 2-Clause "Simplified" License
 even if it's included in a project with a different license.

 Modified by Akkana to work outside of node.js.
*/

// (function () { 'use strict';

// shortcuts for easier to read formulas

var PI   = Math.PI,
    sin  = Math.sin,
    cos  = Math.cos,
    tan  = Math.tan,
    asin = Math.asin,
    atan = Math.atan2,
    acos = Math.acos,
    rad  = PI / 180;

// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas


// date/time constants and conversions

var dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
function fromJulian(j)  { return new Date((j + 0.5 - J1970) * dayMs); }
function toDays(date)   { return toJulian(date) - J2000; }


// general calculations for position

var e = rad * 23.4397; // obliquity of the Earth

function rightAscension(l, b) { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
function declination(l, b)    { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }

function azimuth(H, phi, dec)  { return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)); }
function altitude(H, phi, dec) { return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H)); }

function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }

function astroRefraction(h) {
    if (h < 0) // the following formula works for positive altitudes only.
        h = 0; // if h = -0.08901179 a div/0 would occur.

    // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
    // 1.02 / tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to rad:
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

// general sun calculations

function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }

function eclipticLongitude(M) {

    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
        P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + PI;
}

function sunCoords(d) {

    var M = solarMeanAnomaly(d),
        L = eclipticLongitude(M);

    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0)
    };
}


var SunCalc = {};


// calculates sun position for a given date and latitude/longitude

SunCalc.getPosition = function (date, lat, lng) {

    var lw  = rad * -lng,
        phi = rad * lat,
        d   = toDays(date),

        c  = sunCoords(d),
        H  = siderealTime(d, lw) - c.ra;

    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: altitude(H, phi, c.dec)
    };
};


// sun times configuration (angle, morning name, evening name)

var times = SunCalc.times = [
    [-0.833, 'sunrise',       'sunset'      ],
    [  -0.3, 'sunriseEnd',    'sunsetStart' ],
    [    -6, 'dawn',          'dusk'        ],
    [   -12, 'nauticalDawn',  'nauticalDusk'],
    [   -18, 'nightEnd',      'night'       ],
    [     6, 'goldenHourEnd', 'goldenHour'  ]
];

// adds a custom time to the times config

SunCalc.addTime = function (angle, riseName, setName) {
    times.push([angle, riseName, setName]);
};


// calculations for sun times

var J0 = 0.0009;

function julianCycle(d, lw) { return Math.round(d - J0 - lw / (2 * PI)); }

function approxTransit(Ht, lw, n) { return J0 + (Ht + lw) / (2 * PI) + n; }
function solarTransitJ(ds, M, L)  { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }

function hourAngle(h, phi, d) { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
function observerAngle(height) { return -2.076 * Math.sqrt(height) / 60; }

// returns set time for the given sun altitude
function getSetJ(h, lw, phi, dec, n, M, L) {

    var w = hourAngle(h, phi, dec),
        a = approxTransit(w, lw, n);
    return solarTransitJ(a, M, L);
}


// calculates sun times for a given date, latitude/longitude, and, optionally,
// the observer height (in meters) relative to the horizon

SunCalc.getTimes = function (date, lat, lng, height) {
    height = height || 0;

    var lw = rad * -lng,
        phi = rad * lat,

        dh = observerAngle(height),

        d = toDays(date),
        n = julianCycle(d, lw),
        ds = approxTransit(0, lw, n),

        M = solarMeanAnomaly(ds),
        L = eclipticLongitude(M),
        dec = declination(L, 0),

        Jnoon = solarTransitJ(ds, M, L),

        i, len, time, h0, Jset, Jrise;


    var result = {
        solarNoon: fromJulian(Jnoon),
        nadir: fromJulian(Jnoon - 0.5)
    };

    for (i = 0, len = times.length; i < len; i += 1) {
        time = times[i];
        h0 = (time[0] + dh) * rad;

        Jset = getSetJ(h0, lw, phi, dec, n, M, L);
        Jrise = Jnoon - (Jset - Jnoon);

        result[time[1]] = fromJulian(Jrise);
        result[time[2]] = fromJulian(Jset);
    }

    return result;
};

// Calculate an initial guess for the equinoxes and solstices in a year.
// Meeus Astronmical Algorithms Chapter 27
function quickEquiSol(k, year) { // Valid for years 1000 to 3000
    var JDE0=0, Y=(year-2000)/1000;
    switch( k ) {
    case 0:
        JDE0 = 2451623.80984 + 365242.37404*Y + 0.05169 * Math.pow(Y, 2)
            - 0.00411 * Math.pow(Y, 3) - 0.00057 * Math.pow(Y, 4);
        break;
    case 1:
        JDE0 = 2451716.56767 + 365241.62603*Y + 0.00325 * Math.pow(Y, 2)
            + 0.00888 * Math.pow(Y, 3) - 0.00030 * Math.pow(Y, 4);
        break;
    case 2:
        JDE0 = 2451810.21715 + 365242.01767*Y - 0.11575 * Math.pow(Y, 2)
            + 0.00337 * Math.pow(Y, 3) + 0.00078 * Math.pow(Y, 4);
        break;
    case 3:
        JDE0 = 2451900.05952 + 365242.74049*Y - 0.06223 * Math.pow(Y, 2)
            - 0.00823 * Math.pow(Y, 3) + 0.00032 * Math.pow(Y, 4);
        break;
    }
    return fromJulian(JDE0);
}

// Get all the interesting equinox/solstice related dates, including
// longest/shortest days and earliest/latest sunrise/sunset,
// which should all be within 20 days of the solstice.
function allEquiSolDates(year, lat, lon, alt) {
    vals = {}

    // First get the four main passages
    vals.vernal_equinox = quickEquiSol(0, year);
    vals.summer_solstice = quickEquiSol(1, year);
    vals.autumnal_equinox = quickEquiSol(2, year);
    vals.winter_solstice = quickEquiSol(3, year);

    // Will iterate near each solstice to find the extremes
    vals.longest_day_len = null;
    vals.shortest_day_len = null;
    vals.longest_day = null
    vals.shortest_day = null
    vals.earliest_sunrise = null;
    vals.earliest_sunset = null;
    vals.latest_sunrise = null;
    vals.latest_sunset = null;

    // Compare just the times, not the dates, of two Date objects.
    // return true if date1 has an earlier time than date2.
    function earlierTime(date1, date2) {
        if (date1.getHours() < date2.getHours())
            return true;
        if (date1.getHours() > date2.getHours())
            return false;
        if (date1.getMinutes() < date2.getMinutes())
            return true;
        if (date1.getMinutes() > date2.getMinutes())
            return false;
        if (date1.getSeconds() < date2.getSeconds())
            return true;
        if (date1.getSeconds() > date2.getSeconds())
            return false;
        if (date1.getMilliseconds() < date2.getMilliseconds())
            return true;
        if (date1.getMilliseconds() > date2.getMilliseconds())
            return false;
        // They're essentially equal, so it doesn't matter what's returned.
        // Return the one with the earlier date.
        return (date1 < date2);
    }

    function compare_rises_sets(d) {
        var times = SunCalc.getTimes(d, lat, lon, alt);
        //console.log("Comparing sunset", times.sunset)
        if (! vals.earliest_sunrise ||
            earlierTime(times.sunrise, vals.earliest_sunrise))
            vals.earliest_sunrise = times.sunrise;
        if (! vals.earliest_sunset ||
            earlierTime(times.sunset, vals.earliest_sunset))
            vals.earliest_sunset = times.sunset;
        if (! vals.latest_sunrise ||
            earlierTime(vals.latest_sunrise, times.sunrise))
            vals.latest_sunrise = times.sunrise;
        if (! vals.latest_sunset ||
            earlierTime(vals.latest_sunset, times.sunset)) {
            vals.latest_sunset = times.sunset;
        }

        var daylength = times.sunset - times.sunrise; // milliseconds
        if (! vals.shortest_day_len || daylength < vals.shortest_day_len) {
            vals.shortest_day_len = daylength;
            vals.shortest_day = times.sunrise;
        }
        if (! vals.longest_day_len || daylength > vals.longest_day_len) {
            vals.longest_day_len = daylength;
            vals.longest_day = times.sunrise;
        }
    }

    // It's possible that the following logic is wrong for the southern hemi.
    const MAXDAYS = 15;     // How many days to calculate back

    for(var i=-MAXDAYS; i<MAXDAYS; ++i) {
        var d = vals.summer_solstice.addDays(i);
        compare_rises_sets(d);
    }

    for(i=-MAXDAYS; i<MAXDAYS; ++i) {
        var d = vals.winter_solstice.addDays(i);
        compare_rises_sets(d);
    }

    // Hopefully everything has been found now.
    // Convert day lengths from milliseconds to hours:
    vals.shortest_day_len /= 1000*60*60;
    vals.longest_day_len /= 1000*60*60;

    /*
    console.log("vals", vals);
    console.log("earliest sunset", vals.earliest_sunset);
    console.log("shortest day", vals.shortest_day, vals.shortest_day_len);
    console.log("winter solstice", vals.winter_solstice);
    console.log("latest sunrise", vals.latest_sunrise);
    console.log("-----");
    console.log("earliest sunrise", vals.earliest_sunrise);
    console.log("longest day", vals.longest_day, vals.longest_day_len);
    console.log("summer solstice", vals.summer_solstice);
    console.log("latest sunset", vals.latest_sunset);
     */

    return vals;
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

// moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

function moonCoords(d) { // geocentric ecliptic coordinates of the moon

    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
        M = rad * (134.963 + 13.064993 * d), // mean anomaly
        F = rad * (93.272 + 13.229350 * d),  // mean distance

        l  = L + rad * 6.289 * sin(M), // longitude
        b  = rad * 5.128 * sin(F),     // latitude
        dt = 385001 - 20905 * cos(M);  // distance to the moon in km

    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt
    };
}

SunCalc.getMoonPosition = function (date, lat, lng) {

    var lw  = rad * -lng,
        phi = rad * lat,
        d   = toDays(date),

        c = moonCoords(d),
        H = siderealTime(d, lw) - c.ra,
        h = altitude(H, phi, c.dec),
        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

    h = h + astroRefraction(h); // altitude correction for refraction

    return {
        azimuth: azimuth(H, phi, c.dec),
        altitude: h,
        distance: c.dist,
        parallacticAngle: pa
    };
};


// calculations for illumination parameters of the moon,
// based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
// Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

SunCalc.getMoonIllumination = function (date) {

    var d = toDays(date || new Date()),
        s = sunCoords(d),
        m = moonCoords(d),

        sdist = 149598000, // distance from Earth to Sun in km

        phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
        inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
        angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    return {
        fraction: (1 + cos(inc)) / 2,
        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
        angle: angle
    };
};


function hoursLater(date, h) {
    return new Date(date.valueOf() + h * dayMs / 24);
}

// calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article

SunCalc.getMoonTimes = function (date, lat, lng, inUTC) {
    var t = new Date(date);
    if (inUTC) t.setUTCHours(0, 0, 0, 0);
    else t.setHours(0, 0, 0, 0);

    var hc = 0.133 * rad,
        h0 = SunCalc.getMoonPosition(t, lat, lng).altitude - hc,
        h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;

    // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
    for (var i = 1; i <= 24; i += 2) {
        h1 = SunCalc.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
        h2 = SunCalc.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;

        a = (h0 + h2) / 2 - h1;
        b = (h2 - h0) / 2;
        xe = -b / (2 * a);
        ye = (a * xe + b) * xe + h1;
        d = b * b - 4 * a * h1;
        roots = 0;

        if (d >= 0) {
            dx = Math.sqrt(d) / (Math.abs(a) * 2);
            x1 = xe - dx;
            x2 = xe + dx;
            if (Math.abs(x1) <= 1) roots++;
            if (Math.abs(x2) <= 1) roots++;
            if (x1 < -1) x1 = x2;
        }

        if (roots === 1) {
            if (h0 < 0) rise = i + x1;
            else set = i + x1;

        } else if (roots === 2) {
            rise = i + (ye < 0 ? x2 : x1);
            set = i + (ye < 0 ? x1 : x2);
        }

        if (rise && set) break;

        h0 = h2;
    }

    var result = {};

    if (rise) result.rise = hoursLater(t, rise);
    if (set) result.set = hoursLater(t, set);

    if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

    return result;
};


// export as Node module / AMD module / browser variable
if (typeof exports === 'object' && typeof module !== 'undefined') module.exports = SunCalc;
else if (typeof define === 'function' && define.amd) define(SunCalc);
else window.SunCalc = SunCalc;

//}();
