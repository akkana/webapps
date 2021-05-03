//
// Code for drawing Saturn and its moons, calculated in satsat.js.
//

var curDate = new Date();

var ctx;

const skyC = "black";
const planetC = "white";

const canvas = document.getElementById("satCanvas");

//
// Initial function called on page load.
//
function initpage() {
    curDate;

    updateDateTimeFields(curDate);

    console.log("**initpage");

    useNewDate(curDate);
}

//
// Get the date/time from the datetimepicker
//
function getPickerDate() {
    return parseDateTime(document.getElementById("datetimeinput").value);
}

//
// Set both curDate and the picker date.
// Does NOT call CalcAndDrawSaturn.
//
function setCurDate(d) {
    if (!d)
        curDate = new Date();
    else
        curDate = d;
    document.getElementById("datetimeinput").value = datetime2str(curDate);
}

//
// Update Saturn to whatever date is in the date field of the page.
//
function useNewDate(d)
{
    // parse date and time from the two fields:
    console.log("datetimeinput value is "
                + document.getElementById("datetimeinput").value);
    if (!d) {
        d = getPickerDate();

        if (!d) {
            alert("Couldn't parse date/time '"
                  + document.getElementById("datetimeinput").value);
            return;
        }
    }

    console.log("useNewDate: " + d);
    CalcAndDrawSaturn(d);
}

//
// Reset the time to now, and redraw.
//
function reset2now() {
    //selectDate(document.getElementById("datetimeinput"), new Date())
    setCurDate(new Date());
    useNewDate(curDate);
}

// Add or subtract hours (or days) from Saturn's's current time.
// Update the date field and the graphics.
function addHours(hrs) {
    var d = curDate;
    d.setTime(d.getTime() + 60 * 60 * hrs * 1000);
    setCurDate(d);

    CalcAndDrawSaturn(curDate);
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
    ctx.fillText(s, x, y);
}

function Oval(xc, yc, r, a1, a2, aspect, fill) {
    // int ra = r * aspect;
    // XDrawArc(display, win, gc, xc-r, yc-ra, 2*r, 2*ra, 0, FULLCIRCLE);
    //                            x, y, width, height, angle1, angle2
    ctx.beginPath();
    ctx.ellipse(xc, yc, r, r * Math.abs(aspect), 0, 0, TWOPI);
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
}

function Message(s) {
    console.log("Message:", s);
    ctx.textAlign = "end";
    ChangeColor("#ddf");
    DrawString(canvas.width - 10, 20, s, null);
}

function DrawMoon(xc, yc, which) {
    const moonrad = 2;     // "radius" (though square) of a moon

    // Draw with a slight shadow in case it gets drawn over the planet.
    ChangeColor("black");
    ctx.fillRect(xc-moonrad+1, yc-moonrad+1, moonrad*2, moonrad*2);
    ChangeColor(planetC);
    ctx.fillRect(xc-moonrad, yc-moonrad, moonrad*2, moonrad*2);

    // if (which == 7)
    //     console.log("Drawing Iapetus at", xc, yc);

    ChangeColor("yellow");
    DrawString(xc, canvas.height-22, which+1, null);

    ctx.textAlign = "left";

    if (yc < canvas.height/2) {
        textx = xc + 3;
        texty = yc - 3;
    } else {
        textx = xc + 3;
        texty = yc + 13;
    }
    // Draw with a slight shadow in case it gets drawn over the planet.
    ChangeColor("black");
    DrawString(textx+1, texty+1, satMoons[which].name, null);
    ChangeColor("yellow");
    DrawString(textx, texty, satMoons[which].name, null);
}

// Nutty canvas elements have two sizes: the actual canvas size doesn't
// necessarily correspond to the display size. Ensure they match:
function resizeCanvasToDisplaySize(canvas) {
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // If it'resolution doesn't match, change it
    if (canvas.width !== width || canvas.height !== height) {
        console.log("**** Resizing canvas from", canvas.width, canvas.height,
                    "to", width, height);
        canvas.width = width;
        canvas.height = height;
        return true;
    }

   return false;
}

//
// Detect canvas resizes
//

function setResizeHandler(callback, timeout) {
    var timer_id = undefined;
    window.addEventListener("resize", function() {
        if(timer_id != undefined) {
            clearTimeout(timer_id);
            timer_id = undefined;
        }
        timer_id = setTimeout(function() {
            timer_id = undefined;
            callback();
        }, timeout);
    });
}
setResizeHandler(DrawSaturn, 1500);

//
// Finally, the function that calls SaturnOrbit and then draws it all.
//
function CalcAndDrawSaturn(d)
{
    if (!canvas) {
        console.log("No canvas to draw on!");
    }

    if (!d)
        d = new Date();

    julianDate = getJulianDate(d);

    SaturnCalcs(julianDate);

    DrawSaturn();
}

function DrawSaturn()
{
    resizeCanvasToDisplaySize(canvas);

    ctx = canvas.getContext('2d');

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

    var ringAspect = Math.sin(Inclination);    /* Aspect Ratio */

    tempY = Inclination / D2R;

    // Clear the canvas
    ChangeColor(skyC);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Label the cardinal directions:
    ctx.font = "bold 17px Sans";
    ChangeColor(planetC);
    DrawString(XC,      15,     flipNS ? "-S-" : "-N-", 3);
    DrawString(XC,      Ymax-4, flipNS ? "-N-" : "-S-", 3);
    DrawString(Xmax-30, YC,     flipEW ?  "E-" :  "W-", 2);
    DrawString(10,      YC,     flipEW ? "-W"  : "-E",  2);

    Message("Inclination: " + Math.floor(tempY)
            + "." + Math.floor(Inclination*10./D2R - tempY*10.) + "\u00B0");

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
        Oval(XC, YC, RS4 * Scale + 1, null, null, ringAspect, 1);
        ChangeColor(skyC);
        Oval(XC, YC, RS3 * Scale - 1, null, null, ringAspect, 1);
        ChangeColor(planetC);
        Oval(XC, YC, RS2 * Scale + 1, null, null, ringAspect, 1);
        ChangeColor(skyC);
        Oval(XC, YC, RS1 * Scale - 1, null, null, ringAspect, 1);
        ChangeColor(planetC);

        /* Draw planet */
        Oval(XC, YC, RS * Scale, null, null, .9, 1);
    }

    /******************* DRAW MOONS (Earth View) *************************/
    ctx.font = "14px Sans";
    for (i=0; i < NumMoons-1; ++i)
    {
        /* Orbital Paths */
        //if (satMoons[i].sma * Scale * ringAspect < Ymax / 4 && DrawOrbits)
        //    Oval(XC, YC, satMoons[i].sma * Scale, ringAspect, 0);
        X = XC - (satMoons[i].sma * Math.sin(satMoons[i].u) * Scale);
        Y = YC + (satMoons[i].sma * Math.cos(satMoons[i].u) * Math.sin(Inclination) * Scale);
        DrawMoon(flipEW ? X : Xmax-X, flipNS ? Y : Ymax-Y, i);
    }

    /********************* Iapetus' Orbit (Earth View) *******************/
    /* ****************
       XXX Iapetus temporarily commented out until I find a way to get its u0
       ****************/
    iapetus = satMoons[7]
    tempX = -1 * (iapetus.sma * Math.sin(iapetus.u) * Scale);
    tempY = Math.floor((iapetus.sma * Math.cos(iapetus.u) * Math.sin(IapInci) * Scale));
    X = XC + tempX * Math.cos(IapGam) + tempY * Math.sin(IapGam); /* Rotation */
    Y = YC - tempX * Math.sin(IapGam) + tempY * Math.cos(IapGam);
    if (X < Xmax && X >= 0)
    {
        if (Y <= (Ymax / 2 - 10) && Y >= 0)
        {
            // Draw Iapetus
            DrawMoon(flipEW ? Xmax-X : X, flipNS ? Ymax-Y : Y, 7);
        }
        else {
            console.log("Iapetus Y out of bounds: would be at",
                        flipEW ? Xmax-X : X, flipNS ? Ymax-Y : Y);
        }
    }
    else {
        console.log("Iapetus X out of bounds: would be at",
                    flipEW ? Xmax-X : X, flipNS ? Ymax-Y : Y);
    }
}

//
// Animation:
//
var animating = false;
var animateTime = 100;  // default msec delay between steps
var stepMinutes = 10;   // default time to advance in each step

function animateStep() {
    if (! animating) {
        return;
    }
    curDate.setTime(curDate.getTime() + stepMinutes * 60 * 1000);
    CalcAndDrawSaturn(curDate);
    setTimeout("animateStep();", animateTime);
}

function animateFaster(amt) {
    animateTime -= amt;
    if (animateTime < 1)
        animateTime = 1;
    // If we got down to 1 millisecond, then when we slow down again
    // we'll have silly times like 21 milliseconds showing.
    // Round them off.
    else if (animateTime > 10 && (animateTime % 10) == 1)
        animateTime -= animateTime % 10;

    var animspan = document.getElementById("animDelay");
    animspan.innerHTML = "(" + animateTime + " msec)";
}

function toggleAnimation() {
    animating = !animating;
    console.log("Toggling animation to", animating);
    btn = document.getElementById("animate");
    if (animating) {
        btn.value = "Stop";
        animateStep();
    }
    else {
        btn.value = "Animate";
    }
}
