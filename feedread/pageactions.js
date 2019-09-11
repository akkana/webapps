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

    var elm = event.srcElement.id;

    console.log("click: " + elm);
    // console.log(event.clientX, " / ", screenWidth,
    //             ", ", event.clientY, " / ", screenHeight);

    if (elm.startsWith("scrollarea_l")) {
        //console.log("Scroll down");
        document.getElementById("maincontent").contentWindow
            .scrollBy(0, screenHeight * .9)
    }
    else if (elm.startsWith("scrollarea_u")) {
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

async function deleteCurFeed() {
    var loc = contentDoc().location.href;
    if (loc.endsWith(TOCPAGE))
        return null;
    loc = dirname(loc);

    await deleteMatching(loc);

    TOCpage();
}

function setStatus(s) {
    statusline = document.getElementById("statusline");
    statusline.innerHTML = s;
    if (s)
        statusline.style.opacity = '.7';
    else
        statusline.style.opacity = '0';
}

async function TOCpage() {
    setStatus("");

    var tocPages = await TOC();

    // Format as HTML:
    htmlsrc = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" type="text/css" title="Feeds" href="/feedread/feeds/feeds.css">

<title>Feeds</title>
</head>

<body>
`;

    var curDay = null;
    for (var i in tocPages) {
        if (! tocPages[i].endsWith("index.html"))
            continue;

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

    contentDoc().body.innerHTML = htmlsrc;
}

//
// Enable/disable (true/false) UI buttons
//
function setBtnSensitive(btnname, active) {
    // The DOM does it backward:
    document.getElementById(btnname).disabled = !active
}

function handleOutsideLink(url, ans) {
    // ans values are 0=Save, 1=Visit, 2=Cancel
    if (ans == 2) {
        console.log("Cancel");
        return;
    }
    if (ans == 0) {
        console.log("Save link for later -- if only I could!", url);
        return;
    }
    if (ans == 1) {
        console.log("Trying to open in a new window:", url);
        // Open in a new window/tab
        console.log("opening in _blank");
        window.open(url, "_blank");
        return;
    }
}

function click_in_content(e) {
    console.log("Click in iframe content!");

    // Should be able to use e.target.matches('a'), but that doesn't work
    // reliably if there's anything inside the link.
    // Other alternatives include e.target.matches('a, a > *')
    var target = e.target.closest('a');
    if (!target) {
        console.log("Click wasn't over a link, but a ", target);
        return true;
    }

    console.log("Click over an <a> tag", target);

    /*
      Detect external links, not part of the feed, and prompt the user.

      This is done by checking the origin, not checking to see if
      it's already in the cache, because the cache requires async,
      and you can't use async/await and then still use preventDefault.
      Here's how that was explained to me:

      When an `await` is reached, the function pauses
      and immediately returns a promise.
      If the caller of the function (in this case, the user clicking
      on a link) doesn't know to wait on a returned promise, then
      it'll just carry on with whatever it was doing. The only direct
      solution is to already have the required data around before the
      event happens, so you can access it synchronously -- e.g.
      making a list of all cached files at fetchDaily time.

      Instead of that, let's just assume (hope) that anything with the
      same origin as the current page is likely cached, and anything
      else needs to prompt the user.

      XXX Might be able to make this depend on (!navigator.onLine)
    */
    var target_origin = new URL(target.href).origin;
    var my_origin = new URL(document.location).origin;
    if (target_origin != my_origin) {
        console.log("Different origin,", target_origin, "vs", my_origin);
        createCustomDialog("External link",
                           "What do you want to do with <i>"
                               + target.href + "</i>?",
                           ["Save", "Visit", "Cancel"],
                           function(ans) {
                               handleOutsideLink(target.href, ans);
                           });

        e.preventDefault();
        event.stopPropagation();
        return false;
    }
    return true;
}

function iframe_onload() {
    iframedoc = contentDoc();
    if (iframedoc.location.href.endsWith(TOCPAGE)) {
        TOCpage();
        setBtnSensitive("deleteBtn", false);
    }
    else
        setBtnSensitive("deleteBtn", true);

    iframedoc.addEventListener('click', click_in_content);

    set_pref('curPage', iframedoc.location.href);
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
    var scrollareas = document.getElementsByClassName("scrollarea");
    for (var i in scrollareas) {
        console.log("scrollarea", i, scrollareas[i]);
        scrollareas[i].onmousedown = clickHandler;
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


