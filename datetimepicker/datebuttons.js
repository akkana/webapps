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
// Get the date/time from the datetimepicker
//
function getPickerDate() {
    return parseDateTime(document.getElementById("datetimeinput").value);
}

function addHours(hrs) {
    console.log("addHours", hrs);
    var d = getPickerDate();
    d.setTime(d.getTime() + 60 * 60 * hrs * 1000);

    datetimeinput = document.getElementById("datetimeinput");
    if (datetimeinput)
        datetimeinput.defaultvalue = datetime2str(d);

    if (dateChangeCallback)
        dateChangeCallback(d);
}

//
// Reset the time to now, and redraw.
//
function reset2now() {
    d = new Date();

    datetimeinput = document.getElementById("datetimeinput");
    if (datetimeinput)
        datetimeinput.defaultvalue = datetime2str(d);

    if (dateChangeCallback)
        dateChangeCallback(d);
}
