/*
 * satsat.js
 * Calculations of positions of Saturn and its moons.
 * Some of the code was adapted from SATSAT2.BAS
 * by Dan Bruton, astro@tamu.edu.
 * via satmoons.c by Akkana (if you're wondering about the C-like syntax).
 * See "Practical Astronomy with your Calculator" by Peter Duffett-Smith,
 * and the Astronomical Almanac for explanations of some of these
 * calculations.
 *
 * Copyright 2019 by Akkana Peck.
 * Share and enjoy under the Gnu Public License v.2 or later.
 */

/* Constants */
var RS = 60330;   /* Radius of planet in kilometers */
var RS1 = 92000;  /* Inner radius of inner ring in kilometers */
/* Fudge RS2 and RS3 so Cassini's division will show more clearly */
var RS2 = 111000; /* Outer radius of inner ring (really 117500) */
var RS3 = 130000; /* Inner radius of outer ring (really 122500) */
var RS4 = 136500; /* Outer radius of outer ring in kilometers */

const NSAT = 10;
const TWOPI = Math.PI * 2.;
const PI2 = Math.PI / 2.;
const D2R = Math.PI / 180.;

var DrawOrbits = 0;

var NumMoons = 8;  /* Number of moons displayed */

/* What we need to know about a planet for this program.
 * These aren't full orbital elements.
typedef struct planet_s {
    var orbitalRate;    // Orbital rate, radians/day
    var ecc;            // eccentricity
    var sma;            // semi-major axis
} planet_t;
 */

var earth = {
    'orbitalRate': TWOPI / (1.00004 * 365.2422),
    'ecc':         .016718,
    'sma':         1.
};

var saturn = {
    'orbitalRate': TWOPI / (29.45771 * 365.2422),
    'ecc':         .0556155,
    'sma':         9.554747
};

var JDE = 2444238.5;       /* Epoch Jan 0.0 1980 = December 31,1979 0:0:0 UT */
var LpE = 165.322242 * D2R;  /* Varitude of Saturn at Epoch */
var LpP = 92.6653974 * D2R;  /* Varitude of Saturn`s Perihelion */
var Ohm = 113.4888341 * D2R; /* Varitude of Saturn`s Ascending Node */
var IncS = 2.4893741 * D2R;  /* Inclination of Saturn`s Orbit */
var LEE = 98.83354 * D2R;    /* Varitude of Earth at Epoch */
var LEP = 102.596403 * D2R;  /* Varitude of Earth's Perihelion */
var Obl = 23.43928 * D2R; /* obliquity of the ecliptic */

/*
 * Kludge alert!
 * This table needs to be reset every year or so.
 * Reset the U0 values, the Angle from inferior geocentric conjuction
 * measured westward avar the orbit at epoch.
 * Pick a time at which you want accuracy to be highest
 * (probably opposition or a month or two later),
 * calculate the Julian time, and estimate the moon positions
 * for that time.
 * You'd think there would be closed-form solutions for Saturn's moons,
 * and there probably are, in the American Ephemeris and Nautical Almanac,
 * but nobody publishes simpler ones.
 */
//var JDEmoons = 2452275.5;    /* Jan 1.0 2002 */
var JDEmoons = 2452640.5;    /* Jan 1.0 2003 */
var satMoons = [

/*    Name           SMA   E     Period  mag*10   U0      U */
/*    ----           ---   -     ------  -----  ------    - */
    { "name": "Mimas",     "sma": 185600,  "period": .9425049, "mag10": 130, "u0": 185 * D2R },
    { "name": "Enceladus", "sma": 238100,  "period": 1.3703731, "mag10": 118, "u0": 230 * D2R },
    { "name": "Tethys",    "sma": 294700,  "period": 1.8880926, "mag10": 103, "u0": 160 * D2R },
    { "name": "Dione",     "sma": 377500,  "period": 2.7375218, "mag10": 102, "u0": 132 * D2R },
    { "name": "Rhea",      "sma": 527200,  "period": 4.519163,  "mag10": 98, "u0":  97 * D2R },
    { "name": "Titan",     "sma": 1221600, "period": 15.9669028, "mag10": 84, "u0": 137 * D2R },
    { "name": "Hyperion",  "sma": 1483000, "period": 21.3174647, "mag10": 143, "u0": 335 * D2R },
    { "name": "Iapetus",   "sma": 3560100, "period": 79.9208313, "mag10": 112, "u0": 290 * D2R }

];

/* Inclination of Rings and other items */
var Inclination;
var IapInci
var IapGam;

/********************************************************************
 *                                                                  *
 *   Orbit Calculations                                             *
 *                                                                  *
 ********************************************************************
 */
function SaturnOrbit(JD)
{
    var i;
    var lE, lP, rE, rP, dt, ii, f, f1;
    var psi, lpq, rpq, lamb, beta, RA, dec;
    var tva, pva, tvc, pvc, dot1, tvb, pvb, dot2;
    var trip;

    /******************* FIND MOON ORBITAL ANGLES ************************/
    var NN = JD - JDE;   /* NN = Number of days since epoch */
    console.log("earth.orbitalRate", earth.orbitalRate);
    var ME = ((earth.orbitalRate * NN) + LEE - LEP); /* Mean Anom, Earth */
    var MP = ((saturn.orbitalRate * NN) + LpE - LpP);/* Mean Anom, Saturn */
    var VE = ME;
    var VP = MP;   /* True Anomolies - Solve Kepler's Equation */
    console.log("NN, ME, MP, VE, VP", NN, ME, MP, VE, VP);
    console.log("eccentricities", earth.ecc, saturn.ecc);
    for (i=0; i < 3; ++i)
    {
        VE = VE - (VE - (earth.ecc * Math.sin(VE)) - ME) / (1 - (earth.ecc * Math.cos(VE)));
        VP = VP - (VP - (saturn.ecc * Math.sin(VP)) - MP) / (1 - (saturn.ecc * Math.cos(VP)));
    }

    VE = 2 * Math.atan(Math.sqrt((1. + earth.ecc) / (1. - earth.ecc)) * Math.tan(VE / 2.));
    if (VE < 0) VE = TWOPI + VE;
    VP = 2 * Math.atan(Math.sqrt((1. + saturn.ecc) / (1. - saturn.ecc)) * Math.tan(VP / 2.));
    if (VP < 0) VP = TWOPI + VP;

    /* Heliocentric Varitudes of Earth and Saturn */
    lE = VE + LEP;
    if (lE > TWOPI) lE = lE - TWOPI;
    lP = VP + LpP;
    if (lP > TWOPI) lP = lP - TWOPI;

    /* Distances of Earth and Saturn from the Sun in AU's */
    rE = earth.sma * (1. - earth.ecc * earth.ecc) / (1. + earth.ecc * Math.cos(VE));
    rP = saturn.sma * (1. - saturn.ecc * saturn.ecc)
         / (1. + saturn.ecc * Math.cos(VP));
    /* DT = Distance from Saturn to Earth in AU's - Law of Cosines */
    dt = Math.sqrt((rE * rE) + (rP * rP) - (2. * rE * rP * Math.cos(lE - lP)));

    /* II = Angle between Earth and Sun as seen from Saturn */
    ii = Math.asin(rE * Math.sin(lP - lP) / dt);

    /* For the moon computations, we need to compute
     * from JDEmoons rather than JDE.
     */
    /* F = NN - (Light Time to Earth in days) */
    //printf("Light time: %lf days (%lf AU)\n", DT/173.83, DT);
    f = JD - JDEmoons - (dt / 173.83);
    f1 = ii + MP - VP;
    console.log("f, f1", f, f1);

    /* calc. angle from inferior geocentric conjuction measured westward */
    for (i=0; i < NumMoons; ++i)
    {
        satMoons[i].u = (satMoons[i].u0 + (f * TWOPI / satMoons[i].period) + f1) / TWOPI;
        satMoons[i].u = (satMoons[i].u - Math.floor(satMoons[i].u)) * TWOPI;
        console.log("moon", i, "is at u", satMoons[i].u);
    }

    /********************* FIND SATURN'S COORDINATES *********************
     * psi -> Heliocentric Latitude
     * lamb -> Geocentric Ecliptic Varitude
     * beta -> Geocentric Ecliptic Latitude
     */
    psi = Math.asin(Math.sin(lP - Ohm) * Math.sin(IncS));
    lpq = Math.atan2(Math.sin(lP - Ohm) * Math.cos(IncS), Math.cos(lP - Ohm)) + Ohm;
    rpq = rP * Math.cos(psi);
    lamb = Math.atan2(rE * Math.sin(lpq - lE), rpq - rE * Math.cos(lpq - lE)) + lpq;
    beta = rpq * Math.tan(psi) * Math.sin(lamb - lpq);
    beta = Math.atan(beta / (rE * Math.sin(lpq - lE)));
    RA = Math.atan2((Math.sin(lamb) * Math.cos(Obl)) - (Math.tan(beta) * Math.tan(Obl)),
               Math.cos(lamb));
    dec = Math.asin(Math.sin(beta) * Math.cos(Obl) + Math.cos(beta) * Math.sin(Obl) * Math.sin(lamb));
    //printf("Saturn's coordinates are (%f h, %f deg)\n",
    //       RA * 12. / Math.PI, DEC * 180 / Math.PI);
    console.log("Saturn's coordinates are",
                RA * 12. / Math.PI, dec * 180 / Math.PI);

    /***************** FIND INCLINATION OF RINGS *************************
     * Use dot product of Earth-Saturn vector and Saturn's rotation axis
     */
    tva = (90 - 83.51) * D2R; /* Theta coordinate of Saturn's axis */
    console.log("tva", tva, "= (90 - 83.51) *", D2R);
    pva = 40.27 * D2R;        /* Phi coordinate of Saturn's axis */
    tvc = PI2 - dec;
    pvc = RA;
    dot1 = Math.sin(tva) * Math.cos(pva) * Math.sin(tvc) * Math.cos(pvc)
           + Math.sin(tva) * Math.sin(pva) * Math.sin(tvc) * Math.sin(pvc)
           + Math.cos(tva) * Math.cos(tvc);
    Inclination = Math.acos(dot1);
    console.log("Inclination", Inclination, "acos(", dot1, ")");
    if (Inclination > 0) Inclination = PI2 - Inclination;
    else Inclination = -PI2 - Inclination;

    /************** FIND INCLINATION OF IAPETUS' ORBIT *******************
     * Use dot product of Earth-Saturn vector and Iapetus' orbit axis
     * Vector B
     */
    tvb = (90. - 75.6) * D2R;    /* Theta coord of Iapetus' orbit axis (est) */
    pvb = 21.34 * TWOPI / 24;    /* Phi coord of Iapetus' orbit axis (est) */
    dot2 = Math.sin(tvb) * Math.cos(pvb) * Math.sin(tvc) * Math.cos(pvc);
    dot2 = dot2 + Math.sin(tvb) * Math.sin(pvb) * Math.sin(tvc) * Math.sin(pvc);
    dot2 = dot2 + Math.cos(tvb) * Math.cos(tvc);
    IapInci = Math.atan(Math.sqrt(1. - (dot2 * dot2)) / dot2);
       /* satsat said this was arccos, but it's not */
    if (IapInci > 0) IapInci = PI2 - IapInci;
    else IapInci = -PI2 - IapInci;

    /************** FIND ROTATION ANGLE OF IAPETUS' ORBIT ****************
     * Use inclination of Iapetus' orbit with respect to ring plane
     * Triple Product
     */
    trip = Math.sin(tvc) * Math.cos(pvc) * Math.sin(tva) * Math.sin(pva) * Math.cos(tvb);
    trip = trip - Math.sin(tvc) * Math.cos(pvc) * Math.sin(tvb) * Math.sin(pvb) * Math.cos(tva);
    trip = trip + Math.sin(tvc) * Math.sin(pvc) * Math.sin(tvb) * Math.cos(pvb) * Math.cos(tva);
    trip = trip - Math.sin(tvc) * Math.sin(pvc) * Math.sin(tva) * Math.cos(pva) * Math.cos(tvb);
    trip = trip + Math.cos(tvc) * Math.sin(tva) * Math.cos(pva) * Math.sin(tvb) * Math.sin(pvb);
    trip = trip - Math.cos(tvc) * Math.sin(tvb) * Math.cos(pvb) * Math.sin(tva) * Math.sin(pva);
    IapGam = -1 * Math.atan(trip / Math.sqrt(1 - trip * trip));  /* ArcSIN */
       /* The original satsat said this was arcsin, but it's not */
}
