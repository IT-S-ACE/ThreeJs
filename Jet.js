import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class Jet {
  constructor(scene, physic) {
    this.scene = scene;
    this.physic = physic; // Make sure physic is passed correctly
    console.log('Jet constructor: physic instance:', this.physic); // Debugging
    this.loadModel();
  }

  loadModel() {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./assets/jetmodel/untitled.glb', (gltf) => {
      console.log('Model loaded:', gltf); // Debugging
      gltf.scene.scale.set(0.4, 0.4, 0.4);
      gltf.scene.position.set(5, 0, 10);
      gltf.scene.rotation.z = Math.PI / 5;
      this.jet = gltf.scene;
      this.scene.add(this.jet);
    }, undefined, (error) => {
      console.error('Error loading model:', error); // Error handling
    });
  }

  update() {
    if (this.jet && this.physic) {
      console.log('Updating jet:', this.physic.jetski.position); // Debugging
      this.jet.position.copy(this.physic.jetski.position);
      this.jet.rotation.copy(this.physic.orientation);
    } else {
      console.warn('Jet or physic instance is not available.'); // Debugging
    }
  }
}
