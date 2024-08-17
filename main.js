import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from './WaterPlus';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Physic from './physics/physic';
// import GUI from 'lil-gui';
import * as dat from 'dat.gui';
import JetSki from './physics/jetski';
import ModelLoaders from './ModelLoaders';
import SceneManager from './SceneManager';


const gui = new dat.GUI();


let camera, scene, renderer;
let controls, water, sun;
const steeringRate = Math.PI / 90; // معدل التغيير لزاوية التوجيه
  const maxSteeringAngle = Math.PI / 9; // أقصى زاوية توجيه (30 درجة)
  
const raycaster = new THREE.Raycaster();
const gltfloader = new GLTFLoader();
const physics = new Physic();
let steeringAngle = 0;
let rotationDecrementInterval;
let throttle = 0.8;
let throttleDecrementInterval;
const planeSize = 10000;

const jetSki = new JetSki()

class JET {
  constructor() {
    gltfloader.load('./assets/jetmodel/untitled.glb', (gltf) => {
      gltf.scene.scale.set(0.4, 0.4, 0.4);

      gltf.scene.position.set(5, 0, 10);
     /// gltf.scene.rotation.z = Math.PI/5;
      this.jet = gltf.scene;
      scene.add(gltf.scene);
      animate();
    });
  }

  update() {
    if (this.jet) {
      this.jet.position.copy(physics.jetski.position);
      this.jet.rotation.copy(physics.orientation);
    }
  }
}

let jet = new JET();
// jet.scene.rotation.y(Math.PI)
function getWaveHeight(x, z) {
  const waveFrequency = 1;
  const waveAmplitude = 0.9;
  return Math.sin(x * waveFrequency) * waveAmplitude + Math.cos(z * waveFrequency) * waveAmplitude;
}

init();

let originalSettings = {
  ambientLight: { intensity: 1.2 },
  directionalLight: { intensity: 1.2, position: new THREE.Vector3(0, 100, 50), color: new THREE.Color(0xffffff) },
  water: {
    sunColor: new THREE.Color(0xffffff),
    waterColor: new THREE.Color(0x44a0e6),
    distortionScale: 3.7
  },
  sky: {
    turbidity: 10,
    rayleigh: 2,
    mieCoefficient: 0.005,
    sunPosition: new THREE.Vector3(1, 1, 0.5)
  },
  background: new THREE.Color(0x87CEEB) // Sky blue for daytime
};

function init() {
  
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);

  sun = new THREE.Vector3();

  const waterGeometry = new THREE.PlaneGeometry(30000, 30000);

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x44a0e6,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
      side: THREE.DoubleSide
    }
  );

  const modelLoaders = new ModelLoaders();
  const sceneManager = new SceneManager('Web_GL');

//Load the icebergs
async function loadIcebergModel() {
    // Load a glTF resource
 
    const iceberg_model = await modelLoaders.load_GLTF_Model('/resources/models/iceberg/scene.gltf');
    if (iceberg_model) {
      
        iceberg_model.scale.set(100, 100, 100);
        iceberg_model.position.set(100, -50, 1000);
        iceberg_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });
        scene.add(iceberg_model);
    }
    const iceberg_model2 = await modelLoaders.load_GLTF_Model('/resources/models/iceberg/scene.gltf');
    if (iceberg_model2) {
      
        iceberg_model2.scale.set(100, -80, 100);
        iceberg_model2.position.set(5, 0, 2000);
        iceberg_model2.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });
        scene.add(iceberg_model2);
    }
}
loadIcebergModel();





  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();

  let renderTarget;

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    // Update water material settings
water.material.uniforms['sunColor'].value.set(0x0077ff); // Change to a different color
water.material.uniforms['waterColor'].value.set(0x001e66); // Darker water color for more realism
water.material.uniforms['distortionScale'].value = 5.0; // Increase distortion

    if (renderTarget !== undefined) renderTarget.dispose();

    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);

    
    scene.environment = renderTarget.texture;
  }

  updateSun();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 0);
  controls.minDistance = -5.0;
  controls.maxDistance = 1000000;
  controls.update();

  let ambientLight, directionalLight;

// Add lighting to the scene
function addLights() {
  // Daylight ambient light
  ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Bright ambient light for day
  scene.add(ambientLight);

  // Daylight directional light (Sun)
  directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Mimic the sun's light
  directionalLight.position.set(0, 100, 50); // Light from above
  scene.add(directionalLight);
}

addLights();

// Function to switch to night mode
function switchToNight() {
  ambientLight.intensity = 0.2; // Dim ambient light
  directionalLight.intensity = 0.3; // Reduce directional light intensity

  // Change sky color to a dark blue
  sky.material.uniforms['turbidity'].value = 2; // Less atmospheric scattering
  sky.material.uniforms['rayleigh'].value = 0.1; // Darker sky
  sky.material.uniforms['sunPosition'].value.set(-0.3, -1, -0.5); // Position the sun below the horizon for night
  sky.material.uniforms['mieCoefficient'].value = 0.01; // Lower scattering for moonlight

  // Darken water
  water.material.uniforms['sunColor'].value.set(0x001122); // Darker reflection
  water.material.uniforms['waterColor'].value.set(0x001e33); // Darker water color
  water.material.uniforms['distortionScale'].value = 1.0; // Lower distortion for a calmer night sea

  // Optionally, add some stars or moonlight
  scene.background = new THREE.Color(0x000011); // Darker background to simulate night sky
}

// Function to switch to day mode
function switchToDay() {
  // Restore original ambient light settings
  ambientLight.intensity = 0.5; // Your original ambient light intensity

  // Restore the directional light (sun) settings
  directionalLight.intensity = 1.0; // Original intensity of sunlight
  directionalLight.position.set(100, 100, 100); // Restore sun position
  directionalLight.color.set(0xffffff); // Original white sunlight color
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;

  // Restore the sky settings
  sky.material.uniforms['turbidity'].value = 10; // Default turbidity value
  sky.material.uniforms['rayleigh'].value = 2; // Default rayleigh value
  sky.material.uniforms['mieCoefficient'].value = 0.005; // Default mie coefficient
  sky.material.uniforms['mieDirectionalG'].value = 0.8; // Original mieDirectionalG value
  sky.material.uniforms['sunPosition'].value.copy(sun); // Restore original sun position

  // Restore the water settings
  water.material.uniforms['sunColor'].value.set(0xffffff); // Default sun reflection color
  water.material.uniforms['waterColor'].value.set(0x44a0e6); // Original water color
  water.material.uniforms['distortionScale'].value = 3.7; // Original distortion scale for water

  // Restore the scene background
  scene.background = null; // Set to null if you had no custom background
}



// Listen for keypress events
window.addEventListener('keydown', (e) => {
  if (e.key === 'N') {
    switchToNight(); // Switch to night mode
  }
  if (e.key === 'B') {
    switchToDay();
  }
});



  // // const jetskiFolder = gui.addFolder('Jet Ski');
  // gui.add(jetSki, 'mass', 1000, 100000).name('Mass');
  // gui.add(jetSki, 'dragCon', 0.1, 2.0).name('Drag Coefficient');
  // gui.add(jetSki, 'A', 0.1, 5.0).name('Cross-sectional Area');
  // gui.add(jetSki, 'powerEngine', 10000, 1000000).name('Engine Power');
  // gui.add(jetSki, 'velocityFan', 0, 100).name('Fan Velocity');

 
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', function (e) {
    if (e.key === "ArrowUp") {
        throttle = 30;
        if (throttleDecrementInterval) {
            clearInterval(throttleDecrementInterval);
            throttleDecrementInterval = null;
        }
    }
    if (e.key === "ArrowDown") {
        throttle = 0;
        steeringAngle = 0
        // this.physics.velocity =0
        if (throttleDecrementInterval) {
            clearInterval(throttleDecrementInterval);
            throttleDecrementInterval = null;
        }
    }
    if (e.key === "ArrowRight") {
        steeringAngle = steeringRate;
        // throttle = 20;
        if (steeringAngle > maxSteeringAngle) {
            steeringAngle = maxSteeringAngle;
        }
    }
    if (e.key === "ArrowLeft") {
        steeringAngle = (-steeringRate);
        // throttle = 20;
        if (steeringAngle < -maxSteeringAngle) {
            steeringAngle = -maxSteeringAngle;
        }
    }
});

window.addEventListener('keyup', function (e) {
   if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (!throttleDecrementInterval) {
            throttleDecrementInterval = setInterval(() => {
                throttle -= 1;
                if (throttle <= 0) {
                    throttle = 0;
                    clearInterval(throttleDecrementInterval);
                    throttleDecrementInterval = null;
                }
            }, 1000); // Decrease throttle every second
        }
    }

  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    if (steeringAngle > 0) {
        steeringAngle -= steeringRate;
        if (steeringAngle < 0) {
            steeringAngle = 0;
        }
    } else if (steeringAngle < 0) {
        steeringAngle += steeringRate;
        if (steeringAngle > 0) {
            steeringAngle = 0;
        }
    }

    // If throttle is 0, start reducing the steering angle over time
    if (throttle === 0 && !rotationDecrementInterval) {
        rotationDecrementInterval = setInterval(() => {
            if (steeringAngle > 0) {
                steeringAngle -= steeringRate;
                if (steeringAngle < 0) {
                    steeringAngle = 0;
                    clearInterval(rotationDecrementInterval);
                    rotationDecrementInterval = null;
                }
            } else if (steeringAngle < 0) {
                steeringAngle += steeringRate;
                if (steeringAngle > 0) {
                    steeringAngle = 0;
                    clearInterval(rotationDecrementInterval);
                    rotationDecrementInterval = null;
                }
            }
        }, 1000); // Reduce the steering angle every second
    }
}
});

//   if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
//       if (steeringAngle > 0) {
//           steeringAngle -= steeringRate;
//           if (steeringAngle < 0) {
//               steeringAngle = 0;
//           }
//       } else if (steeringAngle < 0) {
//           steeringAngle += steeringRate;
//           if (steeringAngle > 0) {
//               steeringAngle = 0;
//           }
//       }
//   }
// });
  physics.update(steeringAngle, throttle);

  
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
console.log(steeringAngle)

  render();
  updateCamera();
  controls.update();

  physics.update(steeringAngle, throttle);

  if (jet) jet.update();
  
  document.getElementById('acceleration').innerText = `Acceleration: (${physics.acceleration.z.toFixed(2)})`;
  document.getElementById('position').innerText = `Position: (${physics.jetski.position.x.toFixed(2)}, ${physics.jetski.position.y.toFixed(2)}, ${physics.jetski.position.z.toFixed(2)})`;
  document.getElementById('thrust').innerText = `Thrust: ${physics.thrust.powerEngine},${physics.thrust.velocityFan.x}`;
  document.getElementById('velocity').innerText = `Velocity: (${physics.jetski.velocity.x.toFixed(2)}, ${physics.velocity.y.toFixed(2)}, ${physics.jetski.velocity.z.toFixed(2)})`;
  document.getElementById('drag').innerText = `Drag: (${physics.drag.coefficient},${physics.drag.area},${physics.drag.fluidDensity},${physics.drag.drag_force.z})`;
  document.getElementById('deltaT').innerText = `Delta T: ${physics.deltaT}`;
  requestAnimationFrame(animate);
}

function render() {
  water.material.uniforms['time'].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}
function updateCamera() {
  if (jet.jet) {
    const offset = new THREE.Vector3(0, 80, -250);
    const worldPosition = new THREE.Vector3();

    // Get the jet ski's current world position
    jet.jet.getWorldPosition(worldPosition);

    // Apply the offset relative to the jet ski's orientation
    const offsetRotated = offset.clone().applyQuaternion(jet.jet.quaternion);

    // Calculate the target position for the camera
    const targetPosition = worldPosition.clone().add(offsetRotated);

    // Set the camera position based on OrbitControls, then adjust its position to follow the jet ski
    camera.position.lerp(targetPosition, 0.1); // Smooth transition

    // Make the camera look at the jet ski's current position
    camera.lookAt(worldPosition);

    // Update the OrbitControls to keep focusing on the jet ski
    controls.target.copy(worldPosition);
    controls.update(); // Update OrbitControls to reflect any changes
  }
}



