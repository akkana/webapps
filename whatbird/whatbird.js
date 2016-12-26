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

  var mediafile, t;
  if (imageschecked && soundschecked) {
    var i = Math.floor(Math.random() * (picslen+soundslen));
    if (i < pics.length) {
      WhichBirdCode = pics[i][0];
      mediafile = pics[i][1];
      t = "images";
    } else {
      i -= picslen;
      WhichBirdCode = sounds[i][0];
      mediafile = sounds[i][1];
      t = "sounds";
    }
  }
  else if (imageschecked) {
    var i = Math.floor(Math.random() * picslen);
    WhichBirdCode = pics[i][0];
    mediafile = pics[i][1];
    t = "images";
  }
  else {
    var i = Math.floor(Math.random() * soundslen);
    WhichBirdCode = sounds[i][0];
    mediafile = sounds[i][1];
    t = "sounds";
  }
  var whichbird = allbirds[WhichBirdCode];

  // Need to be able to toggle visibility depending on
  // whether we're presenting images or audio:
  var birdpic = document.getElementById("birdpic");
  var audiodiv = document.getElementById("audiodiv");
  var xenocanto = document.getElementById("xeno-canto");

  if (t == "images") {
    birdpic.src = mediafile;
    audiodiv.style.visibility = "collapse";
    xenocanto.style.visibility = "collapse";
    birdpic.style.visibility = "visible";
  }
  else {
    birdpic.style.visibility = "collapse";
    birdpic.src = "";

    // Is it a xeno-canto clip?
    if (mediafile.startsWith("xeno-canto")) {
      // xeno-canto media files should be of the form: xeno-canto/ID
      // http://www.xeno-canto.org/help/embed/332645
      cantoID = basename(mediafile);
      audiodiv.style.visibility = "collapse";
      xenocanto.src= "http://www.xeno-canto.org/" + cantoID + "/embed";
      xenocanto.style.visibility = "visible";
    } else {
      audiodiv.style.visibility = "visible";
      xenocanto.style.visibility = "collapse";
      newaudio(mediafile);
    }
  }

  // Focus the input entry:
  document.getElementById("answer").focus();

  return true;
}

function basename(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1);
    if(base.lastIndexOf(".") != -1)
        base = base.substring(0, base.lastIndexOf("."));
   return base;
}

function newaudio(f) {
    player = document.getElementById("audioplayer");
    player.src = f;
}

function stopaudio() {
    player = document.getElementById("audioplayer");
    player.pause();
    player.removeAttribute("src");
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
    res = fuzzy(ans);

  Total += 1;

  if (res.length == 0)
    // No matches -- the answer wasn't even close to right.
    show_ans("Sorry, I don't have any bird matching your answer. It's a " + finalstr);
  else if (res.length > 1) {
    // The user may have given a vague answer that matches several birds,
    // like "chickadee" instead of "mountain chickadee".
    var out;
    if (contains(res, realans)) {
      out = "Partly right -- it's a " + finalstr;
      Score += 1./res.length;
    } else {
      out = "Sorry, no. It's a " + finalstr;
    }
    out += "<p>Your answer of " + ans + " was similar to:";
    for (i=0; i<res.length; ++i)
      out += "<br>" + res[i];
    show_ans(out);
  }
  else {
    // One match. Is it right?
    if (res[0].toLowerCase() == realans.toLowerCase()) {
      show_ans("You got it! " + finalstr);
      Score += 1;
    }
    else
      show_ans("Sorry, not a " + res[0] + ". It's a " + realans + " = " + finalstr);
  }

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

