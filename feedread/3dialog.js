// Custom dialog with three buttons

if(document.getElementById) {
    window.alert = function(txt) {
        createCustomAlert(txt);
    }
}

function createCustomDialog(title, txt, btnArray, callback) {

    console.log("createCustomDialog", txt, btnArray);

    // Is there already a dialog showing?
    if (document.getElementById("greyOut")) {
        console.log("eek, already a dialog showing");
        return;
    }

    greyOut = document.getElementsByTagName("body")[0]
        .appendChild(document.createElement("div"));
    greyOut.id = "greyOut";
    //greyOut.style.height = document.documentElement.scrollHeight + "px";

    alertBox = greyOut.appendChild(document.createElement("div"));
    alertBox.id = "alertBox";
    if (document.all && !window.opera)
        alertBox.style.top = document.documentElement.scrollTop + "px";
    alertBox.style.left = (document.documentElement.scrollWidth
                           - alertBox.offsetWidth)/2 + "px";
    alertBox.style.visiblity="visible";

    h1 = alertBox.appendChild(document.createElement("h1"));
    h1.appendChild(document.createTextNode(title));

    msg = alertBox.appendChild(document.createElement("p"));
    msg.innerHTML = txt;

    btnBox = alertBox.appendChild(document.createElement("div"));
    btnBox.id = "buttonBox";

    for (i in btnArray) {
        var btn = btnBox.appendChild(document.createElement("a"));
        btn.id = "button_" + i;
        btn.classList.add("button");
        btn.appendChild(document.createTextNode(btnArray[i]));
        btn.href = "#";

        //
        // Call the callback on button click, passing in i.
        // Just defining a simple function here and passing i to it
        // doesn't work, because the function gets a reference to
        // the loop variable i, which then changes, so no matter which
        // button is clicked it will report the last value of i.
        // Douglas Crockford, "JS: the Good Parts" discusses this on pp 38-39
        // and gives a trick to solve it by defining intermediate functions
        // that use another variable of the same name, overriding the loop var.
        //
        if (callback) {
            console.log("Registering callback for", i);
            btn.onclick = function(i) {
                return function(e) {
                    e.preventDefault();
                    console.log("callback function for", e);
                    removeCustomDialog();
                    callback(i);
                };
            }(i);
        }
    }

    alertBox.style.display = "block";

    event.preventDefault();
    event.stopPropagation();
    return false;
}

function removeCustomDialog() {
    document.getElementsByTagName("body")[0]
        .removeChild(document.getElementById("greyOut"));
}

