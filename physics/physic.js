import * as THREE from 'three';
import Buoyancy from './Buoyancy';
import Drag from './drag';
import Thrust from './thrust';
import Weight from './weight';
import JetSki from './jetski';
import Water from './Water';
import Rudder from './RuderF';

export default class Physic {
  constructor() {
    this.direction = new THREE.Vector3(0, 0, 1);
    this.jetski = new JetSki();
    this.g = new THREE.Vector3(0, -9.82, 0);
    this.water = new Water();
    this.totalForce = new THREE.Vector3(0, 0, 0);
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.buoyancy = new Buoyancy(this.jetski.VODPJ, this.water.rho, this.g);
    this.drag = new Drag(this.jetski.dragCon, this.jetski.A, this.water.rho, this.jetski.velocity, this.direction);
    this.thrust = new Thrust(this.jetski.powerEngine, this.jetski.velocityFan, this.direction);
    this.weight = new Weight(this.jetski.mass, this.g);
    this.rudder = new Rudder(this.jetski); // Initialize Rudder
    this.deltaT = 0.02; // Time step
  
    this.totalTorque = new THREE.Vector3(0, 0, 0);
    this.angularAcceleration = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.orientation = new THREE.Euler(0, 0, 0); // Orientation (pitch, yaw, roll)
   this.maxAngularVelocity = Math.PI/20;
  }

  updateDirection() {
    this.direction.set(0, 0, 1).applyEuler(this.orientation).normalize();
  }

  reset() {
   
    this.jetski.position.set(0, 0, 0); 
    this.jetski.velocity.set(0, 0, 0);  
    this.jetski.acceleration.set(0, 0, 0);  

    this.orientation.set(0, 0, 0);  

   
    this.thrust.velocityFan.set(0, 0, 0);

    this.drag.drag_force.set(0, 0, 0);

    this.deltaT = 0;
  }

  calc_totForce() {
    let TF = new THREE.Vector3(0, 0, 0);
    this.updateDirection();
    this.thrust.direction.copy(this.direction);
    this.drag.direction.copy(this.direction);
    TF.add(this.thrust.thrust_force);
    TF.add(this.drag.drag_force);
    TF.add(this.weight.weight_force);
    TF.add(this.buoyancy.buoyancy_force);
    this.totalForce.copy(TF);
  }

  calc_acceleration() {
    let acc = new THREE.Vector3().copy(this.totalForce).divideScalar(this.jetski.mass);
    this.acceleration.copy(acc);
    this.jetski.acceleration.copy(acc);
  }

  calc_velocity() {
    let velChange = this.acceleration.clone().multiplyScalar(this.deltaT);
    this.velocity.add(velChange);
    this.jetski.velocity.add(velChange);
  }

  
  calc_distance() {
    let des = this.velocity.clone().multiplyScalar(this.deltaT);
    this.position.add(des);
    this.jetski.position.add(des);
  }

  calc_totTorque() {
    let TT = new THREE.Vector3(0, 0, 0);
    TT.add(this.rudder.torque);
    this.totalTorque.copy(TT);
  }

  calc_angularAcceleration() {
    let angularAcc = this.totalTorque.clone().divideScalar(this.jetski.momentOfInertia);
    this.angularAcceleration.copy(angularAcc);
  }

  calc_angularVelocity() {
    let angularVelChange = this.angularAcceleration.clone().multiplyScalar(this.deltaT);
    this.angularVelocity.add(angularVelChange);
    this.angularVelocity.clampLength(0, this.maxAngularVelocity);
  }

  calc_orientation() {
    let deltaOrientation = new THREE.Euler(
      this.angularVelocity.x * this.deltaT,
      this.angularVelocity.y * this.deltaT,
      this.angularVelocity.z * this.deltaT
    );
    this.orientation.x += deltaOrientation.x;
    this.orientation.y += deltaOrientation.y;
    this.orientation.z += deltaOrientation.z;
  }

  update(steeringAngle, throttle) {
    this.rudder.update(steeringAngle); // Update rudder with the new steering angle and velocity
    this.weight.update();
    this.thrust.update(throttle);
    this.drag.update();
    this.buoyancy.update();

    this.calc_totForce();
    this.calc_acceleration();
    this.calc_velocity();
    this.calc_distance();

    this.calc_totTorque();
    this.calc_angularAcceleration();
    this.calc_angularVelocity();
    this.calc_orientation();
  }
}
