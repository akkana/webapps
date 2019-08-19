// Scrolling and other page-related functions for feedreader.

// In the HTML: <body onload="onPageLoad();">

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

    iframe = document.getElementById("maincontent");
    iframedoc = iframe.contentDocument || iframe.contentWindow.document;
    iframedoc.body.innerHTML = htmlsrc;
}


function iframe_onload() {
    iframe = document.getElementById("maincontent");
    iframedoc = iframe.contentDocument || iframe.contentWindow.document;
    console.log("location:", iframedoc.location);
    if (iframedoc.location.href.endsWith("feedread/initial.html")) {
        console.log("location is initial.html: redirecting to TOC");
        TOCpage();
    }
}

//
// Called on initial page load.
//
function onPageLoad() {
    readScreenSize();

    //var maincontent = document.getElementById("maincontent");
    //console.log("maincontent:", maincontent);
    // Clickhandler works on document but doens't seem to work on maincontent,
    // whether it's a div around the iframe or the iframe itself.
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

document.onHistoryGo = function() { console.log("onHistoryGo"); }

