
//
// These are variables instead of constants because the orbital elements
// are calculated from components. Though JS seems to allow changing them
// even if they're declared const.
//
var earth = {
    "inc": 0.0, "inc_b": 0.00005,    "inc_m": -0.000000356985,
    "asc": 0.0, "asc_b": -11.26084,  "asc_m": 0.0000000000,
    "per": 0.0, "per_b": 102.9404,   "per_m": 0.0000470935,
    "sem": 0.0, "sem_b": 1.00000011, "sem_m": -0.00000000000136893,
    "ecc": 0.0, "ecc_b": 0.016709,   "ecc_m": -0.000000001151,
    "lon": 0.0, "lon_b": 98.9874,   "lon_m": 0.9856473520
};

var mars = {
    "inc": 0.0, "inc_b": 1.8497,     "inc_m": -0.0000000178,
    "asc": 0.0, "asc_b": 49.5574,    "asc_m": 0.0000211081,
    "per": 0.0, "per_b": 336.0590,   "per_m": 0.0000504042,
    "sem": 0.0, "sem_b": 1.52366231, "sem_m": -0.000000001977,
    "ecc": 0.0, "ecc_b": 0.093405,   "ecc_m": 0.000000002516,
    "lon": 0.0, "lon_b": 354.6611,   "lon_m":0.5240711808
};

const DEGREES = Math.PI / 180.0;

/* XXX: these are just guesses; we should improve this */
var northLon = -6.2;   /* longitude of Mars's north pole (in degrees) */
var northObl = 26.2;   /* obliquity of Mars (in degrees) */
var lonCorr = 0.174;   /* correction for reference longitude */
var marsRot = 1.025972;   /* rotational period of Mars in Earth days */

// Javascript doesn't have fmod, but you can monkeypatch it
Math.fmod = function (a,b) {
    return Number((a - (Math.floor(a / b) * b)).toPrecision(8));
};

// Calculate the current appearance of Mars.
// Returns three keys: CM (radians), lat (radians) and size (4.4?
function MarsMapCalcCM(jdate) {
    ProcElements(earth, jdate);
    ProcElements(mars, jdate);

    /* compute ecliptic coordinates of the Earth */
    var earthM = earth.lon - earth.per;
    var earthV = Kepler(earthM, earth.ecc);
    var earthR = earth.sem * (1.0 - earth.ecc * earth.ecc) / (1.0 + earth.ecc * Math.cos(earthV));
    earthPos = { "x": earthR * Math.cos(earthV + earth.per),
                 "y": earthR * Math.sin(earthV + earth.per),
                 "z": 0.0 }

    /* compute ecliptic coordinates of Mars */
    var marsM = mars.lon - mars.per;
    var marsV = Kepler(marsM, mars.ecc);
    var marsR = mars.sem * (1.0 - mars.ecc * mars.ecc) / (1.0 + mars.ecc * Math.cos(marsV));
    var marsPos= { "x": marsR * (Math.cos(mars.asc) * Math.cos(marsV + mars.per - mars.asc)
                                 - Math.sin(mars.asc) * Math.sin(marsV + mars.per - mars.asc) * Math.cos(mars.inc)),
                   "y": marsR * (Math.sin(mars.asc) * Math.cos(marsV + mars.per - mars.asc)
                                 + Math.cos(mars.asc) * Math.sin(marsV + mars.per - mars.asc) * Math.cos(mars.inc)),
                   "z": marsR * Math.sin(marsV + mars.per - mars.asc) * Math.sin(mars.inc)
                 }

    /* compute vector from center of Mars to center of Earth */
    var mars2Earth = { "x": earthPos.x-marsPos.x,
                       "y": earthPos.y-marsPos.y,
                       "z": earthPos.z-marsPos.z }
    var marsDist = Math.sqrt(DotProduct(mars2Earth, mars2Earth));
    NormalizeVector(mars2Earth);
    /* note: centerXYZ also points from center of Mars to center of disc */

    /* compute vector from center of Mars to Mars's north pole */
    var marsNorth = { "x": Math.sin(northObl*DEGREES) * Math.cos(northLon * DEGREES),
                      "y": Math.sin(northObl*DEGREES) * Math.sin(northLon * DEGREES),
                      "z": Math.cos(northObl*DEGREES) }

    /* compute vector from center of Mars to equator of Mars
       at reference longitude */
    var marsRef = { "x": Math.cos(northObl * DEGREES) * Math.cos(northLon * DEGREES),
                    "y": Math.cos(northObl * DEGREES) * Math.sin(northLon * DEGREES),
                    "z": -Math.sin(northObl*DEGREES) }
    /* note: the reference longitude is the Mars longitude of the
       ecliptic *south* pole */

    /* compute vector from center of Mars to equator of Mars
       at same longitude as center of disc */
    var marsEq = { "x": mars2Earth.x,
                   "y": mars2Earth.y,
                   "z": mars2Earth.z }
    OrthogonalizeVector(marsEq, marsNorth);

    /* compute longitude of Mars at reference point */
    var marsLon = Math.fmod(jdate + lonCorr - marsDist * 0.0057, marsRot) * 2.0 * Math.PI / marsRot;

    /* compute longitude of center of disc (CM longitude) */
    var dotQR = DotProduct(marsEq, marsRef);
    var eqRefCross = CrossProduct(marsEq, marsRef);
    if (eqRefCross.z > 0.0)
        marsLon += Math.acos(dotQR);
    else
        marsLon -= Math.acos(dotQR);
    while (marsLon < 0.0)
        marsLon += 2.0 * Math.PI;
    while (marsLon >= 2.0 * Math.PI)
        marsLon -= 2.0 * Math.PI;

    /* compute latitude of center of disc */
    var marsLat = 0.5 * Math.PI - Math.acos(DotProduct(mars2Earth, marsNorth));

    /* compute size of disc */
    /* XXX Meeus has this same equation (except he uses 9.36) and
     * claims that this is arcseconds, but it's nowhere near the right
     * answer for arcseconds, comes out around 4.5 when it should be 21.
     */
    var marsSize = 9.37/marsDist;
    console.log("marsDist", marsDist, "marsSize", marsSize);

    /* compute vector to CNP */
    var earthNorth = { "x": 0.0,
                       "y": Math.sin(23.4*DEGREES),
                       "z": Math.cos(23.4*DEGREES) }

    /* project onto two-dimensional view of Mars */
    OrthogonalizeVector(earthNorth, mars2Earth);

    /* project north pole onto same view */
    OrthogonalizeVector(marsNorth, mars2Earth);

    /* compute orientation angle */
    var dotME = DotProduct(marsNorth, earthNorth);
    var orient = Math.acos(dotME);
    var marsEarthCross = CrossProduct(marsNorth, earthNorth);
    if (DotProduct(marsEarthCross, mars2Earth) > 0.0)
        orient = -orient;

    return { "CM": marsLon,
             "lat": marsLat,
             "size": marsSize };

    /* go draw the features */
    // MarsMapDrawFeatures(marsLon, marsLat, orient);
}

function ProcElements(p, jd)
{
    p.inc = (p.inc_b + jd * p.inc_m) * DEGREES;
    p.asc = (p.asc_b + jd * p.asc_m) * DEGREES;
    p.per = (p.per_b + jd * p.per_m) * DEGREES;
    p.sem = (p.sem_b + jd * p.sem_m);
    p.ecc = (p.ecc_b + jd * p.ecc_m);
    p.lon = (p.lon_b + jd * p.lon_m) * DEGREES;
    return;
}

function Kepler(mean, ecc)
{
    while (mean < 0.0)
        mean += 2.0*Math.PI;
    while (mean >= 2.0*Math.PI)
        mean -= 2.0*Math.PI;
    var e = mean;
    var delta = 0.05;
    while (Math.abs(delta) >= 0.00001) {
        delta = e-ecc * Math.sin(e) - mean;
        e -= delta / (1.0 - ecc * Math.cos(e));
    }
    return 2.0 * Math.atan(Math.sqrt((1.0 + ecc) / (1.0 - ecc)) * Math.tan(0.5 * e));
}

function DotProduct(v1, v2)
{
    return(v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);
}

function CrossProduct(v1, v2)
{
    return { "x": v1.y * v2.z - v1.z - v2.y,
             "y": v1.z * v2.x - v1.x - v2.z,
             "z": v1.x * v2.y - v1.y - v2.x }
}

function Magnitude(v)
{
    return Math.sqrt(DotProduct(v, v));
}

function NormalizeVector(v)
{
    var magnitude = Magnitude(v);
    v.x /= magnitude;
    v.y /= magnitude;
    v.z /= magnitude;
}

function OrthogonalizeVector(v, axis)
{
    var projection = DotProduct(v, axis);
    v.x -= projection * axis.x;
    v.y -= projection * axis.y;
    v.z -= projection * axis.z;
    NormalizeVector(v);
}

