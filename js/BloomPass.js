// eslint-disable
THREE.BloomPass = function(strength, kernelSize, sigma, resolution) {
  strength = (strength !== undefined) ? strength : 1;
  kernelSize = (kernelSize !== undefined) ? kernelSize : 25;
  sigma = (sigma !== undefined) ? sigma : 4.0;
  resolution = (resolution !== undefined) ? resolution : 256;

  const pars = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  };

  this.renderTargetX = new THREE.WebGLRenderTarget(resolution, resolution, pars);
  this.renderTargetY = new THREE.WebGLRenderTarget(resolution, resolution, pars);

  const screenShader = THREE.ShaderExtras.screen;
  this.screenUniforms = THREE.UniformsUtils.clone(screenShader.uniforms);
  this.screenUniforms['opacity'].value = strength;

  this.materialScreen = new THREE.ShaderMaterial({
    uniforms: this.screenUniforms,
    vertexShader: screenShader.vertexShader,
    fragmentShader: screenShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  const convolutionShader = THREE.ShaderExtras.convolution;
  this.convolutionUniforms = THREE.UniformsUtils.clone(convolutionShader.uniforms);
  this.convolutionUniforms['uImageIncrement'].value = THREE.BloomPass.blurX;
  this.convolutionUniforms['cKernel'].value = THREE.ShaderExtras.buildKernel(sigma);

  this.materialConvolution = new THREE.ShaderMaterial({
    uniforms: this.convolutionUniforms,
    vertexShader: '#define KERNEL_SIZE ' + kernelSize + '.0\n' + convolutionShader.vertexShader,
    fragmentShader: '#define KERNEL_SIZE ' + kernelSize + '\n' + convolutionShader.fragmentShader
  });

  this.needsSwap = false;
  this.enabled = true;
};

THREE.BloomPass.prototype = {
  render: function(renderer, writeBuffer, readBuffer, delta, maskActive) {
    if (maskActive) renderer.getContext().disable(renderer.getContext().STENCIL_TEST);

    // Blur pass 1
    THREE.EffectComposer.quad.material = this.materialConvolution;
    this.convolutionUniforms['tDiffuse'].value = readBuffer.texture;
    this.convolutionUniforms['uImageIncrement'].value = THREE.BloomPass.blurX;
    renderer.setRenderTarget(this.renderTargetX);
    renderer.clear();
    renderer.render(THREE.EffectComposer.scene, THREE.EffectComposer.camera);

    // Blur pass 2
    this.convolutionUniforms['tDiffuse'].value = this.renderTargetX.texture;
    this.convolutionUniforms['uImageIncrement'].value = THREE.BloomPass.blurY;
    renderer.setRenderTarget(this.renderTargetY);
    renderer.clear();
    renderer.render(THREE.EffectComposer.scene, THREE.EffectComposer.camera);

    // Composite bloom additively back to readBuffer
    THREE.EffectComposer.quad.material = this.materialScreen;
    this.screenUniforms['tDiffuse'].value = this.renderTargetY.texture;

    if (maskActive) renderer.getContext().enable(renderer.getContext().STENCIL_TEST);

    renderer.setRenderTarget(readBuffer);
    renderer.render(THREE.EffectComposer.scene, THREE.EffectComposer.camera);
  }
};

THREE.BloomPass.blurX = new THREE.Vector2(0.001953125, 0.0);
THREE.BloomPass.blurY = new THREE.Vector2(0.0, 0.001953125);
