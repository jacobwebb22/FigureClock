import * as THREE from 'https://cdn.skypack.dev/three@0.124.0'
import GSAP from 'https://cdn.skypack.dev/gsap'
import fullpageJs from 'https://cdn.skypack.dev/fullpage.js';

class BlobAnimation {
  constructor() {

    this.elements = {
      scrollContent: document.querySelector('.sections')
    }

    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.scroll = {
      limit: 0.1,
      hard: 0,
      normalized: 0, 
      running: false
    }

    this.settings = {
      uTime: {
        type: 'f',
        value: 0.0
      },
      uSpeed: {
        start: .1,
        end: .18
      },
      // vertex
      uNoiseDensity: {
        start: 1.2,
        end: 2.
      },
      uNoiseStrength: {
        start: .3,
        end: .5
      },
      uFrequency: {
        start: .2,
        end: 4.
      },
      uAmplitude: {
        start: .15,
        end: 2.2
      },
      // fragment
      uRed: {
        start: 1.,
        end: .2
      },
      uBlue: {
        start: .2,
        end: .9
      }
    }

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color( 0xffffff );

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    })

    this.canvas = this.renderer.domElement

    this.camera = new THREE.PerspectiveCamera( 20, this.viewport.width / this.viewport.height, .1, 1000 )

    this.clock = new THREE.Clock()

    GSAP.defaults({
      ease: 'power2',
      duration: 2,
      overwrite: true,
      reversed: false
    })
    
    this.updateScrollAnimations = this.updateScrollAnimations.bind(this)
    this.update = this.update.bind(this)
        
    this.init()
  }
  
  init() {
    this.addCanvas()
    this.addCamera()
    this.addMesh()
    this.addFullpageHandler() 
    this.addEventListeners()
    this.onResize()
    this.update()
  }

  // FULLPAGE SCROLL HANDLER
  // init for autoscrolling behavior
  addFullpageHandler() {
    new fullpageJs('#fullpage', {	
      licenseKey: 'XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX', 
      scrollBar: true,
      autoScrolling: true
    })
  }

  // STAGE
  addCanvas() {
    this.canvas.classList.add('webgl')
    document.querySelector('.canvas-wrapper').appendChild(this.canvas)
  }

  addCamera() {
    this.camera.position.set(0, 0, 10)
    this.scene.add(this.camera)
  }

  // OBJECT
  addMesh() {
    this.geometry = new THREE.IcosahedronGeometry(1, 64)
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
      uniforms: {
        uTime: { 
          type: this.settings.uTime.type,
          value: this.settings.uTime.value,
        },
        uSpeed: { value: this.settings.uSpeed.start },
        uNoiseDensity: { value: this.settings.uNoiseDensity.start },
        uNoiseStrength: { value: this.settings.uNoiseStrength.start },
        uFrequency: { value: this.settings.uFrequency.start },
        uAmplitude: { value: this.settings.uAmplitude.start },
        uRed: { value: this.settings.uRed.start },
        uBlue: { value: this.settings.uBlue.start }
      }
    })
    
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    
    this.scene.add(this.mesh)
  }

  // SCROLL BASED ANIMATIONS
  updateScrollAnimations() {
    this.scroll.running = false

    this.scroll.limit = this.elements.scrollContent.clientHeight - this.viewport.height
    this.scroll.hard = window.scrollY
    this.scroll.hard = GSAP.utils.clamp(0, this.scroll.limit, this.scroll.hard)

    /*GSAP.to(this.mesh.rotation, {
      x: this.scroll.normalized * Math.PI
    })*/

    // iterate through noise-settings
    // calculate new settings value with scroll value depending on scroll position
    // write to mesh.material.uniforms
    for (const key in this.settings) {
      if (this.settings[key].start !== this.settings[key].end) {
        if ( key != 'uTime' || key != 'uSpeed' ) { // tried to exclude those two settings, but didn't change anything
          GSAP.to(this.mesh.material.uniforms[key], {
            value: this.settings[key].start + this.scroll.normalized * (this.settings[key].end - this.settings[key].start)
          })
        }
      }
    }
    
  }

  // EVENTS
  addEventListeners() {
    document.addEventListener('scroll', this.onScroll.bind(this))
    window.addEventListener('resize', this.onResize.bind(this))
  }

  onScroll() {
    //sets a value between 0 and 1, depends on how far it's scrolled
    this.scroll.normalized = (this.scroll.hard / this.scroll.limit).toFixed(1)

    if (!this.scroll.running) {
      window.requestAnimationFrame(this.updateScrollAnimations)
      this.scroll.running = true
    }
  }

  onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    if (this.viewport.width < this.viewport.height) {
      this.mesh.scale.set(.7, .7, .7)
    } else {
      this.mesh.scale.set(1, 1, 1)
    }

    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  }

  // LOOP
  update() {
    const elapsedTime = this.clock.getElapsedTime()

    //this.mesh.rotation.y = elapsedTime * .15
    //this.mesh.rotation.z = elapsedTime * -.1

    this.mesh.material.uniforms['uTime'].value = elapsedTime

    /*for (const key in this.settings) {
      if (this.settings[key].start !== this.settings[key].end) {
        //if ( key != 'uTime' || key != 'uSpeed' ) {
          GSAP.to(this.mesh.material.uniforms[key], {
            value: this.settings[key].start + this.scroll.normalized * (this.settings[key].end - this.settings[key].start)
          })
        //}
      }
    }*/

    this.render()
    window.requestAnimationFrame(this.update)
  }

  // RENDER
  render() {
    this.renderer.render(this.scene, this.camera)
  }  
}

new BlobAnimation()