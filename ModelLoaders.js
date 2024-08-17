import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

export default class ModelLoaders {
    constructor() {
        // Instantiate a loader
        this.GLTF_loader = new GLTFLoader();
        // instantiate a loader
        this.OBJ_loader = new OBJLoader();
        // instantiate a loader
        this.MTL_Loader = new MTLLoader()
    }

    async load_GLTF_Model(path) {
        let model = null;

        // Load a glTF resource
        const gltf = await this.GLTF_loader.loadAsync(
            // resource URL
            path,
            // called while loading is progressing
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
        );

        // return model when loaded
        model = gltf.scene;
        if (model) {
            return model;
        }
    }

    async load_OBJ_Model(path) {
        let model = null;

        // load a resource
        const obj = await this.OBJ_loader.loadAsync(
            // resource URL
            path,
            // called when loading is in progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
        );

        // return model when loaded
        model = obj;
        if (model) {
            return model;
        }
    }

    async load_OBJ_MTL_Model(MTL_path, OBJ_path) {
        let model = null;

        // load a resource mtl
        const mtl = await this.MTL_Loader.loadAsync(
            // resource URL
            MTL_path,
            // called when loading is in progresses
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
        );

        if (mtl) {
            mtl.preload();
            // loading geometry
            this.OBJ_loader.setMaterials(mtl);
            // load a resource
            const obj = await this.OBJ_loader.loadAsync(
                // resource URL
                OBJ_path,
                // called when loading is in progresses
                function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
            );

            // return model when loaded
            model = obj;
            if (model) {
                return model;
            }
        }
    }
}