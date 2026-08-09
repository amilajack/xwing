// eslint-disable
THREE.RenderPass = function(scene, camera, overrideMaterial, clearColor, clearAlpha) {
  this.scene = scene;
  this.camera = camera;
  this.overrideMaterial = overrideMaterial;
  this.clearColor = clearColor;
  this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;
  this.needsSwap = false;
  this.enabled = true;
  this.clear = true;
};

THREE.RenderPass.prototype = {
  render: function(renderer, writeBuffer, readBuffer, delta) {
    renderer.setRenderTarget(readBuffer);

    if (this.clearColor) {
      renderer.setClearColor(this.clearColor, this.clearAlpha);
    }
    if (this.clear) renderer.clear();

    this.scene.overrideMaterial = this.overrideMaterial || null;
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;
  }
};
