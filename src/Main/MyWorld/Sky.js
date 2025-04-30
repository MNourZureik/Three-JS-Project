import Main from "../Main";
import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import Environment from "./Environment";

export default class Sky_Class extends Environment{
    constructor(){
        super();
        this.main = new Main();
        this.debug = this.main.debug;
        this.scene = this.main.scene;
        this.sun = new THREE.Vector3();
        this.pmremGenerator = new THREE.PMREMGenerator(new THREE.WebGLRenderer());
        this.renderTarget;
        this.sceneENV = new THREE.Scene();

        this.parameters = 
        {
            elevation: 1,
            azimuth: 180,
        };

        this.set_sky();
        this.updateSun();
    }

    set_sky()
    {
        this.sky = new Sky();
        this.sky.scale.setScalar(100000 * 2);
        this.scene.add(this.sky);

        this.skyUniforms = this.sky.material.uniforms;

        this.skyUniforms[ 'turbidity' ].value =10;
        this.skyUniforms[ 'rayleigh' ].value = 4;
        this.skyUniforms[ 'mieCoefficient' ].value = 0.005;
        this.skyUniforms[ 'mieDirectionalG' ].value = 0.8;

        if(this.main.debug.active)
        {
            this.folderSky = this.main.debug.ui.addFolder( 'Sky' );
            this.folderSky.add( this.parameters, 'elevation', 0, 90, 0.1 ).onChange( (v)=>{
                this.updateSun();
            } );
            this.folderSky.add( this.parameters, 'azimuth', - 180, 180, 0.1 ).onChange( (v) =>{
                this.updateSun();
            } );
            this.folderSky.close();
        }
    }

    updateSun() 
    {
        this.phi = THREE.MathUtils.degToRad( 90 - this.parameters.elevation );
        this.theta = THREE.MathUtils.degToRad( this.parameters.azimuth );
        
        this.sun.setFromSphericalCoords( 1, this.phi, this.theta );
        
        this.sky.material.uniforms[ 'sunPosition' ].value.copy( this.sun);
        
        if ( this.renderTarget !== undefined ) this.renderTarget.dispose();

        this.sceneENV.add(this.sky);
        this.renderTarget = this.pmremGenerator.fromScene(this.sceneENV);
        this.scene.add(this.sky);
        
        this.scene.environment = this.renderTarget.texture;
        
    }
}