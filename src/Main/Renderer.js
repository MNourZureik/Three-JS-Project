import Main from './Main.js'
import * as THREE from 'three'

export default class Renderer
{
    constructor()
    {
        this.main = new Main()
        this.canvas = this.main.canvas
        this.scene = this.main.scene
        this.sizes = this.main.sizes
        this.camera = this.main.camera

        this.setInstance()
    }

    setInstance()
    {
        this.Instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        })
        //
        this.Instance.physicallyCorrectLights = true
        this.Instance.outputEncoding = THREE.sRGBEncoding
        this.Instance.toneMapping = THREE.CineonToneMapping
        this.Instance.toneMappingExposure = 0.75
        this.Instance.shadowMap.enabled = true
        this.Instance.shadowMap.type = THREE.PCFSoftShadowMap
        //
        this.Instance.setSize(this.sizes.width, this.sizes.height)
        this.Instance.setPixelRatio(this.sizes.pixelRatio)
        // this.Instance.toneMapping = THREE.ACESFilmicToneMapping;
        // this.Instance.toneMappingExposure = 0.5;
        document.body.appendChild( this.Instance.domElement );
    }

    resize()
    {
        this.Instance.setSize(this.sizes.width, this.sizes.height)
        this.Instance.setPixelRatio(this.sizes.pixelRatio)
    }

    update()
    {
        this.Instance.render(this.scene , this.camera.object)
    }
}