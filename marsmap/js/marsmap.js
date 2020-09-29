
// Adapted from https://levelup.gitconnected.com/tutorial-build-an-interactive-virtual-globe-with-three-js-33cf7c2090cb

// Get the DOM element in which you want to attach the scene
var container = document.querySelector('#planet-container');

// Create a WebGL renderer
var renderer = new THREE.WebGLRenderer();

// Set the size. I haven't found any way to do this in the HTML or CSS.
var SIZE = 500;


function screenWidth() {
    // clientWidth, scrollWidth and offsetWidth all give the same result
    // in this case.
    /*
    console.log("container:",
                document.getElementById("planet-container").clientWidth);
    console.log("documentElement:", document.documentElement.clientWidth);
    console.log("body:", document.body.clientWidth);
    */

    var w;

    try {
        w = document.getElementById("planet-container").clientWidth;
        if (w) {
            console.log("Screenwidth from planet-container", w);
            return w;
        }
    } catch (e) { console.log("container exception"); }
    try {
        w = document.documentElement.clientWidth;
        if (w) {
            console.log("Screenwidth from documentElement", w);
            return w;
        }
    } catch (e) { console.log("documentElement exception"); }
    try {
        w = document.body.clientWidth;    // For IE8
        if (w) {
            console.log("Screenwidth from body", w);
            return w;
        }
    } catch (e) { console.log("body exception"); }
    console.log("Couldn't get document width!");
    return 500;
}

var screenwidth = screenWidth();
if (screenwidth < SIZE)
    SIZE = screenwidth;
console.log("screenwidth", screenwidth, "SIZE", SIZE);

//Set the renderer size
renderer.setSize(SIZE, SIZE);

// Set camera attributes
var VIEW_ANGLE = 45;
var ASPECT = 1.0;
var NEAR = 0.1;
var FAR = 10000;

// Create the camera and scene.
var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.set(0, 0, SIZE);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x000);

scene.add(camera);

/*
// Someone suggested this was a way to size the canvas to its parent container,
// but it doesn't make any difference: canvas.clientWidth and clientHeight
// are undefined. And the canvas isn't a child of the container anyway
// according to the DOM inspector.
function resizeCanvasToDisplaySize() {
    const canvas = renderer.domElement;
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    console.log("canvas parent size:", width, height);

    // adjust displayBuffer size to match
    if (canvas.width !== width || canvas.height !== height) {
        // you must pass false here or three.js sadly fights the browser
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // update any render target sizes here
    }
}
resizeCanvasToDisplaySize();
*/

// Attach the renderer to the DOM element.
console.log("Container:", container);
container.appendChild(renderer.domElement);

//Three.js uses geometric meshes to create primitive 3D shapes like spheres, cubes, etc. I’ll be using a sphere.

// Set up the sphere attributes.
// You might think that to fill the available SIZE, you'd want a radius
// of SIZE / 2, but no, that comes out too small for some reason.
// On a computer display with SIZE == 500, SIZE/1.65 just about
// fills it (but not quite), SIZE/1.7 looks good; but on my phone,
// portrait size SIZE==341, // SIZE/1.2 is needed to fill most of the space.
var RADIUS = SIZE / 2;
var SEGMENTS = 50;
var RINGS = 50;

// Create a group which will include our sphere and its texture meshed together
var globe = new THREE.Group();
scene.add(globe);

// Create the sphere with a texture loader.
var loader = new THREE.TextureLoader();
loader.load('maps/marscolor.jpg', function (texture) {
    var sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);

    // Map the texture to the material.
    var material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });

    // Create a new mesh with sphere geometry.
    var mesh = new THREE.Mesh(sphere, material);
    globe.add(mesh);
});

// // Move the Sphere back in Z so we
//     // can see it.
//globe.position.z = -300;
globe.position.z = -SIZE/2.8;

// create a point light
var pointLight = new THREE.PointLight(0xFFFFFF);

// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 400;

// add to the scene
scene.add(pointLight);

//
// The current orientation (and size) of Mars.
// This has three values: "CM" in radians, "lat" in radians, and "size"
// XXX size is either wrong, or in unknown units.
//
var marsVals;

// Draw Mars with the current values in marsVals.
var firstTime = true;
function drawMars() {
    //rotateTo(marsVals.CM);
    if (!marsVals) {
        console.log("drawMars: no mars yet");
        return;
    }
    globe.rotation.y = marsVals.CM + Math.PI * 1.5;
    globe.rotation.x = marsVals.lat;
    //console.log("drawMars", marsVals.CM);

    // Request a render.
    // When first setting up the page, three.js takes a while
    // before it's actually ready to render, so without a delay,
    // the screen will remain blank. Subsequently, no delay is needed.
    if (firstTime) {
        setTimeout( function() {
            renderer.render(scene, camera);
        }, 250 );
        firstTime = false;
    } else {
        renderer.render(scene, camera);
    }
}

// Rotate to where the given longitude, in radians, is centered.
// Weirdly, globe.rotation.x is latitude, y is longitude. Go figure.
// With globe.rotation.y == 1.5 * PI, Meridiani is centered.
// Don't change Y rotation.
function rotateTo(centerlon) {
    //resizeCanvasToDisplaySize();
    console.log("rotateTo", centerlon);
    globe.rotation.y = centerlon + Math.PI * 1.5;
    console.log("Rotated to y =", globe.rotation.y);
    renderer.render(scene, camera);
}

// Calculate marsVals for date, then draw it.
function drawMarsOnDate(d) {
    if (!d)
        d = new Date();
    var jdate = getJulianDate(d);
    console.log("*** drawMarsOnDate:", d, "jdate", jdate);
    marsVals = MarsMapCalcCM(jdate);
    console.log("Calculated Mars:", marsVals);

    rotateTo(marsVals.CM);

    drawMars();
}
// Set the dateChangeCallback for datetimepicker/datebuttons.js.
dateChangeCallback = drawMarsOnDate;

//
// ANIMATION
//
// Animation is needed for dragging the sphere around.
// So we start animating when the shifted left button is down,
// and stop when that ends.
//

// JavaScript mouse move events don't reliably report button state.
// So keep track of button state separately.
var leftButton = false;
var animating = false;

// Update function for animations
function animate() {
    drawMars();

    // Schedule the next frame, but only if the mouse button is still down.
    if (animating && leftButton)
        requestAnimationFrame(animate);

    /* A way to request frames less frequently:
    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 500 );
     */
}

// Hard-coded animation function based on keypress.
function animationBuilder(direction) {
    return function animateRotate() {
        switch (direction) {
            case 'up':
                marsVals.lat -= 0.2;
                break;
            case 'down':
                marsVals.lat += 0.2;
                break;
            case 'left':
                marsVals.CM -= 0.2;
                break;
            case 'right':
                marsVals.CM += 0.2;
                break;
            default:
                break;
        }
        //console.log("rotation", globe.rotation.y);
        drawMars();
    };
}

var animateDirection = {
    up: animationBuilder('up'),
    down: animationBuilder('down'),
    left: animationBuilder('left'),
    right: animationBuilder('right')
};

function checkKey(e) {
    e = e || window.event;

    e.preventDefault();

    if (e.keyCode == '38') {
        animateDirection.up();
    } else if (e.keyCode == '40') {
        animateDirection.down();
    } else if (e.keyCode == '37') {
        animateDirection.left();
    } else if (e.keyCode == '39') {
        animateDirection.right();
    }
}

document.onkeydown = checkKey;

document.body.onmousedown = function(e) {
    e = e || window.event;
    if (e.button == 0) {
        leftButton = true;
        if (!animating && e.shiftKey) {
            requestAnimationFrame(animate);
            animating = true;
        }
    }
}
document.body.onmouseup = function(e) {
    e = e || window.event;
    if (e.button == 0) {
        leftButton = false;
        animating = false;
    }
}

var lastMove = [-1, -1];

// Mouse-move animation function: shift-drag
function onMouseMove(e) {
    e = e || window.event;
    if (!leftButton || ! e.shiftKey) {
        lastMove = [-1, -1];
        return;
    }
    if (lastMove[0] >= 0) {
        var dX = e.clientX - lastMove[0];
        var dY = e.clientY - lastMove[1];

        marsVals.CM  += dX * .005;
        marsVals.lat += dY * .005;
    }
    lastMove[0] = e.clientX;
    lastMove[1] = e.clientY;
}

document.addEventListener('mousemove', onMouseMove);

//
// Finally, draw Mars as it is right now.
//
var d = new Date();
datetimeinput = document.getElementById("datetimeinput");
if (datetimeinput)
    datetimeinput.value = datetime2str(d);
else
    console.log("No datetimeinput");
drawMarsOnDate(d);
