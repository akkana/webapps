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
        console.log("Scroll down");
        document.getElementById("maincontent").contentWindow.scrollBy(0, screenHeight/2)
        // window.scrollBy(0, screenHeight/2);
    }
    else if (event.clientY < TOP && (event.clientX < LEFT
                                     || event.clientX > RIGHT)) {
        console.log("Scroll up");
        document.getElementById("maincontent").contentWindow.scrollBy(0, -screenHeight/2)
    }
}

function TOCPage() {
    var tocPages = TOC();

    // Format as HTML:
}

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
}

