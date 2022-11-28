//
// Functions common to apps that use the datetimepicker,
// used for buttons like +hour, +day, Now, etc.
//
// Set the dateChangeCallback to whatever function you want run
// any time the date changes for any reason (it will be passed a Date).
//

var dateChangeCallback;

//
// Given a new date, calculate and redraw the planet.
//
function useNewDate(d) {
    // parse date and time from the text input field:
    console.log("datetimeinput value is "
                + document.getElementById("datetimeinput").value);
    if (!d) {
        d = parseDateTime(document.getElementById("datetimeinput").value);

        if (!d) {
            alert("Couldn't parse date/time '"
                  + document.getElementById("datetimeinput").value);
            return;
        }
    }

    if (dateChangeCallback)
        dateChangeCallback(d);
}

//
// Set the datetimepicker's date
//
function setPickerDate(d) {
    datetimeinput = document.getElementById("datetimeinput");
    if (! datetimeinput)
        return;

    datetimeinput.value = datetime2str(d);

    if (dateChangeCallback)
        dateChangeCallback(d);
}

//
// Get the date/time from the datetimepicker
//
function getPickerDate() {
    datetimeinput = document.getElementById("datetimeinput");
    if (!datetimeinput)
        return null;
    return parseDateTime(document.getElementById("datetimeinput").value);
}

function addHours(hrs) {
    console.log("addHours", hrs);
    var d = getPickerDate();
    d.setTime(d.getTime() + 60 * 60 * hrs * 1000);

    setPickerDate(d);
}

//
// Get the orientation, a string like "NupWright"
//
function getOrientation() {
    orientationSel = document.getElementById("orientation");
    console.log("orientationSel:", orientationSel);
    if (!orientationSel)
        return "NupWright";
    return orientationSel.options[orientationSel.selectedIndex].value;
}

//
// Reset the time to now
//
function reset2now() {
    setPickerDate(new Date());
}

//
// Animations
//
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
