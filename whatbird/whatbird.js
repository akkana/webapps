/* -*- Mode: Javascript; js-indent-level: 2; indent-tabs-mode: nil -*- */

var WhichBirdCode = null;

var Score = 0;
var Total = 0;

// Loaded from birdmedia.js:
//
// allbirds is the list of birds for which we have media.
// It's { "code" : { "name" : "common name", "sciname" : "scientific name" } }
//
// pics and sounds are lists of all the images and sounds we'll
// choose from randomly.
// It's an array of [ [code, f, s], ... ] where
// code is an index into allbirds, f is the actual media file,
// and s is either "images" or "sounds"

// Reset the page, showing a new quiz.
function newquiz() {

  // Enable the submit button
  document.getElementById("submit").disabled = false;

  // Clear the entry field
  document.getElementById("answer").value = "";
  // And the comments
  show_ans("&nbsp;");

  // Stop any audio that's playing.
  stopaudio();

  // We might be choosing from images, sounds, or both.
  var totChoices = 0;
  var imageschecked = document.getElementById("chooseImages").checked;
  var soundschecked = document.getElementById("chooseSounds").checked;
  var picslen = pics.length;
  var soundslen = sounds.length;

  //alert("There are " + picslen + " images and " + soundslen + " sounds");

  var mediafile, t;
  var index;
  if (imageschecked && soundschecked) {
    index = Math.floor(Math.random() * (picslen+soundslen));
    if (index < picslen) {
      WhichBirdCode = pics[index][0];
      mediafile = pics[index][1];
      t = "images";
    } else {
      index -= picslen;
      WhichBirdCode = sounds[index][0];
      mediafile = sounds[index][1];
      t = "sounds";
    }
  }
  else if (imageschecked) {
    index = Math.floor(Math.random() * picslen);
    WhichBirdCode = pics[index][0];
    mediafile = pics[index][1];
    t = "images";
  }
  else {
    index = Math.floor(Math.random() * soundslen);
    WhichBirdCode = sounds[index][0];
    mediafile = sounds[index][1];
    t = "sounds";
  }
  var whichbird = allbirds[WhichBirdCode];

  // Get the attribution, if any.
  if (mediafile in copyrights)
    copyright = copyrights[mediafile];
  else {
    d = dirname(mediafile);
    if (d && (d in copyrights))
      copyright = copyrights[d];
    else
      copyright = "";
  }
  document.getElementById("attribution").innerHTML = copyright;

  // Now update the HTML page.

  // Need to be able to toggle visibility depending on
  // whether we're presenting images or audio:
  var birdpic = document.getElementById("birdpic");
  var audiodiv = document.getElementById("audiodiv");
  var xenodiv = document.getElementById("xenodiv");
  var xenocanto = document.getElementById("xeno-canto");

  // Even though the xenocover is inside the xenodiv, it will be visible
  // even when the xenodiv is hidden. Maybe because of its z-order.
  // Anyway, we have to hide it separately.
  var xenocover = document.getElementById("xenocover");

  if (t == "images") {
    xenocanto.src= "about:blank";
    // mediafile may be a relative url, e.g. images/foo/bar.jpg.
    // But firefox has a bug where sometimes, unpredictably,
    // it can't set img src to a relative URL; mousing over
    // the src in the DOM inspector says "could not load the image"
    // but it's not clear why.
    // Googling firefox "could not load the image"
    // suggests that this firefox bug is fairly widespread.
    /*
    loc = window.location.href
    if (loc.endsWith(".html"))
      loc = dirname(loc) + '/'
    birdpic.src = loc + mediafile;
    */
    birdpic.src = mediafile;
    //console.log(mediafile);
    audiodiv.style.visibility = "hidden";
    xenodiv.style.visibility = "hidden";
    xenocover.style.visibility = "hidden";
    birdpic.style.visibility = "visible";

    if (pics[index].length > 2)
      locdate = "Location: " + pics[index][2];
    else
      locdate = '';
    if (pics[index].length > 3) {
      if (locdate)
        locdate += ", " + pics[index][3];
      else
        locdate = pics[index][3];
    }

    var locdatediv = document.getElementById("locdate");
    if (locdatediv)
      locdatediv.innerHTML = locdate;
  }
  else {
    birdpic.style.visibility = "hidden";
    birdpic.src = "";

    // Is it a xeno-canto clip?
    if (mediafile.startsWith("http://www.xeno-canto.org/")) {
      // Make sure the bird name will be hidden
      xenocover.style.visibility = "visible";

      // xeno-canto media files should be of the form: xeno-canto/ID
      // http://www.xeno-canto.org/help/embed/332645
      var cantoID = basename(mediafile);
      audiodiv.style.visibility = "hidden";
      xenocanto.src= mediafile;
      xenodiv.style.visibility = "visible";
    } else {
      audiodiv.style.visibility = "visible";
      xenodiv.style.visibility = "hidden";
      xenocover.style.visibility = "hidden";
      newaudio(mediafile);
    }
  }

  // Focus the input entry:
  document.getElementById("answer").focus();

  return true;
}

function basename(s)
{
  var slash = s.lastIndexOf('/');
  if (slash < 0)
    return null;
  return s.substring(slash+1);
}

function dirname(s)
{
  var slash = s.lastIndexOf('/');
  if (slash < 0)
    return s;
  return s.substring(0, slash);
}

function newaudio(f) {
  player = document.getElementById("audioplayer");
  if (player)
    player.src = f;
}

function stopaudio() {
  player = document.getElementById("audioplayer");
  if (player) {
    player.pause();
    player.removeAttribute("src");
  }
}

function partialsearch(item) {
  lcitem = item.toLowerCase();
  var result = [];
  for (var key in allbirds) {
    if (key.toLowerCase() == lcitem)
      return [key];
    name = allbirds[key]["name"].toLowerCase();
    if (name == lcitem)
      return [lcitem];
    if (name.includes(lcitem)) {
      result.push(allbirds[key]["name"]);
    }
  }
  return result;
}

// Fuzzy search adapted from http://stackoverflow.com/a/13107950
// Returns an array of one or more matches.
function fuzzy(item) {
  lcitem = item.toLowerCase();
  function oc(a) {
    var o = {}; for (var i=0; i<a.length; i++) o[a[i]] = ""; return o;
  }
  var test = [];
  for (var n=1; n<=lcitem.length; n++)
    test.push(lcitem.substr(0,n) + "*" + lcitem.substr(n+1,lcitem.length-n));
  var result = [];
  for (var r=0; r<test.length; r++) {
    for (var key in allbirds) {
      name = allbirds[key]["name"];
      lcname = name.toLowerCase();
      // Check for an exact match, and assume there's only one.
      if (lcitem == lcname) {
          return [lcitem];
      }
      if (lcname.indexOf(test[r].toLowerCase().split("*")[0]) != -1)
      if (lcname.indexOf(test[r].toLowerCase().split("*")[1]) != -1)
      if (0 < lcname.indexOf(test[r].toLowerCase().split("*")[1])
            - lcname.indexOf(test[r].toLowerCase().split("*")[0] < 2 ) )
      if (!(name in oc(result)))  result.push(name);
    }
  }
  return result;
}

// Does an array contain an object? (Amazingly, not a JS built-in.)
function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
}

// Display whether the user got it right.
function show_ans(s) {
  var feedback = document.getElementById("feedback");
  feedback.innerHTML = s;
}

// Callback when the user presses the Submit button or hits Enter
function answer() {
  // Disable the submit button
  document.getElementById("submit").disabled = true;

  // The real answer, simple name:
  var realans = allbirds[WhichBirdCode].name;
  // The whole answer formatted to show the user:
  var finalstr = allbirds[WhichBirdCode]["name"] + " (" + WhichBirdCode + ")";

  var ans = document.getElementById("answer").value;

  var res = '';
  // First, is it a 4-letter code?
  if (ans.length == 4) {
    anscode = ans.toUpperCase();
    if (anscode == WhichBirdCode) {
      res = [ realans ];
    }
  }

  if (!res)
    //res = fuzzy(ans);
    res = partialsearch(ans);
  //console.log(res);

  Total += 1;

  if (res.length == 0)
    // No matches -- the answer wasn't even close to right.
    show_ans("Sorry, I don't have any bird matching your answer. It's a "
             + finalstr);
  else if (res.length > 1) {
    // The user may have given a vague answer that matches several birds,
    // like "chickadee" instead of "mountain chickadee".
    var out;
    if (contains(res, realans)) {
      out = "It's a " + finalstr + ".";
      out += "<p>'" + ans + "' could be " + res.join(", ");
      out += "<p>Score = 1 / " + res.length;
      Score += 1./res.length;
    } else {
      out = "Sorry, no. It's a " + finalstr;
    }

    show_ans(out);
  }
  else {
    // One match. Is it right?
    if (res[0].toLowerCase() == realans.toLowerCase()) {
      show_ans("You got it! " + finalstr);
      Score += 1;
    }
    else
      show_ans("Sorry, not a " + allbirds[res[0]]["name"]
               + " (" + res[0] + "). It's a " + finalstr);
  }

  // Un-hide the bird name if it's xeno-canto
  var cover = document.getElementById("xenocover");
  cover.style.visibility = "hidden";

  // Update the scorecard
  document.getElementById("scorecard").innerHTML =
      "Score so far: " + Math.round(Score*100)/100 + " out of " + Total;
      //"Score so far: " + Score + " out of " + Total;

  // Focus the newquiz button instead of the entry.
  document.getElementById("newquiz").focus();

  return true;
}

// Good grief, JS seriously doesn't have a way to call a function
// when enter/return is pressed? We have to monitor all onKeyUp
// and check whether it's code 13.
function answerIfEnter(event) {
  if (event.keyCode == 13 && document.getElementById("answer").value) {
    return answer();
  }
  return false;
}

// https://www.allaboutbirds.org/our-review-best-iphone-apps-for-learning-bird-songs/
// has some suggestions that might be useful for getting more birdsongs.
// Also don't forget about Xeno-Canto.org.

