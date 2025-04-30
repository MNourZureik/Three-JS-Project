import Main from "../Main";
import * as THREE from 'three'

export default class Environment
{
    constructor()
    {
        this.main = new Main()
        this.scene = this.main.scene
        this.resources = this.main.resources
        this.debug = this.main.debug

        // Debug
        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('environment')
            this.debugFolder.close()
        }

        this.setSunLight()
        this.setEnvMap()
    }

    setSunLight()
    {
        this.sunLight = new THREE.DirectionalLight('#ffffff' , 4)
        this.sunLight.castShadow = true
        this.sunLight.shadow.camera.far = 15
        this.sunLight.shadow.mapSize.set(1024 ,1024)
        this.sunLight.shadow.normalBias = 0.05
        this.sunLight.position.set(3.5 , 2 , -1.25)
        this.scene.add(this.sunLight)

             // Debug
             if(this.debug.active)
                {
                    this.debugFolder
                        .add(this.sunLight, 'intensity')
                        .name('sunLightIntensity')
                        .min(0)
                        .max(10)
                        .step(0.001)
                    this.debugFolder
                        .add(this.sunLight.position, 'x')
                        .name('sunLightX')
                        .min(- 5)
                        .max(5)
                        .step(0.001)
                    this.debugFolder
                        .add(this.sunLight.position, 'y')
                        .name('sunLightY')
                        .min(- 5)
                        .max(5)
                        .step(0.001)
                    this.debugFolder
                        .add(this.sunLight.position, 'z')
                        .name('sunLightZ')
                        .min(- 5)
                        .max(5)
                        .step(0.001)
                }
    }
    setEnvMap()
    {
        this.envMap = {}
        this.envMap.intensity = 0.4
        this.envMap.texture = this.resources.items.EnvMapTexture
        this.envMap.texture.encoding = THREE.sRGBEncoding
        //this.scene.environment = this.envMap.texture

        this.envMap.updateMaterials = () =>
        {
            this.scene.traverse((child) =>
                {
                    if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
                    {
                        child.material.envMap = this.envMap.texture
                        child.material.envMapIntensity = this.envMap.intensity
                        child.material.needsUpdate = true
                    }
                }
            )
        }

        this.envMap.updateMaterials()
        this.scene.background = this.envMap.texture

        // Debug
        if(this.debug.active)
        {
            this.debugFolder
                .add(this.envMap, 'intensity')
                .name('envMapIntensity')
                .min(0)
                .max(10)
                .step(0.001)
                .onChange(this.envMap.updateMaterials)
        }
    }
}


   