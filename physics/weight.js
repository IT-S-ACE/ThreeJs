import * as THREE from 'three';

export default class Weight {
  constructor(mass, g, jetski) {
    this.mass = mass; // mass in kilograms
    this.g = g; // acceleration due to gravity in m/s^2
    this.weight_force = new THREE.Vector3(
      0,
      -1 * this.mass * this.g.length(),
      0
    );
    this.jetski = jetski; // Reference to the jetski object for position adjustment
  }

  weight_forceChange() {
    var weight_force = new THREE.Vector3(0, -1, 0);
    this.weight_force = weight_force.multiplyScalar(
      this.mass * this.g.length()
    );
  }

  checkMassAndAdjustPosition() {
    if (this.mass > 1000) {
      // If mass is greater than 1000, decrease the y position of the jetski
      this.jetski.position.y -= (this.mass - 1000) * 0.01; // Adjust the decrease rate as needed
    }
  }

  update() {
    this.weight_forceChange();
    this.checkMassAndAdjustPosition(); // Check mass and adjust position if necessary
  }
}
