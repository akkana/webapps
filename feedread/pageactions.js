// Scrolling and other page-related functions for feedreader.

// In the HTML: <body onload="onPageLoad();">

const TOCPAGE = "feedread/initial.html";

// Tapping in the corners will generate a page up or down.
// How close does it need to be? (Percent of screen width/height)
var X_CORNER = .2;
var Y_CORNER = .25;

// These will be set according to screen size.
var LEFT, RIGHT, TOP, BOTTOM;

// Read the screen size.
// XXX This should be called again when the window resizes/reconfigures.
var screenWidth = 800;
var screenHeight = 600;
function readScreenSize() {
    if (window.innerWidth != null)
        screenWidth = window.innerWidth;
    else if (document.documentElement.clientWidth)
        screenWidth = document.documentElement.clientWidth;
    LEFT = X_CORNER * screenWidth;
    RIGHT = (1. - X_CORNER) * screenWidth;

    if (window.innerHeight != null)
        screenHeight = window.innerHeight;
    else if (document.documentElement.clientHeight)
        screenHeight = document.documentElement.clientHeight;
    TOP = Y_CORNER * screenHeight;
    BOTTOM = (1. - Y_CORNER) * screenHeight;

    console.log("Screen size: " + screenWidth + "x" + screenHeight);
    console.log("LEFT " + LEFT + ", RIGHT " +  RIGHT
                + ", TOP " + TOP + ", BOTTOM " + BOTTOM);
}

function clickHandler(event)
{
    // IE doesn't see the event argument passed in, so get it this way:
    if (window.event) event = window.event;

    console.log("click: " + event.clientX + " / " + screenWidth
                + ", " + event.clientY + " / " + screenHeight);

    if (event.clientY > BOTTOM && (event.clientX < LEFT
                                   || event.clientX > RIGHT)) {
        //console.log("Scroll down");
        document.getElementById("maincontent").contentWindow
            .scrollBy(0, screenHeight * .9)
    }
    else if (event.clientY < TOP && (event.clientX < LEFT
                                     || event.clientX > RIGHT)) {
        //console.log("Scroll up");
        document.getElementById("maincontent").contentWindow
            .scrollBy(0, -screenHeight * .9)
    }
}

// Toggle the menu by clicking on the menu button
function toggleMenu() {
    document.getElementById("dropdown").classList.toggle("show");
}

// Ensure the menu is closed.
function popdownMenu() {
    document.getElementById("dropdown").classList.remove("show");
}

// Close the dropdown menu if the user clicks outside of it.
// This doesn't work reliably, because clicks over the iframe don't register
// in window.onclick.
/*
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        console.log("event target isn't a drop button");
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
    else
        console.log("Event target is a dropbutton!", event.target);
}
*/

//
// What level of content is currently shown?
// Returns 0 for the table of contents, 1 for a feed index page,
// 2 for anything else.
//
function contentLevel() {
    var loc = contentDoc().location.href;
    if (loc.endsWith(TOCPAGE))
        return 0;
    if (loc.endsWith("index.html"))
        return 1;
    return 2;
}

//
// Get the current feed, if any. Will return null if on the TOC page.
//
function getCurFeed() {
    var loc = contentDoc().location.href;
    if (loc.endsWith(TOCPAGE))
        return null;
    var locparts = loc.split('/');
    return locparts[locparts.length -2];
}

function contentDoc() {
    var iframe = document.getElementById("maincontent");
    return iframe.contentDocument || iframe.contentWindow.document;
}

//
//
function goBack(event) {
    console.log("goBack");

    /*
     * window.history.back() doesn't always do the right thing when going
     * back to the original TOC page. We could intercept it here and make
     * sure it's going to the right place; but then the browser sees it
     * as a forward, not a back, and the user can't use the Forward
     * button any more.
    if (contentLevel() == 1) {
        TOCpage();
        return;
    }
    */

    window.history.back();
}

//
// goForward can't do anything smart; we can't even tell whether it
// should be enabled, because that's explicitly disallowed from JS.
//
function goForward(event) {
    console.log("goForward");
    window.history.forward();
}

/*
function basename(path) {
    return path.replace(/.*\//, '');
}
*/

function dirname(path) {
    console.log("path", path, typeof path);
    return path.match(/.*\//);
}

async function deleteCurFeed() {
    var loc = contentDoc().location.href;
    if (loc.endsWith(TOCPAGE))
        return null;
    loc = dirname(loc);

    await deleteMatching(loc);

    TOCpage();
}

async function TOCpage() {
    var tocPages = await TOC();

    // Format as HTML:
    htmlsrc = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" type="text/css" title="Feeds" href="/feeds/feeds.css">

<title>Feeds</title>
</head>

<body>
`;

    var curDay = null;
    for (var i in tocPages) {
        if (tocPages[i].endsWith("index.html")) {
            parts = tocPages[i].split('/');
            var feedname = parts[parts.length-2];
            var day = parts[parts.length-3];
            if (curDay != day) {
                curDay = day;
                htmlsrc += "<h3>" + day + "</h3>\n";
            }
            htmlsrc += '<a href="' + tocPages[i] + '">'
                        + feedname + '</a><br />\n';
        }
    }

    contentDoc().body.innerHTML = htmlsrc;
}

//
// Enable/disable (true/false) UI buttons
//
function setBtnSensitive(btnname, active) {
    // The DOM does it backward:
    document.getElementById(btnname).disabled = !active
}


function iframe_onload() {
    iframedoc = contentDoc();
    console.log("location:", iframedoc.location);
    if (iframedoc.location.href.endsWith(TOCPAGE)) {
        TOCpage();
        setBtnSensitive("deleteBtn", false);
    }
    else
        setBtnSensitive("deleteBtn", true);
}

//
// Adjust the text size.
//
function textSize(direction) {
    var doc = contentDoc();
    //console.log("current:", doc.body.style.fontSize);
    if (!doc.body.style.fontSize) {
        console.log("No existing, setting size to 1.0em");
        doc.body.style.fontSize = "1.0em";
    }
    var newSize = parseFloat(doc.body.style.fontSize)
        + (direction * 0.2) + "em";
    doc.body.style.fontSize = newSize;
    //console.log("new text size:", newSize);
}

//
// Called on initial page load.
//
function onPageLoad() {
    readScreenSize();


    // Clickhandler doesn't work over the iframe,
    // whether on a div around the iframe or the iframe itself.
    // But it can work on a div that's showing on top of the iframe.
    //maincontent.onmousedown = clickHandler;
    //maincontent.addEventListener('click', clickHandler, false);
    var scrolldivs = document.getElementsByClassName("scrolldiv");
    for (var i in scrolldivs) {
        console.log(i, "scrolldiv");
        scrolldivs[i].onmousedown = clickHandler;
    }

    // This seems to have to be specified in the HTML.
    // I haven't found a way to set it from javascript.
    // None of these work, even though pages all over the web say they should.
    // Fortunately, onload= in the HTML does work.
    //iframe = document.getElementById("maincontent");
    //iframe.onload = iframe_onload;
    //iframe.attachEvent('load', iframe_onload, false);
    //iframe.addEventListener('load', iframe_onload, false)
}


