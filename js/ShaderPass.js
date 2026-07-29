// eslint-disable
THREE.ShaderPass = function(shader, textureID) {
  this.textureID = (textureID !== undefined) ? textureID : 'tDiffuse';
  this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
  this.material = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  });
  this.renderToScreen = false;
  this.needsSwap = true;
  this.enabled = true;
  this.clear = false;
};

THREE.ShaderPass.prototype = {
  render: function(renderer, writeBuffer, readBuffer, delta) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }

    THREE.EffectComposer.quad.material = this.material;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    renderer.render(THREE.EffectComposer.scene, THREE.EffectComposer.camera);
  }
};
