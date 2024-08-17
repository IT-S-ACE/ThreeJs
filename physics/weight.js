import * as THREE from 'three';
export default class Weight {
    constructor(mass, g) {
      this.mass = mass; // mass in kilograms
      this.g = g; // acceleration due to gravity in m/s^2
      this.weight_force = new THREE.Vector3(
        0,
        -1 *this.mass * this.g.length(),
        0
      );
    }
    weight_forceChange() {
        var weight_force = new THREE.Vector3(0, -1, 0);
        this.weight_force = weight_force.multiplyScalar(
          this.mass * this.g.length()
        );
      }
   update() {
    this.weight_forceChange();
  }  
  }
  
 