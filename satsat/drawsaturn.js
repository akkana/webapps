//
// Code for drawing Saturn and its moons, calculated in satsat.js.
//

var ctx;

const skyC = "black";
const planetC = "white";

const canvas = document.getElementById("satCanvas");

//
// Initial function called on page load.
//
function initpage() {
  var date = null;

  if (!date)
    date = new Date();

  updateDateTimeFields(date);

  useNewDate();
}

//
// Update Saturn to whatever date is in the date field of the page.
//
function useNewDate()
{
  // parse date and time from the two fields:
  console.log("datetimeinput value is "
              + document.getElementById("datetimeinput").value);
  var d = parseDateTime(document.getElementById("datetimeinput").value);

  if (!d) {
    alert("Couldn't parse date/time '"
          + document.getElementById("datetimeinput").value);
    return;
  }

  console.log("useNewDate: " + d);
  DrawSaturn(d);
}

//
// Update the fields in the calendar picker
//
function updateDateTimeFields(d) {
  console.log("updateDateTimeFields " + d);
  console.log("tzoffset: " + d.getTimezoneOffset()/60);
  console.log("datetime2str thinks " + datetime2str(d));
  document.getElementById("datetimeinput").value = datetime2str(d);
}

//
// Drawing primitives. Redefining these so trivially may seem silly,
// but it makes it so much easier to port to different languages/platforms.
//
function ChangeColor(c) {
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
}

function Line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function DrawString(x, y, s, l) {
    ctx.font = "14px Sans";
    ctx.fillText(s, x, y);
    console.log("Drawing text", s, "at", x, y);
}

function Oval(xc, yc, r, a1, a2, aspect, fill) {
    console.log("Oval", xc, yc, r, a1, a2, aspect, fill);
    // int ra = r * aspect;
    // XDrawArc(display, win, gc, xc-r, yc-ra, 2*r, 2*ra, 0, FULLCIRCLE);
    //                            x, y, width, height, angle1, angle2
    ctx.beginPath();
    console.log("aspect", aspect);
    console.log("ellipse", xc, yc, r, r * Math.abs(aspect), 0, 0, TWOPI);
    ctx.ellipse(xc, yc, r, r * Math.abs(aspect), 0, 0, TWOPI);
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
}

function Message(s) { console.log(s); }

function DrawMoon(xc, yc, i) {
    console.log("Drawing a moon at", xc, yc);
    const moonrad = 2;
    ChangeColor(planetC);
    ctx.fillRect(xc-moonrad, yc-moonrad, moonrad*2, moonrad*2);

    DrawString(xc, canvas.height-5, i, null);
}

//
// Finally, the function that calls SaturnOrbit and then draws it all.
//
function DrawSaturn(d)
{
    if (!canvas) {
        console.log("No canvas to draw on!");
    }
    ctx = canvas.getContext('2d');

    julianDate = getJulianDate(d);
    console.log(d, "Julian date:", julianDate);

    SaturnCalcs(julianDate);

    var Xmax = canvas.width;
    var Ymax = canvas.height;

    // XXX Should adjust scale according to canvas.width
    // Scale is such that the planet will be drawn at RS * Scale pixels
    // where RS is Saturn's radius in km, 60330.
    var Scale = 0.00017;    // Make Saturn about 10 px

    // Are we reversing?
    orientationSel = document.getElementById("orientation");
    orientation = orientationSel.options[orientationSel.selectedIndex].value;
    var flipNS;
    var flipEW;
    if (orientation == "NupWright") {
        flipEW = false;
        flipNS = false;
    }
    else if (orientation == "NupEright") {
        flipEW = true;
        flipNS = false;
    }
    else if (orientation == "SupEright") {
        flipEW = true;
        flipNS = true;
    }
    else if (orientation == "SupWright") {
        flipEW = false;
        flipNS = true;
    }

    var i;
    //var A1, A2;
    var tempX, tempY;
    var X, Y;
    var XC = Xmax / 2;
    var YC = Ymax / 2;

    console.log("in DrawSaturn, Inclination =", Inclination);
    var ringAspect = Math.sin(Inclination);    /* Aspect Ratio */

    tempY = Inclination / D2R;
    if (Inclination != 0)
    {
        Message("Inclination: " + Math.floor(tempY)
                + "." + Math.floor(Inclination*10./D2R - tempY*10.));
    }

    // Label the cardinal directions:
    ChangeColor(planetC);
    DrawString(XC,      10,     flipNS ? "-N-" : "-S-", 3);
    DrawString(XC,      Ymax-4, flipNS ? "-S-" : "-N-", 3);
    DrawString(Xmax-15, YC,     flipEW ? "-W"  : "-E",  2);
    DrawString(3,       YC,     flipEW ?  "E-" :  "W-", 2);

    // Clear the canvas
    ChangeColor(skyC);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ChangeColor(planetC);

    if (RS * Scale < 3)
    {
        /* Draw Saturn */
        i = 3;
        Line(XC-i,   YC,   XC, YC+i);
        Line(  XC, YC+i, XC+i,   YC);
        Line(XC+i,   YC,   XC, YC-i);
        Line(  XC, YC-i, XC-i,   YC);
        /* and the rings */
        Line(XC-i*2, YC, XC+i*2, YC);
    }
    else
    {
        /* Draw rings */
        console.log("Drawing rings:")
        console.log("Calling Oval", XC, YC, RS4 * Scale + 1, null, null, ringAspect, 1);
        Oval(XC, YC, RS4 * Scale + 1, null, null, ringAspect, 1);
        ChangeColor(skyC);
        Oval(XC, YC, RS3 * Scale - 1, null, null, ringAspect, 1);
        ChangeColor(planetC);
        Oval(XC, YC, RS2 * Scale + 1, null, null, ringAspect, 1);
        ChangeColor(skyC);
        Oval(XC, YC, RS1 * Scale - 1, null, null, ringAspect, 1);
        ChangeColor(planetC);

        /* Draw planet */
        console.log("Drawing planet:")
        Oval(XC, YC, RS * Scale, null, null, .9, 1);
    }

    /******************* DRAW MOONS (Earth View) *************************/
    console.log("Drawing moons:")
    for (i=0; i < NumMoons; ++i)
    {
        /* Orbital Paths */
        //if (satMoons[i].sma * Scale * ringAspect < Ymax / 4 && DrawOrbits)
        //    Oval(XC, YC, satMoons[i].sma * Scale, ringAspect, 0);
        X = XC - (satMoons[i].sma * Math.sin(satMoons[i].u) * Scale);
        Y = YC + (satMoons[i].sma * Math.cos(satMoons[i].u) * Math.sin(Inclination) * Scale);
        DrawMoon(flipEW ? Xmax-X : X, flipNS ? Ymax-Y : Y, i);
    }

    /********************* Iapetus' Orbit (Earth View) *******************/
    iapetus = satMoons[7]
    tempX = -1 * (iapetus.sma * Math.sin(iapetus.u) * Scale);
    tempY = Math.floor((iapetus.sma * Math.cos(iapetus.u) * Math.sin(IapInci) * Scale));
    X = XC + tempX * Math.cos(IapGam) + tempY * Math.sin(IapGam); /* Rotation */
    Y = YC - tempX * Math.sin(IapGam) + tempY * Math.cos(IapGam);
    if (X < Xmax && X >= 0)
    {
        if (Y <= (Ymax / 2 - 10) && Y >= 0)
        {
            /* Draw Iapetus */
            DrawMoon(flipEW ? Xmax-X : X, flipNS ? Ymax-Y : Y, 8);
         }
    }
}


