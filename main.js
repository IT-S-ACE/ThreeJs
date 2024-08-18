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
import nipplejs from 'nipplejs';


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
let throttle = 0.1;
let throttleDecrementInterval;
const planeSize = 10000;

const jetSki = new JetSki()

class JET {
  constructor() {
    gltfloader.load('./assets/jetmodel/untitled.glb', (gltf) => {
      gltf.scene.scale.set(0.4, 0.4, 0.4);
      this.jet = gltf.scene;
      this.boundingBox = new THREE.Box3().setFromObject(this.jet);  // Create bounding box

      gltf.scene.position.set(5, 0, 10);
      /// gltf.scene.rotation.z = Math.PI/5;
      scene.add(gltf.scene);
      this.setupAudio();
      animate();
    });
  }

  update() {
    if (this.jet) {
      this.jet.position.copy(physics.jetski.position);
      this.jet.rotation.copy(physics.orientation);
      this.boundingBox.setFromObject(this.jet);  // Update bounding box position and size
    }
  }

  setupAudio() {
    // Create an AudioListener and add it to the camera
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // Create a global audio source for the first sound
    this.speedUpAudio = new THREE.Audio(listener);
    const audioLoader1 = new THREE.AudioLoader();
    audioLoader1.load('./assets/audio/speedup.mp3', (buffer) => {
      this.speedUpAudio.setBuffer(buffer);
      this.speedUpAudio.setLoop(false);
      this.speedUpAudio.setVolume(0.5);  // Adjust volume as needed
    });

    // Create a global audio source for the second sound
    this.turnOnAudio = new THREE.Audio(listener);
    const audioLoader2 = new THREE.AudioLoader();
    audioLoader2.load('./assets/audio/turnon.mp3', (buffer) => {
      this.turnOnAudio.setBuffer(buffer);
      this.turnOnAudio.setLoop(false);
      this.turnOnAudio.setVolume(0.5);  // Adjust volume as needed
    });

    // Attach the audios to the jet, but don't play them yet
    this.jet.add(this.speedUpAudio);
    this.jet.add(this.turnOnAudio);
  }
}

let jet = new JET();
// jet.scene.rotation.y(Math.PI)
function getWaveHeight(x, z) {
  const waveFrequency = 1;
  const waveAmplitude = 0.9;
  return Math.sin(x * waveFrequency) * waveAmplitude + Math.cos(z * waveFrequency) * waveAmplitude;
}

let joystickManager = nipplejs.create({
  zone: document.body,
  mode: 'static',
  position: { left: '50%', bottom: '50px' },
  size: 200,
  color: 'blue',
  restOpacity: 0.5,
  lockX: false,  // Allow movement in both X and Y
  lockY: false
});

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
      iceberg_model.boundingBox = new THREE.Box3().setFromObject(iceberg_model); 
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
      iceberg_model2.boundingBox = new THREE.Box3().setFromObject(iceberg_model2); 
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
    if (e.key === 'R') {
      resetToStart();
    }
  });

  function resetToStart() {
    throttle = 0;
    steeringAngle = 0;
    physics.reset();

    if (jet.jet) {
      jet.jet.position.set(5, 0, 10);
      jet.jet.rotation.set(0, 0, 0);
    }

    camera.position.set(30, 30, 100);
    controls.target.set(0, 10, 0);
    controls.update();



    turnedOn = false;
  }





  // // const jetskiFolder = gui.addFolder('Jet Ski');
  // gui.add(jetSki, 'mass', 1000, 100000).name('Mass');
  // gui.add(jetSki, 'dragCon', 0.1, 2.0).name('Drag Coefficient');
  // gui.add(jetSki, 'A', 0.1, 5.0).name('Cross-sectional Area');
  // gui.add(jetSki, 'powerEngine', 10000, 1000000).name('Engine Power');
  // gui.add(jetSki, 'velocityFan', 0, 100).name('Fan Velocity');
  let turnedOn = false;





  joystickManager.on('move', (evt, data) => {
    if (data.direction) {
        // Calculate throttle based on joystick position
        const force = data.force; // Magnitude of the joystick movement (0 to 1)
        throttle = force/3;  // Max throttle corresponds to the maximum force
console.log(throttle);
        // Calculate steering angle
        // const angle = data.angle.radian; // Angle in radians
        // steeringAngle = angle * maxSteeringAngle;  // Map the angle to your steering range

        if (data.direction.angle === 'up' && !turnedOn) {
            jet.turnOnAudio.play();
            turnedOn = true;
        }
    }
});

joystickManager.on('end', () => {
    // Stop the jetski when the joystick is released
   
      jet.speedUpAudio.stop();
      if (!throttleDecrementInterval) {
        throttleDecrementInterval = setInterval(() => {
          throttle -= 0.25;
          if (throttle <= 0) {
            throttle = 0;
            clearInterval(throttleDecrementInterval);
            throttleDecrementInterval = null;
          }
        }, 1000); // Decrease throttle every second
      }
    
    jet.speedUpAudio.stop();
});




  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', function (e) {
    if (e.key === "ArrowUp") {
      if (!turnedOn) {
        jet.turnOnAudio.play();
        turnedOn = true;
      }
      throttle = 1;

      if (turnedOn && !jet.turnOnAudio.isPlaying) {
        jet.speedUpAudio.play();

      }

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
      
      steeringAngle = (-steeringRate);
      // throttle = 20;
      if (steeringAngle < -maxSteeringAngle) {
        steeringAngle = -maxSteeringAngle;
      }
    }
    if (e.key === "ArrowLeft") {
      steeringAngle = steeringRate;
      // throttle = 20;
      if (steeringAngle > maxSteeringAngle) {
        steeringAngle = maxSteeringAngle;
      }
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      jet.speedUpAudio.stop();
      if (!throttleDecrementInterval) {
        throttleDecrementInterval = setInterval(() => {
          throttle -= 0.25;
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
  requestAnimationFrame(animate);

  // Update physics and other logic
  physics.update(steeringAngle, throttle);
  if (jet) jet.update();

  // Check for collisions
  scene.traverse((object) => {
    if (object.boundingBox && jet.jet) {
      if (jet.boundingBox.intersectsBox(object.boundingBox)) {
        handleCollision();  // Function to handle collision
      }
    }
  });

  render();
  updateCamera();
  controls.update();
}

function handleCollision() {
  // Logic to stop the jet ski when a collision is detected
  throttle = 0;
  // physics.velocity.set(0, 0, 0);  // Stop the jet ski
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



