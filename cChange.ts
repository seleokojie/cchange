import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ClimateDataPoint, YearData } from './types';

// Lazy load animation libraries for better initial loading
let d3Module: typeof import('d3') | null = null;
let gsapModule: typeof import('gsap').gsap | null = null;

// Application state with proper typing
let year: string;
let markers: ClimateDataPoint[];
let data: YearData[];

/**
 * Dynamically loads D3 library when needed for better performance
 * Currently unused but kept for future enhancements
 */
async function _loadD3(): Promise<typeof import('d3')> {
  if (!d3Module) {
    d3Module = await import('d3');
  }
  return d3Module;
}

/**
 * Dynamically loads GSAP library when needed for better performance
 */
async function loadGSAP(): Promise<typeof import('gsap').gsap> {
  if (!gsapModule) {
    const gsapImport = await import('gsap');
    gsapModule = gsapImport.gsap;
  }
  return gsapModule;
}

/**
 * Loads climate data from a given URL with caching.
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

    // Handle both array and object formats
    let result: YearData[];
    if (Array.isArray(jsonData)) {
      result = jsonData as YearData[];
    } else {
      result = Object.values(jsonData as Record<string, YearData>);
    }

    return result;
  } catch (error) {
    console.error('Error loading data:', error);
    return [];
  }
}

/**
 * Initializes the application by loading climate data and setting the initial year.
 * @returns A promise that resolves when the initialization is complete.
 * @deprecated Use initWithProgress instead for better UX
 */
async function _init(): Promise<void> {
  // Load climate data
  data = await loadData('/data.json');
  console.warn('Climate data loaded:', data.length, 'time periods');

  // Set initial year and render
  year = '1910';
  markers = centuryData(year);
  renderAnomalies();

  // Show initial year checkbox
  const checkedElements: NodeListOf<Element> =
    document.querySelectorAll('.checked');
  const yearIndex: number = years.indexOf(year);
  if (checkedElements[yearIndex]) {
    (checkedElements[yearIndex] as HTMLElement).style.visibility = 'visible';
  }
}

/**
 * Updates the loading progress indicator
 * @param progress Progress percentage (0-100)
 * @param message Loading message to display
 */
function updateLoadingProgress(progress: number, message: string): void {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const loadingMessage = document.getElementById('loading-message');

  if (progressFill) {
    progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  if (progressText) {
    progressText.textContent = `${Math.round(progress)}%`;
  }

  if (loadingMessage) {
    loadingMessage.textContent = message;
  }
}

/**
 * Enhanced initialization with progress tracking
 * @returns A promise that resolves when the initialization is complete.
 */
async function initWithProgress(): Promise<void> {
  updateLoadingProgress(10, 'Loading climate data...');

  // Load climate data
  data = await loadData('/data.json');
  console.warn('Climate data loaded:', data.length, 'time periods');
  updateLoadingProgress(40, 'Processing climate data...');

  // Set initial year and render
  year = '1910';
  markers = centuryData(year);
  updateLoadingProgress(70, 'Initializing 3D visualization...');

  // Give the browser time to update the progress
  await new Promise(resolve => setTimeout(resolve, 100));

  renderAnomalies();
  updateLoadingProgress(90, 'Finalizing setup...');

  // Show initial year checkbox
  const checkedElements: NodeListOf<Element> =
    document.querySelectorAll('.checked');
  const yearIndex: number = years.indexOf(year);
  if (checkedElements[yearIndex]) {
    (checkedElements[yearIndex] as HTMLElement).style.visibility = 'visible';
  }

  updateLoadingProgress(100, 'Ready!');

  // Announce completion to screen readers
  announceToScreenReader(
    'Climate visualization loaded and ready for interaction'
  );
}

// DOM Content Loaded handler with proper typing
document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  try {
    // Initialize the application with progress tracking
    await initWithProgress();

    // Brief delay to show completion
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hide loading overlay after initialization
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      setTimeout(() => {
        loadingOverlay.remove();
      }, 500);
    }

    // Handle modal functionality if it exists
    const closeModal: HTMLElement | null = document.getElementById('modal');
    const closeModalBtn: HTMLElement | null =
      document.getElementById('close-modal');

    if (closeModal && closeModalBtn) {
      closeModalBtn.addEventListener('click', (): void => {
        closeModal.classList.add('animate-modal');
        setTimeout((): void => {
          closeModal.style.display = 'none';
          closeModal.style.zIndex = '-1';
        }, 1000);
      });

      closeModal.addEventListener(
        'animationend',
        function (this: HTMLElement): void {
          if (this.classList.contains('animate-modal')) {
            this.classList.remove('animate-modal');
          }
        }
      );
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <h2 style="color: #ff6b6b;">------ Loading Failed ------</h2>
                    <p>There was an error loading the climate visualization.</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: white; color: #1a447e; border: none; border-radius: 5px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
    }
  }
});

const years: string[] = [
  '1910',
  '1920',
  '1930',
  '1940',
  '1980',
  '1990',
  '2000',
  '2010',
];

/**
 * Converts a year to century data points.
 * @param year The year to convert.
 * @returns An array of ClimateDataPoint objects for the specified year.
 */
function centuryData(year: string): ClimateDataPoint[] {
  const output: ClimateDataPoint[] = [];
  const yearIdx: number = years.indexOf(year);

  if (yearIdx === -1) {
    console.warn(`Year ${year} not found in years array:`, years);
    return output;
  }

  if (!data[yearIdx]) {
    console.warn(`No data found at index ${yearIdx} for year: ${year}`);
    return output;
  }

  if (!data[yearIdx][1]) {
    console.warn(`No coordinate data found for year: ${year}`, data[yearIdx]);
    return output;
  }

  const yearData: number[] = data[yearIdx][1] || [];
  console.warn(
    `Processing ${yearData.length / 3} data points for year ${year}`
  );
  for (let i = 0; i < yearData.length; i += 3) {
    const lat = yearData[i];
    const lon = yearData[i + 1];
    const delta = yearData[i + 2];

    // Skip invalid data points
    if (lat === undefined || lon === undefined || delta === undefined) {
      continue;
    }

    const dataObject: ClimateDataPoint = {
      lat: lat,
      lon: lon,
      delta: delta,
    };
    output.push(dataObject);
  }

  console.warn(
    `Created ${output.length} data points, non-zero: ${output.filter(p => p.delta !== 0).length}`
  );
  return output;
}

// Three.js scene setup with proper typing and optimizations
const scene: THREE.Scene = new THREE.Scene();

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Use the canvas element from HTML
const canvas = document.getElementById(
  'visualization-canvas'
) as HTMLCanvasElement;
if (!canvas) {
  throw new Error(
    'Canvas element not found. Make sure the HTML contains a canvas with id="visualization-canvas"'
  );
}
const gl = canvas.getContext('webgl2');
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
  canvas: canvas,
  context: gl || undefined,
  antialias: window.devicePixelRatio <= 1, // Only use antialias on lower DPI displays
  powerPreference: 'high-performance',
  stencil: false, // Disable stencil buffer if not needed
  depth: true,
  alpha: false, // Opaque background for better performance
  preserveDrawingBuffer: false, // Better memory management
});

// Check WebGL2 support and log capabilities
if (gl) {
  console.warn('WebGL2 support detected - using advanced features');
  // WebGL2 features are automatically detected by Three.js
} else {
  console.warn('WebGL2 not supported - falling back to WebGL1');
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
renderer.shadowMap.enabled = false; // Disable shadows for better performance

// Enable advanced rendering features if available
if (renderer.capabilities.isWebGL2) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);

// Optimized texture loading with better compression and caching
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous'); // Fix CORS issues

// Load textures with optimization
const earthMap: THREE.Texture = textureLoader.load('/images/BM.jpeg');
const earthBumpMap: THREE.Texture = textureLoader.load(
  '/images/earthbump4k.jpg'
);
const earthSpecMap: THREE.Texture = textureLoader.load(
  '/images/earthspec4k.jpg'
);

// Optimize texture settings for performance
[earthMap, earthBumpMap, earthSpecMap].forEach(texture => {
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // Removed texture.format = THREE.RGBFormat to fix WebGL errors
});

// Reduced geometry complexity for better performance
const earthGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(
  10,
  64,
  32
);

const earthMaterial: THREE.MeshPhongMaterial = new THREE.MeshPhongMaterial({
  map: earthMap,
  bumpMap: earthBumpMap,
  bumpScale: 0.1,
  specularMap: earthSpecMap,
  specular: new THREE.Color('white'),
});

const earth: THREE.Mesh = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Cloud layer setup
const earthCloudGeo: THREE.SphereGeometry = new THREE.SphereGeometry(
  10,
  64,
  32
);
const earthCloudsTexture: THREE.Texture = textureLoader.load(
  '/images/earthhiresclouds4K.jpg'
);

// Cloud texture
earthCloudsTexture.generateMipmaps = true;
earthCloudsTexture.minFilter = THREE.LinearMipmapLinearFilter;
earthCloudsTexture.magFilter = THREE.LinearFilter;

const earthMaterialClouds: THREE.MeshLambertMaterial =
  new THREE.MeshLambertMaterial({
    color: 0x1f2340,
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.15,
  });

const earthClouds: THREE.Mesh = new THREE.Mesh(
  earthCloudGeo,
  earthMaterialClouds
);
earthClouds.scale.set(1.015, 1.015, 1.015);
earth.add(earthClouds);

// Shader setup for halo effect
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
    '}',
  ].join('\n'),
  fragmentShader: [
    'varying vec3 vNormal;',
    'void main() {',
    'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
    'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
    '}',
  ].join('\n'),
};

const uniforms: { [uniform: string]: THREE.IUniform } =
  THREE.UniformsUtils.clone(shader.uniforms);
const haloGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(10, 64, 32);

const haloMaterial: THREE.ShaderMaterial = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: shader.vertexShader,
  fragmentShader: shader.fragmentShader,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

const halo: THREE.Mesh = new THREE.Mesh(haloGeometry, haloMaterial);
halo.scale.set(1.35, 1.35, 1.35);
earth.add(halo);

/**
 * Creates and adds a skybox to the scene.
 * @param scene The scene to which the skybox will be added.
 */
function createSkyBox(scene: THREE.Scene): void {
  const loader: THREE.CubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxTexture = loader.load([
    '/images/space_right.png',
    '/images/space_left.png',
    '/images/space_top.png',
    '/images/space_bot.png',
    '/images/space_front.png',
    '/images/space_back.png',
  ]);

  // Skybox texture
  skyboxTexture.generateMipmaps = false;
  skyboxTexture.minFilter = THREE.LinearFilter;
  skyboxTexture.magFilter = THREE.LinearFilter;

  scene.background = skyboxTexture;
}

/**
 * Creates and adds lights to the scen.
 * @param scene The scene to which the lights will be added.
 */
function createLights(scene: THREE.Scene): void {
  const lights: THREE.Light[] = [];

  lights[0] = new THREE.PointLight('#1a447e', 0.7, 0);
  lights[1] = new THREE.PointLight('#1a447e', 0.7, 0);
  lights[2] = new THREE.PointLight('#1a447e', 0.9, 0);
  lights[3] = new THREE.AmbientLight('#ffffff');

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

// Optimized control settings for better performance
controls.minDistance = 12;
controls.maxDistance = 20;
controls.enablePan = false;
controls.enableDamping = true; // Add damping for smoother controls
controls.dampingFactor = 0.05;
controls.update();
controls.saveState();

// Event handlers with proper typing
window.addEventListener('resize', onWindowResize, false);

const yearsListElement: HTMLElement | null =
  document.querySelector('#years-list');
const playButtonElement: HTMLElement | null =
  document.querySelector('#play-button');

if (yearsListElement) {
  yearsListElement.addEventListener('click', onYearsClick, false);
  yearsListElement.addEventListener('keydown', onYearsKeyDown, false);
}

if (playButtonElement) {
  playButtonElement.addEventListener('click', onPlayClick, false);
  playButtonElement.addEventListener('keydown', onPlayKeyDown, false);
}

// Add keyboard shortcuts for global navigation
document.addEventListener('keydown', onGlobalKeyDown, false);

/**
 * Handles the window resize event to adjust camera and renderer.
 */
function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Handles keyboard navigation for the years list
 * @param e The keyboard event
 */
function onYearsKeyDown(e: KeyboardEvent): void {
  const currentTarget = e.target as HTMLElement;
  const yearsList = document.querySelectorAll('#years-list li');
  const currentIndex = Array.from(yearsList).indexOf(currentTarget);

  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : yearsList.length - 1;
      break;
    case 'ArrowDown':
      e.preventDefault();
      newIndex = currentIndex < yearsList.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'Home':
      e.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      e.preventDefault();
      newIndex = yearsList.length - 1;
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      selectYear(currentTarget);
      announceToScreenReader(`Selected decade: ${currentTarget.textContent}`);
      return;
    default:
      return;
  }

  // Update focus and tabindex
  yearsList.forEach((li, index) => {
    (li as HTMLElement).tabIndex = index === newIndex ? 0 : -1;
  });

  (yearsList[newIndex] as HTMLElement).focus();
}

/**
 * Handles keyboard events for the play button
 * @param e The keyboard event
 */
function onPlayKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onPlayClick(e);
  }
}

/**
 * Handles global keyboard shortcuts
 * @param e The keyboard event
 */
function onGlobalKeyDown(e: KeyboardEvent): void {
  // Skip if user is typing in an input
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  switch (e.key) {
    case 'p':
    case 'P':
      if (!e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const playButton = document.getElementById('play-button');
        if (playButton) {
          (playButton as HTMLButtonElement).click();
          announceToScreenReader('Playing animation through all decades');
        }
      }
      break;
    case '?':
      e.preventDefault();
      showKeyboardShortcuts();
      break;
    case 'Escape': {
      // Focus management for modals or overlays
      const modal = document.getElementById('modal');
      if (modal && modal.style.display !== 'none') {
        const closeButton = document.getElementById('close-modal');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        }
      }
      break;
    }
  }
}

/**
 * Announces text to screen readers
 * @param message The message to announce
 */
function announceToScreenReader(message: string): void {
  const announcer = document.getElementById('sr-announcements');
  if (announcer) {
    announcer.textContent = message;
    // Clear the message after a delay to allow for re-announcements
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
}

/**
 * Displays keyboard shortcuts information
 */
function showKeyboardShortcuts(): void {
  announceToScreenReader(
    'Keyboard shortcuts: P to play animation, Arrow keys to navigate decades, Enter or Space to select, Escape to close dialogs'
  );
}

/**
 * Selects a year and updates the visualization
 * @param target The target element
 */
function selectYear(target: HTMLElement): void {
  // Update aria-selected attributes
  document.querySelectorAll('#years-list li').forEach(li => {
    (li as HTMLElement).setAttribute('aria-selected', 'false');
  });
  target.setAttribute('aria-selected', 'true');

  // Hide all year indicators
  document
    .querySelectorAll('.checked')
    .forEach((yearElement: Element): void => {
      (yearElement as HTMLElement).style.visibility = 'hidden';
    });

  // Show selected year indicator
  const targetIcon: HTMLElement | null = target.querySelector('i');
  if (targetIcon) {
    targetIcon.style.visibility = 'visible';
  }

  // Update visualization
  removeChildren();
  year = target.id || target.parentElement?.id || year;
  markers = centuryData(year);
  renderAnomalies();
}

/**
 * Handles the click event on the years list.
 * @param e The click event.
 */
function onYearsClick(e: Event): void {
  e.preventDefault();
  const target = e.target as HTMLElement;
  selectYear(target);
  announceToScreenReader(`Selected decade: ${target.textContent}`);
}

/**
 * Handles the play button click event to animate through the years.
 * @param e The click event.
 */
async function onPlayClick(e: Event): Promise<void> {
  e.preventDefault();
  removeChildren();

  // Load GSAP dynamically when needed
  const gsap = await loadGSAP();

  let currentIndex: number = 0;

  // Create timeline animation using GSAP
  const timeline = gsap.timeline({
    repeat: 0,
    onUpdate: function (): void {
      const progress: number = this.progress();
      const targetIndex: number = Math.floor(progress * years.length);

      if (targetIndex !== currentIndex && targetIndex < years.length) {
        currentIndex = targetIndex;
        year = years[currentIndex];

        // Hide all indicators
        document
          .querySelectorAll('.checked')
          .forEach((yearElement: Element): void => {
            (yearElement as HTMLElement).style.visibility = 'hidden';
          });

        // Show current year indicator
        const checkedElements: NodeListOf<Element> =
          document.querySelectorAll('.checked');
        if (checkedElements[currentIndex]) {
          (checkedElements[currentIndex] as HTMLElement).style.visibility =
            'visible';
        }

        // Update visualization
        removeChildren();
        markers = centuryData(year);
        renderAnomalies();
      }
    },
  });

  // Animate through all years over 8 seconds
  timeline.to({}, { duration: 8, ease: 'power2.inOut' });
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

// Object pooling for better performance
const geometryPool: THREE.BoxGeometry[] = [];
const materialPool: THREE.MeshLambertMaterial[] = [];
const MAX_POOL_SIZE = 100;

/**
 * Gets or creates a geometry from the pool for better performance
 */
function getGeometry(): THREE.BoxGeometry {
  if (geometryPool.length > 0) {
    return geometryPool.pop()!;
  }
  return new THREE.BoxGeometry(0.05, 0.1, 0.05);
}

/**
 * Returns a geometry to the pool for reuse
 */
function returnGeometry(geometry: THREE.BoxGeometry): void {
  if (geometryPool.length < MAX_POOL_SIZE) {
    geometryPool.push(geometry);
  } else {
    geometry.dispose();
  }
}

/**
 * Gets or creates a material from the pool for better performance
 */
function getMaterial(color: THREE.Color): THREE.MeshLambertMaterial {
  let material: THREE.MeshLambertMaterial;
  if (materialPool.length > 0) {
    material = materialPool.pop()!;
    material.color.copy(color);
  } else {
    material = new THREE.MeshLambertMaterial({ color: color });
  }
  return material;
}

/**
 * Returns a material to the pool for reuse
 */
function returnMaterial(material: THREE.MeshLambertMaterial): void {
  if (materialPool.length < MAX_POOL_SIZE) {
    materialPool.push(material);
  } else {
    material.dispose();
  }
}

/**
 * Removes all children from the earthClouds mesh, disposing of their materials and geometries to prevent memory leaks.
 * Optimized with object pooling.
 */
function removeChildren(): void {
  let destroy: number = earthClouds.children.length - 1;

  while (destroy >= 0) {
    const child: THREE.Object3D = earthClouds.children[destroy];

    // Return materials and geometries to pools for reuse
    if ('material' in child && child.material) {
      returnMaterial(child.material as THREE.MeshLambertMaterial);
    }
    if ('geometry' in child && child.geometry) {
      returnGeometry(child.geometry as THREE.BoxGeometry);
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
    color.setHSL(0.2139 - (x / 1.619) * 0.5, 1.0, 0.5);
    return color;
  } else if (x < 0.0) {
    // Cooler colors for negative temperature anomalies
    color.setHSL(0.5111 - x / 1.619, 1.0, 0.6);
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
  const pointOfInterest: THREE.BoxGeometry = getGeometry(); // Use pooled geometry
  const lat: number = latitude * (Math.PI / 180);
  const lon: number = -longitude * (Math.PI / 180);
  const radius: number = 10;

  const color: THREE.Color = colorVal(delta);
  const material: THREE.MeshLambertMaterial = getMaterial(color); // Use pooled material
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
 * Optimized to reduce unnecessary calculations.
 */
function renderAnomalies(): void {
  const nonZeroMarkers = markers.filter(
    (marker: ClimateDataPoint): boolean => marker.delta !== 0
  );

  console.warn(
    `Rendering ${nonZeroMarkers.length} anomalies out of ${markers.length} total markers`
  );

  // Log a few sample markers for debugging
  if (nonZeroMarkers.length > 0) {
    console.warn('Sample markers:', nonZeroMarkers.slice(0, 5));
  } else {
    console.warn('No non-zero markers found!');
    console.warn('Sample of all markers:', markers.slice(0, 10));
  }

  // Batch processing for better performance
  nonZeroMarkers.forEach((marker: ClimateDataPoint): void => {
    addCoord(marker.lat, marker.lon, marker.delta);
  });

  console.warn(`Added ${earthClouds.children.length} objects to the scene`);
}

// Start the animation loop
animate();
