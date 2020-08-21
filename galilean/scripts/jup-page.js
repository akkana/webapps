/* -*- Mode: Javascript; js-indent-level: 2; indent-tabs-mode: nil; -*- */

// Javascript code to display Jupiter, its moons and their shadows.

var jup = null;

function initpage() {
  //calendar.set("datefield", useNewDate);

  var date = null;

  // Call the code that calculates the positions, defined in jupiter.js.
  jup = new Jupiter();

  if (!date)
    date = new Date();

  updateDateTimeFields(date);

  useNewDate();
}

function reset2now() {
  console.log("Resetting to now");
  curDate = new Date();
  document.getElementById("datetimeinput").value = datetime2str(curDate);
  useNewDate();
}

function updateDateTimeFields(d) {
  /*
  console.log("updateDateTimeFields " + d);
  console.log("tzoffset: " + d.getTimezoneOffset()/60);
  console.log("datetime2str thinks " + datetime2str(d));
  */
  document.getElementById("datetimeinput").value = datetime2str(d);
}

// A place to store the last width and height we measured.
var gfxWidth, gfxHeight;

// Are we reversing left and right?
var reverseX = false;

// Are we reversing top and bottom?
var reverseY = false;

function screenWidth() {
  // clientWidth, scrollWidth and offsetWidth all give the same result
  // in this case.
  gfxWidth = document.getElementById("jupframe").clientWidth;
  if (gfxWidth != null) {
    gfxWidth = +gfxWidth;
    gfxHeight = +document.getElementById("jupframe").clientHeight;
    return gfxWidth;
  }
  gfxWidth = window.innerWidth;
  if (gfxWidth != null) {
    gfxWidth = +gfxWidth;
    gfxHeight = +window.innerHeight;
    return gfxWidth;
  }
  gfxWidth = document.documentElement.clientWidth;
  if (gfxWidth != null) {
    gfxWidth = +gfxWidth;
    gfxHeight = +document.documentElement.clientHeight;
    return gfxWidth;
  }
  gfxWidth = document.body.clientWidth;    // For IE8
  if (gfxWidth != null) {
    gfxWidth = +gfxWidth;
    gfxHeight = +document.body.clientHeight;    // For IE8
    return gfxWidth;
  }
  gfxWidth = 800;
  gfxHeight = 300;
  return gfxWidth;
}

function basename(str)
{
  if (!str)
    return "undefined";
  var base = new String(str).substring(str.lastIndexOf('/') + 1);
  if (base.lastIndexOf(".") != -1)
    base = base.substring(0, base.lastIndexOf("."));
  return base;
}

// Place an image or other element: could be a text label, etc.
// as long as it's an element with position: absolute.
// left must be provided but the other arguments can be omitted,
// in which case they won't be changed.
// If width and height are supplied, set the image's width and height
// (so it will scale if necessary), and place the image
// so that it's centered on the given coordinates.
function placeImage(im, left, top, width, height) {
  if (!width)
    width = 0;
  if (!height) {
    if (width)
      height = width;
    else
      height = 0;
  }

  if (reverseX)
    leftpx = gfxWidth - left - width/2;
  else
    leftpx = left - width/2;

  if (top) {
    if (reverseY)
      toppx = gfxHeight - top - height/2;
    else
      toppx = top - height/2;
  }

  im.style.left = leftpx;
  if (top)
    im.style.top = toppx;

  if (width) {
    im.width = width;
    if (height) {
      im.height = height;
    } else {
      im.height = width;   // assume square if width but not height specified
    }
  }
  else {    // no width or height specified
    im.style.left = leftpx;
    if (top)
      im.style.top = toppx;
  }

  im.style.visibility = "visible";
  console.log("placed", im.id, "at", im.style.left, im.style.top);
  return [ leftpx, toppx ];
}

// Parse a date and time in form YYYY-MM-DD HH:MM:SS +TZ.
// Return UTC time, already corrected for timezone.
// If no timezone, assume the time is UTC.
function parseDateTime(dateTimeString) {
  // The date regexp is easy, YYYY-MM-DD
  var re_date = /(\d{4})-(\d{1,2})-(\d{1,2}) *([0-9].*)$/;
  var dateArray = re_date.exec(dateTimeString);

  // The time array is more complicated because it has optional parts.
  // It could be H:M, H:M:S, H:M +TZ or H:M:S +TZ.
  // If +TZ is missing, we'll assume localtime.
  // It's hard to do this as one regexp; if the last group is missing
  // then JS mysteriously makes the FIRST array item NaN.
  // There's no easy way of distinguishing which of the two
  // optional fields was present.
  // Using separate regexps is easier.
  // XXX This doesn't allow for -tzoffset. Is that ever used?
  var timeString = dateArray[4];
  var hour, min, sec, tzoffset;

  console.log("Parsing date " + timeString);

  // H:M:S +TZ
  var timeArray = /(\d{1,2}):(\d{1,2}):(\d{1,2}) ([\+-]\d)/.exec(timeString);
  if (timeArray) {
    hour = +timeArray[1];
    min = +timeArray[2];
    sec = +timeArray[3];
    tzoffset = +timeArray[4];
  } else {
    // H:M:S
    timeArray = /(\d{1,2}):(\d{1,2}):(\d{1,2})/.exec(timeString);
    if (timeArray) {
      hour = +timeArray[1];
      min = +timeArray[2];
      sec = +timeArray[3];
      tzoffset = null;
    } else {
      // H:M +TZ
      timeArray = /(\d{1,2}):(\d{1,2}) \+(\d)/.exec(timeString);
      if (timeArray) {
        hour = +timeArray[1];
        min = +timeArray[2];
        sec = 0;
        tzoffset = +timeArray[4];
      } else {
        // H:M
        timeArray = /(\d{1,2}):(\d{1,2})/.exec(timeString);
        if (timeArray) {
          hour = +timeArray[1];
          min = +timeArray[2];
          sec = 0;
          tzoffset = null;
        }
      }
    }
  }
  if (!timeArray)
    return null;

  var d;
  if (tzoffset)
    return new Date(Date.UTC(
        +dateArray[1],
        +dateArray[2]-1, // Careful, month starts at 0!
        +dateArray[3],
        hour - tzoffset, min, sec
    ));
  else
    // If no timezone offset specified, new Date() will assume localtime.
    return new Date(
        +dateArray[1],
        +dateArray[2]-1, // Careful, month starts at 0!
        +dateArray[3],
        hour, min, sec
    );
}

// Update Jupiter and predict upcoming events based on whatever
// date is in the date field of the page.
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

  drawJupiter(jup, d);
  predictUpcoming();
}

window.onresize = useNewDate;

// Add or subtract hours (or days) from jupiter's current time.
// Update the date field and the graphics.
function addHours(hrs) {
  var d = jup.getDate();
  d.setTime(d.getTime() + 60 * 60 * hrs * 1000);
  document.getElementById("datetimeinput").value = datetime2str(d);
  drawJupiter(jup, d);
  predictUpcoming();
}

// Animate:
var animating = false;
var animateTime = 100;  // default msec delay between steps
var stepMinutes = 10;   // default time to advance in each step

function animateStep() {
  if (! animating)
    return;
  var d = jup.getDate();
  d.setTime(d.getTime() + stepMinutes * 60 * 1000);
  drawJupiter(jup, d);
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
  btn = document.getElementById("animate");
  if (animating) {
    btn.value = "Stop";
    animateStep();
  }
  else {
    btn.value = "Animate";
    predictUpcoming();
  }
}

var busy;

function drawJupiter(jup, date) {
  busy = document.getElementById("recalculating")
  busy.style.visibility = "visible";

  jup.setDate(date);

  var width = screenWidth();
  var halfwidth = width/2;
  var height = 100;
  var halfheight = height/2;

  // smalljup.png is 60x60, so jupiter's radius in the image is 30px.
  // Adjust its size according to the width of the display.
  // If we want to be able to show Callisto in its farthest position,
  // Callisto's orbit is jupRadius * 1,883,000 km / 71492 km or 26.3.
  //var jupRadius = 19;
  var jupRadius = halfwidth / 26.3;
  var spotWidth = 26 * jupRadius / 30;
  var spotHeight = 13 * jupRadius / 30;

  // Make sure Jupiter is properly centered:
  var jupimg = document.getElementById("jupiter");
  if (jupimg) {
    jupimg.width = jupimg.height = 2 * jupRadius;
    console.log("Placing Jupiter image at", halfwidth, halfheight,
                "diameter", jupRadius*2);
    placeImage(jupimg, halfwidth, halfheight, jupRadius*2);
  }

  // Are we reversing?
  // Note that we do this *after* drawing Jupiter.
  // Jupiter always goes in the center regardless of the orientation.
  orientationSel = document.getElementById("orientation");
  orientation = orientationSel.options[orientationSel.selectedIndex].value;
  if (orientation == "NupWright") {
    reverseX = false;
    reverseY = false;
  }
  else if (orientation == "NupEright") {
    reverseX = true;
    reverseY = false;
  }
  else if (orientation == "SupEright") {
    reverseX = true;
    reverseY = true;
  }
  else if (orientation == "SupWright") {
    reverseX = false;
    reverseY = true;
  }

  // The GRS:
  // the system 2 longitude of the spot drifts around,
  // so this needs to be updated regularly.
  // http://jupos.privat.t-online.de/ is a good resource.
  // Last updated 2020-08-20
  var coord = jup.getRedSpotXY(337);

  var spotimg = document.getElementById("grs");
  var label = document.getElementById("grslabel");

  // Is the GRS currently visible?
  if (spotimg && !isNaN(coord.x) && !isNaN(coord.y)) {
    var jr = jupRadius * .9;   // approx radius at spot's latitude

    var sw = spotWidth;

    // XXX Calculate foreshortening if near the limb.
    // The GRS is roughly 30 degrees wide.
    //var halfSpotAngle = 15 * Math.PI / 180.;
    // But for now, just fudge it.
    //console.log("coord.x is", coord.x);
    if (Math.abs(coord.x) > .98) {
      sw = sw/3.;
      //console.log("**** Foreshortening spot more, to", sw);
    }
    if (Math.abs(coord.x) > .85) {
      sw = sw/2.;
      //console.log("**** Foreshortening spot to", sw);
    }
    //else
    //  console.log("**** NOT Foreshortening,", sw);

    var sx = halfwidth + coord.x * jr;
    var sy = halfheight + coord.y * jupRadius;
    placeImage(spotimg, sx, sy, sw, spotHeight);
    if (label) {
      placeImage(label, sx);
    }

    // Clip the spot so it doesn't go outside of Jupiter.
    // The spot image goes from sx - sw/2 to sx + sw/2
    // or from spotimg.style.left to spotimg.style.left + sw.
    // Jupiter is centered at halfwidth, halfheight and has radius jupRadius.
    // To use clip-path, you need a circle the same size as the jupiter image,
    // centered where the jupiter image is MINUS the offset (not center)
    // of the spot image.
    // console.log("halfwidth, halfheight", halfwidth, halfheight);
    // console.log("sw is", sw, "halfwidth", sw/2, "halfheight", spotHeight/2);
    // console.log("subtracting", sx - sw/2, sy - spotHeight/2);
    // console.log("Spot position is", spotimg.style.left, spotimg.style.top);
    clipPathX = halfwidth - sx + sw/2;
    clipPathY = halfheight - sy + spotHeight/2;
    // console.log("clipPathX = ", halfwidth, "-", sx, "-", spotWidth/2,
    //             "=", clipPathX);
    // console.log("clipPathY = ", halfheight, "-", sy, "-", spotHeight/2,
    //             "=", clipPathY);
    clippath = "circle(" + jupRadius + "px at " + clipPathX + "px "
      + clipPathY + "px)";

    //console.log("Clip path:", clippath);
    spotimg.style.clipPath = clippath;
  }
  // else it's invisible and needs to be hidden
  else if (spotimg) {
    spotimg.style.visibility = "hidden";
    if (label) {
      label.style.visibility = "hidden";
    }
  }

  for (var whichmoon = 0; whichmoon < 4; ++whichmoon) {
    // First handle the shadow
    var moondata = jup.getMoonXYData(whichmoon);

    img = document.getElementById("shadow" + whichmoon);
    label = document.getElementById("slabel" + whichmoon);
    if (img && !isNaN(moondata.shadowx) && !isNaN(moondata.shadowy)) {
      img.setAttribute("src", "images/moonshadow.png");
      var x = moondata.shadowx * jupRadius + halfwidth;
      placeImage(img, x, moondata.shadowy * jupRadius + halfheight);

      // Place the label too:
      if (label) {
        placeImage(label, x);
      }
    }
    else if (img) {
      img.style.visibility = "hidden";
      if (label) {
        label.style.visibility = "hidden";
      }
    }

    // Now, with the shadow done, handle the moon itself:
    img = document.getElementById("moon" + whichmoon);
    label = document.getElementById("label" + whichmoon);
    var eclipselabel = document.getElementById("elabel" + whichmoon);
    var x = moondata.moonx * jupRadius + halfwidth;
    if (moondata.eclipse) {
      placeImage(eclipselabel, x);
      if (img)
        img.style.visibility = "hidden";
      if (label)
        label.style.visibility = "hidden";
    }
    else if (img && !isNaN(moondata.moonx) && !isNaN(moondata.moony)) {
      img.setAttribute("src", "images/borderedmoon.png");
      placeImage(img, x, moondata.moony * jupRadius + halfheight);
      if (moondata.farside)
        img.style.zIndex = 1;
      else
        img.style.zIndex = 100;

      // Place the label too:
      if (label)
        placeImage(label, x);

      if (eclipselabel)
        eclipselabel.style.visibility = "hidden";
    }
    else {
      if (img)
        img.style.visibility = "hidden";
      if (label)
        label.style.visibility = "hidden";
      if (eclipselabel)
        eclipselabel.style.visibility = "hidden";
    }
  }

  busy.style.visibility = "hidden";
  console.log("jup.getDate() says " + jup.getDate());
  updateDateTimeFields(jup.getDate());
}

function predictUpcoming()
{
  busy.style.visibility = "visible";
  var upcoming = document.getElementById("upcoming");
  if (!upcoming) return;
  upcomingStr = upcomingEvents(jup.getDate(),
                    parseInt(document.getElementById("upcoming-hrs").value));
  upcoming.innerHTML = upcomingStr.replace(/\n/g, "<br>\n");;
  //upcoming.value = upcomingStr;
  //upcoming.appendChild(document.createTextNode(upcomingStr));
  busy.style.visibility = "hidden";
}

function printUpcoming()
{
  var upcoming = document.getElementById("upcoming");
  if (!upcoming) return;
  predictUpcoming();
  newWindow = window.open("data:text/html;charset=utf-8," +
                          encodeURI("<pre>" + upcoming.innerHTML + "</pre>"),
                          "",
                          "width=640,height=480,location=no,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes");
}
