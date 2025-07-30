import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import { 
    ClimateDataPoint, 
    YearData, 
    ApplicationState,
    EventHandler,
    ResizeHandler,
    MaterialConfig
} from './types';

// Application state with proper typing
let year: string;
let markers: ClimateDataPoint[];
let data: YearData[];

/**
 * Loads climate data from a given URL.
 * @param url The URL to fetch the climate data from.
 * @returns A promise that resolves to an array of YearData.
 */
async function loadData(url: string): Promise<YearData[]> {
    try {
        const response: Response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData: unknown = await response.json();
        return Object.values(jsonData as Record<string, YearData>);
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

/**
 * Initializes the application by loading climate data and setting the initial year.
 * @returns A promise that resolves when the initialization is complete.
 */
async function init(): Promise<void> {
    // Load climate data
    data = await loadData("data/data.json");
    console.log('Climate data loaded:', data.length, 'time periods');
    
    // Set initial year and render
    year = "1910";
    markers = centuryData(year);
    renderAnomalies();
    
    // Show initial year checkbox
    const checkedElements: NodeListOf<Element> = document.querySelectorAll(".checked");
    const yearIndex: number = years.indexOf(year);
    if (checkedElements[yearIndex]) {
        (checkedElements[yearIndex] as HTMLElement).style.visibility = "visible";
    }
}

// DOM Content Loaded handler with proper typing
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
    // Initialize the application
    await init();
    
    // Handle modal functionality if it exists
    const closeModal: HTMLElement | null = document.getElementById("modal");
    const closeModalBtn: HTMLElement | null = document.getElementById("close-modal");
    
    if (closeModal && closeModalBtn) {
        closeModalBtn.addEventListener("click", (): void => {
            closeModal.classList.add("animate-modal");
            setTimeout((): void => {
                closeModal.style.display = "none";
                closeModal.style.zIndex = "-1";
            }, 1000);
        });

        
        closeModal.addEventListener("animationend", function(this: HTMLElement): void {
            if (this.classList.contains("animate-modal")) {
                this.classList.remove("animate-modal");
            }
        });
    }
});

const years: string[] = ['1910', '1920', '1930', '1940', '1980', '1990', '2000', '2010'];

/**
 * Converts a year to century data points.
 * @param year The year to convert.
 * @returns An array of ClimateDataPoint objects for the specified year.
 */
function centuryData(year: string): ClimateDataPoint[] {
    const output: ClimateDataPoint[] = [];
    const yearIdx: number = years.indexOf(year);
    
    if (yearIdx === -1 || !data[yearIdx] || !data[yearIdx][1]) {
        console.warn(`No data found for year: ${year}`);
        return output;
    }
    
    const yearData: number[] = data[yearIdx][1];
    
    for (let i = 0; i < yearData.length; i += 3) {
        const dataObject: ClimateDataPoint = {
            lat: yearData[i],
            lon: yearData[i + 1],
            delta: yearData[i + 2]
        };
        output.push(dataObject);
    }
    
    return output;
}

// Three.js scene setup with proper typing
const scene: THREE.Scene = new THREE.Scene();

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    75, 
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);

// Earth textures with proper typing
const earthMap: THREE.Texture = new THREE.TextureLoader().load('./assets/images/BM.jpeg');
const earthBumpMap: THREE.Texture = new THREE.TextureLoader().load('./assets/images/earthbump4k.jpg');
const earthSpecMap: THREE.Texture = new THREE.TextureLoader().load('./assets/images/earthspec4k.jpg');

const earthGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(10, 32, 32);

const earthMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
    map: earthMap,
    bumpMap: earthBumpMap,
    bumpScale: 0.10,
    specularMap: earthSpecMap,
    specular: new THREE.Color('white')
});

const earth: THREE.Mesh = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Cloud layer setup
const earthCloudGeo: THREE.SphereGeometry = new THREE.SphereGeometry(10, 32, 32);
const earthCloudsTexture: THREE.Texture = new THREE.TextureLoader().load('./assets/images/earthhiresclouds4K.jpg');

const earthMaterialClouds: THREE.MeshLambertMaterial = new THREE.MeshLambertMaterial({
    color: 0x1f2340,
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.2
});

const earthClouds: THREE.Mesh = new THREE.Mesh(earthCloudGeo, earthMaterialClouds);
earthClouds.scale.set(1.015, 1.015, 1.015);
earth.add(earthClouds);

// Shader setup for halo effect with proper typing
interface HaloShader {
    uniforms: { [uniform: string]: THREE.IUniform };
    vertexShader: string;
    fragmentShader: string;
}

// Shader values borrowed from: https://github.com/dataarts/webgl-globe
const shader: HaloShader = {
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
    ].join('\n'),
};

const uniforms: { [uniform: string]: THREE.IUniform } = THREE.UniformsUtils.clone(shader.uniforms);
const geometry: THREE.SphereGeometry = new THREE.SphereGeometry(10, 32, 32);

const material: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const halo: THREE.Mesh = new THREE.Mesh(geometry, material);
halo.scale.set(1.35, 1.35, 1.35);
earth.add(halo);

/**
 * Creates and adds a skybox to the scene.
 * @param scene The scene to which the skybox will be added.
 */
function createSkyBox(scene: THREE.Scene): void {
    const loader: THREE.CubeTextureLoader = new THREE.CubeTextureLoader();
    scene.background = loader.load([
        './assets/images/space_right.png',
        './assets/images/space_left.png',
        './assets/images/space_top.png',
        './assets/images/space_bot.png',
        './assets/images/space_front.png',
        './assets/images/space_back.png'
    ]);
}

const lights: THREE.Light[] = [];

/**
 * Creates and adds lights to the scene.
 * @param scene The scene to which the lights will be added.
 */
function createLights(scene: THREE.Scene): void {
    lights[0] = new THREE.PointLight("#1a447e", 0.7, 0);
    lights[1] = new THREE.PointLight("#1a447e", 0.7, 0);
    lights[2] = new THREE.PointLight("#1a447e", 0.9, 0);
    lights[3] = new THREE.AmbientLight("#ffffff");

    (lights[0] as THREE.PointLight).position.set(200, 0, -400);
    (lights[1] as THREE.PointLight).position.set(200, 200, 400);
    (lights[2] as THREE.PointLight).position.set(-200, -200, -50);

    lights.forEach(light => scene.add(light));
}

/**
 * Adds lights and a skybox to the scene.
 * @param scene The scene to which the objects will be added.
 */
function addSceneObjects(scene: THREE.Scene): void {
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

// Event handlers with proper typing
window.addEventListener("resize", onWindowResize, false);

const yearsListElement: HTMLElement | null = document.querySelector('#years-list');
const playButtonElement: HTMLElement | null = document.querySelector('#play-button');

if (yearsListElement) {
    yearsListElement.addEventListener("click", onYearsClick, false);
}

if (playButtonElement) {
    playButtonElement.addEventListener("click", onPlayClick, false);
}

/**
 * Handles the window resize event to adjust camera and renderer.
 */
function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Handles the click event on the years list.
 * @param e The click event.
 */
function onYearsClick(e: Event): void {
    e.preventDefault();
    
    // Hide all year indicators
    document.querySelectorAll(".checked").forEach((yearElement: Element): void => {
        (yearElement as HTMLElement).style.visibility = "hidden";
    });

    const target = e.target as HTMLElement;
    
    // Show selected year indicator
    const targetIcon: HTMLElement | null = target.querySelector('i') || target;
    if (targetIcon) {
        targetIcon.style.visibility = "visible";
    }
    
    // Update visualization
    removeChildren();
    year = target.id || target.parentElement?.id || year;
    markers = centuryData(year);
    renderAnomalies();
}

/**
 * Handles the play button click event to animate through the years.
 * @param e The click event.
 */
function onPlayClick(e: Event): void {
    e.preventDefault();
    removeChildren();
    
    let currentIndex: number = 0;
    
    // Create timeline animation using GSAP
    const timeline = gsap.timeline({
        repeat: 0,
        onUpdate: function(): void {
            const progress: number = this.progress();
            const targetIndex: number = Math.floor(progress * years.length);
            
            if (targetIndex !== currentIndex && targetIndex < years.length) {
                currentIndex = targetIndex;
                year = years[currentIndex];
                
                // Hide all indicators
                document.querySelectorAll(".checked").forEach((yearElement: Element): void => {
                    (yearElement as HTMLElement).style.visibility = "hidden";
                });
                
                // Show current year indicator
                const checkedElements: NodeListOf<Element> = document.querySelectorAll(".checked");
                if (checkedElements[currentIndex]) {
                    (checkedElements[currentIndex] as HTMLElement).style.visibility = "visible";
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

/**
 * Animates the scene by requesting the next frame and rendering the scene.
 */
function animate(): void {
    requestAnimationFrame(animate);
    render();
    controls.update();
}

/**
 * Renders the scene using the renderer and camera.
*/
function render(): void {
    renderer.render(scene, camera);
}

/**
 * Removes all children from the earthClouds mesh, disposing of their materials and geometries to prevent memory leaks.
 */
function removeChildren(): void {
    let destroy: number = earthClouds.children.length - 1;
    
    while (destroy >= 0) {
        const child: THREE.Object3D = earthClouds.children[destroy];
        
        // Properly dispose of materials and geometries to prevent memory leaks
        if ('material' in child && child.material) {
            (child.material as THREE.Material).dispose();
        }
        if ('geometry' in child && child.geometry) {
            (child.geometry as THREE.BufferGeometry).dispose();
        }
        
        earthClouds.remove(child);
        destroy -= 1;
    }
}

// Improved color calculation with better HSL handling
/**
 * Maps a temperature anomaly value to a color.
 * @param x The temperature anomaly value.
 * @returns The corresponding color.
 */
function colorVal(x: number): THREE.Color {
    const color: THREE.Color = new THREE.Color();
    
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

/**
 * Adds a coordinate point to the 3D visualization.
 * @param latitude The latitude of the point.
 * @param longitude The longitude of the point.
 * @param delta The temperature anomaly at the point.
 */
function addCoord(latitude: number, longitude: number, delta: number): void {
    const pointOfInterest: THREE.BoxGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
    const lat: number = latitude * (Math.PI / 180);
    const lon: number = -longitude * (Math.PI / 180);
    const radius: number = 10;

    const color: THREE.Color = colorVal(delta);
    const material: THREE.MeshLambertMaterial = new THREE.MeshLambertMaterial({ color: color });
    const mesh: THREE.Mesh = new THREE.Mesh(pointOfInterest, material);

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

/**
 * Renders anomalies by filtering markers and adding them to the scene.
 */
function renderAnomalies(): void {
    markers
        .filter((marker: ClimateDataPoint): boolean => marker.delta !== 0)
        .forEach((marker: ClimateDataPoint): void => {
            addCoord(marker.lat, marker.lon, marker.delta);
        });
}

// Start the animation loop
animate();