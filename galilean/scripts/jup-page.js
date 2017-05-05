/* -*- Mode: Javascript; js-indent-level: 2; indent-tabs-mode: nil; -*- */

// Javascript code to display Jupiter, its moons and their shadows.

var jup = null;

function initpage() {
  //calendar.set("datefield", useNewDate);

  var date = null;

  /*
    COMMENTED OUT FOR NOW. OUR DATE FIELD FORMAT IS CHANGING ANYWAY.
    // Did the user specify a date in the URL?
    var url = new String(document.location);
    var idx = url.indexOf("?");
    if (idx > 0) {
    idx = url.indexOf("date=", idx);
    if (idx > 0) {
      date = new Date(decodeURIComponent(url.substr(idx + 5)));
      // Discussion of the three decoding options in javascript:
      // http://unixpapa.com/js/querystring.html
      // http://stackoverflow.com/questions/747641/what-is-the-difference-between-decodeuricomponent-and-decodeuri
      }
    }

  if (!date) {
    //date = new Date();
    date = parseDateTime("2017-05-17");
    updateDate(date);
  }
  */

  // Call the code that calculates the positions, defined in jupiter.js.
  jup = new Jupiter();

  if (!date)
    date = new Date();

  updateDateTimeFields(date);

  useNewDate();
}

function updateDateTimeFields(d) {
  /*
  alert("updating " + d);
  alert("Setting date field to '" + date2str(d) + "'");
  alert("Setting time field to '" + time2str(d) + "'");
  */
  //alert("Setting date time fields to '" + date2str(d) + "' and '"
  //      + time2str(d) + "' from " + d);
  //document.getElementById("datefield").value = date2str(d);
  //document.getElementById("timefield").value = time2str(d);
  document.getElementById("datetimeinput").value = datetime2str(d);
}

function screenWidth() {
  if (window.innerWidth != null)
    return window.innerWidth;
  if (document.documentElement.clientWidth)
    return document.documentElement.clientWidth;
  if (document.body.clientWidth)    // For IE8
    return document.body.clientWidth;
  return 800;
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

function placeImage(im, left, top, width, height) {
  im.style.left = left;
  if (top) {
    im.style.top = top;
  }
  if (width) {
    im.width = width;
    if (height) {
      im.height = height;
    } else {
      im.height = width;   // assume square if width but not height specified
    }
  }
  im.style.visibility = "visible";
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

  // H:M:S +TZ
  var timeArray = /(\d{1,2}):(\d{1,2}):(\d{1,2}) ([\+-]\d)/.exec(timeString);
  //alert("timeArray: " + timeArray);
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
      //alert("timeArray: " + timeArray);
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
  if (!hour)
    return null;

  //alert(hour + ":" + min + ":" + sec + " + " + tzoffset);

  var d;
  if (tzoffset)
    return new Date(Date.UTC(
        +dateArray[1],
        +dateArray[2]-1, // Careful, month starts at 0!
        +dateArray[3],
        hour + tzoffset, min, sec
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
  var d = parseDateTime(document.getElementById("datetimeinput").value);

  if (!d) {
    alert("Couldn't parse date/time '"
          + document.getElementById("datetimeinput").value);
    return;
  }

  drawJupiter(jup, d);
  predictUpcoming();
}

/*
// Update the date field to the given date, then call useNewDate().
function updateDate(newdate)
{
  var datefield = document.getElementById("datefield");
  if (!datefield) {
    return;
  }
  alert("datestring:" + newdate.toDateString());
  datefield.value = newdate.toDateString();
  useNewDate();
}
*/

function addHours(hrs) {
  var d = jup.getDate();
  d.setTime(d.getTime() + 60 * 60 * hrs * 1000);
  updateDate(d);
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
  if (animating) {
    animateStep();
  }
  else {
    predictUpcoming();
  }
}

var busy;

function drawJupiter(jup, date) {
  busy = document.getElementById("recalculating")
  busy.style.visibility = "visible";

  jup.setDate(date);

  var width = parseInt(screenWidth() * .99);
  var halfwidth = width/2;
  var height = 100;
  var halfheight = height/2;
  var jupRadius = 19;
  var spotWidth = 27 * jupRadius / 30;
  var spotHeight = 13 * jupRadius / 30;

  // Make sure Jupiter is properly centered:
  var img = document.getElementById("jupiter");
  if (img) {
    placeImage(img, halfwidth - jupRadius, halfheight - jupRadius, jupRadius*2);
  }

  // The GRS:
  // the system 2 longitude of the spot drifts around,
  // so this needs to be updated regularly.
  // http://jupos.privat.t-online.de/ is a good resource.
  var coord = jup.getRedSpotXY(224);
  var img = document.getElementById("grs");
  var label = document.getElementById("grslabel");

  if (img && !isNaN(coord.x) && !isNaN(coord.y)) {
    // XXX Need some extra code here to make width smaller if the GRS
    // XXX is near the limb and foreshortened.
    var sx = halfwidth + coord.x * jupRadius - spotWidth/2;
    var sw = spotWidth;
    var jr = jupRadius * .8;   // approx radius at spot's latitude
    if (sx < halfwidth - jr) {
      sw = sw - halfwidth - jr - sx;
      sx = halfwidth - jr
    } else if (sx + sw > halfwidth + jr) {
      sw = halfwidth + jr - sx;
    }
    placeImage(img, sx, coord.y * jupRadius + halfheight - spotHeight/2,
               sw, spotHeight);
    if (label) {
      placeImage(label, sx);
    }
  }
  else if (img) {
    img.style.visibility = "hidden";
    if (label) {
      label.style.visibility = "hidden";
    }
  }
  else { alert("no grs image"); }

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
    if (moondata.eclipse) {
      var x = moondata.moonx * jupRadius + halfwidth;
      placeImage(eclipselabel, x);
      if (img)
        img.style.visibility = "hidden";
      if (label)
        label.style.visibility = "hidden";
    }
    else if (img && !isNaN(moondata.moonx) && !isNaN(moondata.moony)) {
      img.setAttribute("src", "images/borderedmoon.png");
      var x = moondata.moonx * jupRadius + halfwidth;
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
