import * as THREE from 'three';

import Water from './Water';

export default class JetSki {
  
  constructor() {
    this.water=new Water();
    this.mass = 500;                         // kg
    this.VODPJ=this.mass/this.water.rho;      // Volume Of Drawn Part Of Jetski
    this.dragCon=0.5 ;                       //0.5 -> 0.8
    this.A=1.0  ;                               // the area that face the water resistance
    this.powerEngine =500000;      //82027                // horsepower(82027 watt)
    this.velocityFan=new THREE.Vector3(1,0,1);
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.length=3.0;
    this.momentOfInertia =(1/12)*this.mass*Math.pow(this.length/2,2); 
  }
}
