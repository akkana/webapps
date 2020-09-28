// Adapted from https://levelup.gitconnected.com/tutorial-build-an-interactive-virtual-globe-with-three-js-33cf7c2090cb

// Get the DOM element in which you want to attach the scene
var container = document.querySelector('#container');

// Create a WebGL renderer
var renderer = new THREE.WebGLRenderer();

//Set the attributes of the renderer
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

//Set the renderer size
renderer.setSize(WIDTH, HEIGHT);

// Set camera attributes
var VIEW_ANGLE = 45;
var ASPECT = WIDTH / HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

//Create a camera
var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

//Set the camera position - x, y, z
camera.position.set(0, 0, 500);

// Create a scene
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x000);

// Add the camera to the scene.
scene.add(camera);

// Attach the renderer to the DOM element.
container.appendChild(renderer.domElement);

//Three.js uses geometric meshes to create primitive 3D shapes like spheres, cubes, etc. I’ll be using a sphere.

// Set up the sphere attributes
var RADIUS = 200;
var SEGMENTS = 50;
var RINGS = 50;

//create a group which will include our sphere and its texture meshed together
var globe = new THREE.Group();
scene.add(globe);

//Let's create our globe. Use texture loader.
//First we create a sphere
var loader = new THREE.TextureLoader();
loader.load('maps/marscolor.jpg', function (texture) {
    //create the sphere
    var sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);

    //map the texture to the material. (Read more about materials in three.js docs.)
    var material = new THREE.MeshBasicMaterial({ map: texture, overdraw: 0.5 });

    // Create a new mesh with sphere geometry.
    var mesh = new THREE.Mesh(sphere, material);
    globe.add(mesh);
});

// // Move the Sphere back in Z so we
//     // can see it.
globe.position.z = -300;

// create a point light
var pointLight = new THREE.PointLight(0xFFFFFF);

// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 400;

// add to the scene
scene.add(pointLight);

//Set update function
function update() {
    //Render
    renderer.render(scene, camera);

    // Schedule the next frame.
    requestAnimationFrame(update);
}

// Schedule the first frame.
requestAnimationFrame(update);

// Hard-coded animation function based on keypress
function animationBuilder(direction) {
    return function animateRotate() {
        switch (direction) {
            case 'up':
                globe.rotation.x -= 0.2;
                break;
            case 'down':
                globe.rotation.x += 0.2;
                break;
            case 'left':
                globe.rotation.y -= 0.2;
                break;
            case 'right':
                globe.rotation.y += 0.2;
                break;
            default:
                break;
        }
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

// JavaScript mouse move events don't reliably report button state.
// So keep track of button state separately.
var leftButton = false;
document.body.onmousedown = function(e) {
    e = e || window.event;
    if (e.button == 0)
        leftButton = true;
}
document.body.onmouseup = function(e) {
    e = e || window.event;
    if (e.button == 0)
        leftButton = false;
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
        var mouseX = e.clientX - lastMove[0];
        var mouseY = e.clientY - lastMove[1];
        globe.rotation.y += mouseX * .005;
        globe.rotation.x += mouseY * .005;
    }
    lastMove[0] = e.clientX;
    lastMove[1] = e.clientY;
}

document.addEventListener('mousemove', onMouseMove);
