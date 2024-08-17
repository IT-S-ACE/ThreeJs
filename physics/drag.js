import * as THREE from 'three';
export default class Drag {
    constructor(coefficient, area, fluidDensity, velocity,direction) {
      this.coefficient = coefficient; // drag coefficient (dimensionless)
      this.area = area; // cross-sectional area of the jetski in m^2
      this.fluidDensity = fluidDensity; // density of the fluid (water or air) in kg/m^3
      this.velocity = velocity; // velocity of the jetski in m/s
      this.drag_force = new THREE.Vector3(
        -0.5 * this.coefficient * this.area * this.fluidDensity * Math.abs(this.velocity.x) * this.velocity.x,
        -0.5 * this.coefficient * this.area * this.fluidDensity * Math.abs(this.velocity.y) * this.velocity.y,
        -0.5 * this.coefficient * this.area * this.fluidDensity * Math.abs(this.velocity.z) * this.velocity.z
      );
      this.direction=direction;
      this.angleX=this.direction.angleTo(new THREE.Vector3(1,0,0))
      this.angleZ=this.direction.angleTo(new THREE.Vector3(0,0,1))
    }
    drag_forceChange() {
      var drag_force = new THREE.Vector3(
        -this.velocity.x,
        -this.velocity.y,
        -this.velocity.z
      );
      var f =-0.5 * this.coefficient * this.area * this.fluidDensity ;
      this.drag_force = drag_force.set(
        f * Math.abs(this.velocity.x) * this.velocity.x*Math.cos(this.angleX),0,f* Math.abs(this.velocity.z) * this.velocity.z*Math.cos(this.angleZ)
      );
    }
    update() {
      this.drag_forceChange();
    }
  }