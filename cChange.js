import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';
import { gsap } from 'gsap';

// Application state
let year;
let markers;
let data;

// Load climate data using modern fetch API
async function loadData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        return Object.values(jsonData);
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Initialize the application
async function init() {
    // Load climate data
    data = await loadData("data/data.json");
    console.log('Climate data loaded:', data.length, 'time periods');
    
    // Set initial year and render
    year = "1910";
    markers = centuryData(year);
    renderAnomalies();
    
    // Show initial year checkbox
    const checkedElements = document.querySelectorAll(".checked");
    if (checkedElements[years.indexOf(year)]) {
        checkedElements[years.indexOf(year)].style.visibility = "visible";
    }
}

// DOM Content Loaded handler
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the application
    await init();
    
    // Handle modal functionality if it exists
    const closeModal = document.getElementById("modal");
    const closeModalBtn = document.getElementById("close-modal");
    
    if (closeModal && closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            closeModal.classList.add("animate-modal");
            setTimeout(() => {
                closeModal.style.display = "none";
                closeModal.style.zIndex = "-1";
            }, 1000);
        });

        closeModal.addEventListener("animationend", function() {
            if (this.classList.contains("animate-modal")) {
                this.classList.remove("animate-modal");
            }
        });
    }
});

const years = ['1910', '1920', '1930', '1940', '1980', '1990', '2000', '2010'];

function centuryData(year) {
    let output = []
    let yearIdx = years.indexOf(year)
    for(let i=0; i<data[yearIdx][1].length;i+=3){
        let dataObject = {};
        dataObject["lat"] = data[yearIdx][1][i];
        dataObject["lon"] = data[yearIdx][1][i+1];
        dataObject["delta"] = data[yearIdx][1][i + 2];
        output.push(dataObject);
    }
    return (output)
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement)

// EarthMap is used for the basic texture which has the various continents/countries/etc. on it
let earthMap = new THREE.TextureLoader().load('./assets/images/BM.jpeg');

// EarthBumpMap is used to give the texture some "depth" so it is more appealing on eyes and data visuals
let earthBumpMap = new THREE.TextureLoader().load('./assets/images/earthbump4k.jpg');

// EarthSpecMap gives the earth some shininess to the environment, allowing reflectivity off of the lights
let earthSpecMap = new THREE.TextureLoader().load('./assets/images/earthspec4k.jpg');

let earthGeometry = new THREE.SphereGeometry(10, 32, 32)

let earthMaterial = new THREE.MeshPhongMaterial({
    map: earthMap,
    bumpMap: earthBumpMap,
    bumpScale: 0.10,
    specularMap: earthSpecMap,
    specular: new THREE.Color('white')
});

let earth = new THREE.Mesh(earthGeometry, earthMaterial);

scene.add(earth);

// Add clouds to the earth object
let earthCloudGeo = new THREE.SphereGeometry(10, 32, 32);

// Add clouds texture
let earthCloudsTexture = new THREE.TextureLoader().load('./assets/images/earthhiresclouds4K.jpg');

// Add cloud material
let earthMaterialClouds = new THREE.MeshLambertMaterial({
    color: 0x1f2340,
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.2
});

let earthClouds = new THREE.Mesh(earthCloudGeo, earthMaterialClouds);

earthClouds.scale.set(1.015,1.015,1.015);

earth.add( earthClouds );

// shader creates halo effect
// shader values borrowed from https://github.com/dataarts/webgl-globe
let shader = {
    uniforms: {},
    vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
        'vNormal = normalize( normalMatrix * normal );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
    ].join('\n'),
    fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
        'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
        'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
    ].join('\n')
};
let uniforms = THREE.UniformsUtils.clone(shader.uniforms);

let geometry = new THREE.SphereGeometry(10, 32, 32);

let material = new THREE.ShaderMaterial({

    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true

});

let halo = new THREE.Mesh(geometry, material);
halo.scale.set(1.35, 1.35, 1.35);
earth.add(halo);

function createSkyBox(scene) {
    const loader = new THREE.CubeTextureLoader();
    scene.background = loader.load([
        '/assets/images/space_right.png',
        '/assets/images/space_left.png',
        '/assets/images/space_top.png',
        '/assets/images/space_bot.png',
        '/assets/images/space_front.png',
        '/assets/images/space_back.png'
    ]);
}

let lights = [];

function createLights(scene) {

    lights[0] = new THREE.PointLight("#1a447e", 0.7, 0);
    lights[1] = new THREE.PointLight("#1a447e", 0.7, 0);
    lights[2] = new THREE.PointLight("#1a447e", 0.9, 0);
    lights[3] = new THREE.AmbientLight("#ffffff");

    lights[0].position.set(200, 0, -400)
    lights[1].position.set(200, 200, 400)
    lights[2].position.set(-200, -200, -50)

    scene.add(lights[0])
    scene.add(lights[1])
    scene.add(lights[2])
    scene.add(lights[3])
}

function addSceneObjects(scene) {
    createLights(scene);
    createSkyBox(scene);
}

addSceneObjects(scene);

camera.position.z = 20;

// Disable control function, so users do not zoom too far in or pan too far away from center
controls.minDistance = 12;
controls.maxDistance = 20;
controls.enablePan = false;
controls.update();
controls.saveState();

// resize window, make it dynamic, by using an event handler
window.addEventListener("resize", onWindowResize, false)
document.querySelector('#years-list').addEventListener("click", onYearsClick, false)
document.querySelector('#play-button').addEventListener("click", onPlayClick, false)


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onYearsClick(e) {
    e.preventDefault();
    
    // Hide all year indicators
    document.querySelectorAll(".checked").forEach(yearElement => {
        yearElement.style.visibility = "hidden";
    });

    // Show selected year indicator
    const targetIcon = e.target.querySelector('i') || e.target;
    if (targetIcon) {
        targetIcon.style.visibility = "visible";
    }
    
    // Update visualization
    removeChildren();
    year = e.target.id || e.target.parentElement.id;
    markers = centuryData(year);
    renderAnomalies();
}

function onPlayClick(e) {
    e.preventDefault();
    removeChildren();
    
    let currentIndex = 0;
    
    // Create timeline animation using GSAP
    const timeline = gsap.timeline({
        repeat: 0,
        onUpdate: function() {
            const progress = this.progress();
            const targetIndex = Math.floor(progress * years.length);
            
            if (targetIndex !== currentIndex && targetIndex < years.length) {
                currentIndex = targetIndex;
                year = years[currentIndex];
                
                // Hide all indicators
                document.querySelectorAll(".checked").forEach(yearElement => {
                    yearElement.style.visibility = "hidden";
                });
                
                // Show current year indicator
                const checkedElements = document.querySelectorAll(".checked");
                if (checkedElements[currentIndex]) {
                    checkedElements[currentIndex].style.visibility = "visible";
                }
                
                // Update visualization
                removeChildren();
                markers = centuryData(year);
                renderAnomalies();
            }
        }
    });
    
    // Animate through all years over 8 seconds
    timeline.to({}, { duration: 8, ease: "power2.inOut" });
}

function animate() {
    requestAnimationFrame(animate);
    render();
    controls.update();
}

function render() {
    renderer.render(scene, camera);
}

// Add a function to remove children, so children aren't added each time
// Removes the points of interest freeing up memory and space to have better performance
function removeChildren() {
    let destroy = earthClouds.children.length - 1;
    
    while (destroy >= 0) {
        const child = earthClouds.children[destroy];
        
        // Properly dispose of materials and geometries to prevent memory leaks
        if (child.material) {
            child.material.dispose();
        }
        if (child.geometry) {
            child.geometry.dispose();
        }
        
        earthClouds.remove(child);
        destroy -= 1;
    }
}

// Improved color calculation with better HSL handling
function colorVal(x) {
    const color = new THREE.Color();
    
    if (x > 0.0) {
        // Warmer colors for positive temperature anomalies
        color.setHSL((0.2139 - (x / 1.619) * 0.5), 1.0, 0.5);
        return color;
    } else if (x < 0.0) {
        // Cooler colors for negative temperature anomalies
        color.setHSL((0.5111 - (x / 1.619)), 1.0, 0.6);
        return color;
    } else {
        // Neutral color for zero anomaly
        color.setRGB(1.0, 1.0, 1.0);
        return color;
    }
}

// Maps coordinates to a 3D Plane with improved performance
function addCoord(latitude, longitude, delta) {
    const pointOfInterest = new THREE.BoxGeometry(0.05, 0.1, 0.05);
    const lat = latitude * (Math.PI / 180);
    const lon = -longitude * (Math.PI / 180);
    const radius = 10;

    const color = colorVal(delta);
    const material = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(pointOfInterest, material);

    // Calculate position on sphere
    mesh.position.set(
        Math.cos(lat) * Math.cos(lon) * radius,
        Math.sin(lat) * radius,
        Math.cos(lat) * Math.sin(lon) * radius
    );

    mesh.rotation.set(0.0, -lon, lat - Math.PI * 0.5);
    
    // Scale based on temperature anomaly, with minimum scale to avoid matrix issues
    mesh.scale.y = Math.max(Math.abs(delta) * 150, 0.1);

    earthClouds.add(mesh);
}

function renderAnomalies() {
    // Use filter and forEach for better performance and readability
    markers
        .filter(marker => marker.delta !== 0)
        .forEach(marker => {
            addCoord(marker.lat, marker.lon, marker.delta);
        });
}

// Start the animation loop
animate();