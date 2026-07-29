// eslint-disable
THREE.EffectComposer = function(renderer, renderTarget) {
  this.renderer = renderer;

  if (renderTarget === undefined) {
    const size = renderer.getSize(new THREE.Vector2());
    renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    renderTarget.texture.name = 'EffectComposer.rt1';
  }

  this.renderTarget1 = renderTarget;
  this.renderTarget2 = renderTarget.clone();
  this.renderTarget2.texture.name = 'EffectComposer.rt2';

  this.writeBuffer = this.renderTarget1;
  this.readBuffer = this.renderTarget2;

  this.passes = [];
  this.copyPass = new THREE.ShaderPass(THREE.ShaderExtras.screen);
};

THREE.EffectComposer.prototype = {
  swapBuffers: function() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  },

  addPass: function(pass) {
    this.passes.push(pass);
  },

  render: function(delta) {
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

    let maskActive = false;
    const il = this.passes.length;

    for (let i = 0; i < il; i++) {
      const pass = this.passes[i];
      if (pass.enabled === false) continue;

      pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

      if (pass.needsSwap) {
        if (maskActive) {
          const context = this.renderer.getContext();
          context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);
          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);
          context.stencilFunc(context.EQUAL, 1, 0xffffffff);
        }
        this.swapBuffers();
      }

      if (pass instanceof THREE.MaskPass) {
        maskActive = true;
      } else if (pass instanceof THREE.ClearMaskPass) {
        maskActive = false;
      }
    }
  },

  setSize: function(width, height) {
    this.renderTarget1.setSize(width, height);
    this.renderTarget2.setSize(width, height);
    for (let i = 0; i < this.passes.length; i++) {
      if (this.passes[i].setSize) this.passes[i].setSize(width, height);
    }
  }
};

THREE.EffectComposer.geometry = new THREE.PlaneGeometry(2, 2);
THREE.EffectComposer.quad = new THREE.Mesh(THREE.EffectComposer.geometry, null);
THREE.EffectComposer.scene = new THREE.Scene();
THREE.EffectComposer.scene.add(THREE.EffectComposer.quad);
THREE.EffectComposer.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
