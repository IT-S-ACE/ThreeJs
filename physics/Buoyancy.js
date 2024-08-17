import * as THREE from 'three';
export default class Buoyancy {
    constructor(volume, fluidDensity,g) {
      this.volume = volume; // volume of the drawn part of the  object in cubic meters
      this.fluidDensity = fluidDensity; // density of the fluid in kg/m^3
     this.g=g;
      this.buoyancy_force = new THREE.Vector3(
        0,
        this.volume * this.fluidDensity * this.g.length(),
        0
      );
    }
    buoyancy_forceChange() {
      var buoyancy_force = new THREE.Vector3(0, 1, 0);
      this.buoyancy_force = buoyancy_force.multiplyScalar(
        this.volume * this.fluidDensity * this.g.length()
      );
    }
    update() {
      this.buoyancy_forceChange();
      console.log
    }
  }