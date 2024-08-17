import * as THREE from 'three';

export default class Thrust {
  constructor(powerEngine, velocityFan, direction) {
    this.powerEngine = powerEngine; // Maximum power of the engine
    this.velocityFan = velocityFan; // Velocity of the fan
    this.direction = direction; // Direction of the thrust force
    this.thrust_force = new THREE.Vector3(0, 0, 0); // Initial thrust force
  }

  update(throttle) {
    let thrustMagnitude = this.powerEngine * throttle;
    this.thrust_force = this.direction.clone().multiplyScalar(thrustMagnitude);
  }
}
