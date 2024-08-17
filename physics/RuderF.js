import * as THREE from 'three';

export default class Rudder {
  constructor(jetski) {
    this.coefficient = 1.2; // Hydrodynamic coefficient (dimensionless)
    this.area = 0.2; // Steering surface area in m^2
    this.leverArmLength =jetski.length/3; // Lever arm length in meters
    this.fluidDensity = 1000; // Density of water in kg/m^3
    this.velocity = jetski.velocity; // Velocity of the jet ski in m/s
    this.steeringAngle = 0; // Initial steering angle in radians
    this.torque = new THREE.Vector3(0, 0, 0); // Initial torque vector
    this.dampingFactor = 2;
    
  }

  calculateTorque() {
    // Calculate the hydrodynamic force
    const relativeVelocity = this.velocity.length();
    const hydrodynamicForce = 0.5 * this.fluidDensity * Math.pow(relativeVelocity, 2) * this.coefficient * this.area;

    // Calculate the torque due to the steering angle
    const torqueMagnitude = hydrodynamicForce * this.leverArmLength * Math.sin(this.steeringAngle);

    // Assuming torque is around the Y-axis (yaw)
    this.torque.set(0, torqueMagnitude, 0);
  }
  applyDamping() {
    // Damping factor can be a combination of a base value and a term that scales with velocity
    const dampingFactor = this.dampingFactor + this.velocity.length() * this.velocityDampingCoefficient;
    this.torque.multiplyScalar(dampingFactor);
  }

  update(steeringAngle) {
    this.steeringAngle = steeringAngle; // Update the steering angle
    this.calculateTorque();
    this.torque.multiplyScalar(this.dampingFactor);
  }
}
