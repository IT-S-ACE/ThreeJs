import * as THREE from 'three';
import Water from './Water';

export default class JetSki {

  constructor() {
    this.water = new Water();
    this.mass = 200;  // Initial mass (in kg)
    this.VODPJ = this.mass / this.water.rho;  // Volume of Drawn Part Of JetSki
    this.dragCon = 0.5;  // Drag coefficient
    this.A = 1.0;  // Area that faces the water resistance
    this.powerEngine = 500000;  // Engine power in watts
    this.velocityFan = new THREE.Vector3(1, 0, 1);
    this.position = new THREE.Vector3(0, 0, 0);  // Initial position of the jet ski
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.length = 3.0;  // Length of the jet ski
    this.momentOfInertia = (1/12) * this.mass * Math.pow(this.length / 2, 2);
    this.updateBuoyancy();  // Initialize buoyancy
  }

  // Method to update buoyancy and position based on mass
  updateBuoyancy() {
    const basePositionY = 0;  // Base Y position for the jet ski
    const displacementPerKg = 0.01;  // Example value: how much it sinks per kg of mass

    // Calculate how much the jet ski sinks
    this.position.y = basePositionY - (this.mass * displacementPerKg);
  }

  // Set mass method and update position accordingly
  setMass(newMass) {
    this.mass = newMass;
    this.updateBuoyancy();  // Recalculate the position when the mass changes
  }

  update() {
    // Update jet ski position and physics
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    // Buoyancy effect can be recalculated here if needed dynamically
  }
}
