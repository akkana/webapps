//
// A collection of date and time utilities for use with the datetimepicker.
//

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

  if (!timeString)
    return null;

  console.log("Parsing date " + timeString);

  // H:M:S +TZ
  var timeArray = /(\d{1,2}):(\d{1,2}):(\d{1,2}) ([\+-]\d)/.exec(timeString);
  if (timeArray) {
    console.log("1", timeArray);
    hour = +timeArray[1];
    min = +timeArray[2];
    sec = +timeArray[3];
    tzoffset = +timeArray[4];
  } else {
    // H:M:S
    timeArray = /(\d{1,2}):(\d{1,2}):(\d{1,2})/.exec(timeString);
    if (timeArray) {
      console.log("2", timeArray);
      hour = +timeArray[1];
      min = +timeArray[2];
      sec = +timeArray[3];
      tzoffset = null;
    } else {
      // H:M +TZ
      timeArray = /(\d{1,2}):(\d{1,2}) \+(\d)/.exec(timeString);
      if (timeArray) {
        console.log("3", timeArray);
        hour = +timeArray[1];
        min = +timeArray[2];
        sec = 0;
        tzoffset = +timeArray[4];
      } else {
        // H:M
        timeArray = /(\d{1,2}):(\d{1,2})/.exec(timeString);
        console.log("4", timeArray);
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

function daysBetween(d1, d2) {
    return ((d2.getTime() - d1.getTime())) / (24.*60.*60.*1000.);
}

function getJulianDate(d) {
    return (daysBetween(new Date("Jan 1 0:00 PST 1970"), d)
            + 2440587.83333333333);
}


function datetime2str(d) {
    return date2str(d) + " " + time2str(d);
}

function date2str(d) {
    return "" + d.getFullYear() + '-' + leading0(+d.getMonth()+1) + '-'
        + leading0(d.getDate());
}

function time2str(d) {
    console.log("time2str", d);
    var s = "" + leading0(d.getHours()) + ":" + leading0(d.getMinutes())
        + ":" + leading0(d.getSeconds());
    // Javascript timezone offset is in minutes. Convert to hours..
    // getTimezoneOffset() has a reverse sign from what users expect to see.
    var tzoffset = d.getTimezoneOffset()/60;
    if (tzoffset <= 0)
        s += " +" + -tzoffset;
    else
        s += " -" + tzoffset;
    console.log("  ... ", s);
    return s;
}

// OMG the list of things Javascript doesn't have built in!
// Quickie function to add leading zeroes for 2-digit numbers.
function leading0(n) {
  if (n < 10)
    return '0' + n;
  else
    return n;
}
