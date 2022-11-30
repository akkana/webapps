
// The widget will be created inside a span (or other element) of this class,
// replacing anything that was there before:
const WIDGET_NAME = "astrotimewidget";

// Some things, like the reload image, are relative to the current script
var scriptloc = dirname(document.currentScript.src);

function scriptLoader(path, callback) {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.async = true;
    script.src = path;
    script.onload = function() {
        if(typeof(callback) == "function") {
            callback();
        }
        // console.log("Loaded script", path);
    }
    try {
        var scriptOne = document.getElementsByTagName('script')[0];
        scriptOne.parentNode.insertBefore(script, scriptOne);
    }
    catch(e) {
        document.getElementsByTagName("head")[0].appendChild(script);
    }
}

// astrotimewidget depends on datetimepicker, which depends on datetimes:
scriptLoader(scriptloc + "/datetimes.js");
scriptLoader(scriptloc + "/datebuttons.js");

// When the datepicker is finished loading, set it to the current time
scriptLoader(scriptloc + "/datetimepicker.js", function() { reset2now(); });

// Find where to put the widget
var widgetParent = document.getElementById(WIDGET_NAME);
// else just make it the last child of the body
if (!widgetParent) {
    widgetParent = document.createElement("div");
    widgetParent.id = WIDGET_NAME;
    document.body.appendChild(widgetParent);
}

function dirname(s)
{
  var slash = s.lastIndexOf('/');
  if (slash < 0)
    return s;
  return s.substring(0, slash);
}

function astroTimeWidgetCallback(d) {
    show_ut = document.getElementById("show-ut");
    if (show_ut)
        show_ut.innerHTML = "<small>(" + d.toUTCString() + ")</small>";
}

var html = `<table class="valign-row"><tr>
<td><input type="text" id="datetimeinput" />
<!-- Set the size a lot smaller than the actual number of characters --
  -- we need: a lot of them are colons, slashes or 1,
  -- and the size will be set by ems.
  -->
<td><input type="image" class="calendarbtn" src="` + dirname(scriptloc) +
`/datetimepicker/datetimeimages/cal.gif" title="Date/time picker"
 onclick="javascript:NewCssCal('datetimeinput','yyyyMMdd','dropdown',true,'24',false,null,useNewDate)" />

<td>
<input type="button" name="now" id="now" value="Now" title="Current time"
 onClick="reset2now(); return true">

<td>
<input class="recalcbtn" type="image" src="` + scriptloc + `/images/reload.png"
 title="Recalculate" onClick="useNewDate(); return true">

<!-- Universal Time -->
<tr><td colspan=3 id="show-ut"></td></tr>

</table>

<!-- In theory, cal-container sets up a relative item
     and then calBorder can be positioned absolutely inside that.
     It sorta works, anyway ...
     http://stackoverflow.com/questions/6040005/relatively-position-an-element-without-it-taking-up-space-in-document-flow
 -->
<p>
<span id="cal-widget">
  <span id="calBorder"></span>
</span>

<p>
<input type="button" id="prevDay" name="prevDay" value="-day" onClick="addHours(-24);">
<input type="button" id="prevHour" name="prevHour" value="-hour" onClick="addHours(-1);">
<input type="button" id="prevMins" name="prevMins" value="-5 min" onClick="addHours(-1/12);">
<input type="button" id="nextMins" name="nextMins" value="+5 min" onClick="addHours(1/12);">
<input type="button" id="nextHour" name="nextHour" value="+hour" onClick="addHours(1);">
<input type="button" id="nextDay" name="nextDay" value="+day" onClick="addHours(24);">

<!-- Animations -->
<p id="show-animation">
<input type="button" id="animate" name="animate" value="Animate"
       onClick="toggleAnimation();">
<input type="button" name="faster" value="faster" onClick="animateFaster(20);">
<input type="button" name="slower" value="slower" onClick="animateFaster(-20);">
<span id="animDelay">(100 msec)</span>
</p>

<!-- Orientation selector -->
<p id="show-orientation">
Orientation:
<select name='orientation' id='orientation' onChange="useNewDate();">
<option value="NupWright" selected>N up, W right (normal)
<option value="NupEright">N up, E right (reversed)
<option value="SupEright">S up, E right (upside down)
<option value="SupWright">S up, W right (upside down reversed)
</select>
</p>
</div>`;

widgetParent.innerHTML = html;

