// eslint-disable
THREE.MaskPass = function(scene, camera) {
  this.scene = scene;
  this.camera = camera;
  this.clear = true;
  this.needsSwap = false;
  this.enabled = true;
};

THREE.MaskPass.prototype = {
  render: function(renderer, writeBuffer, readBuffer, delta) {
    const context = renderer.getContext();

    context.colorMask(false, false, false, false);
    context.depthMask(false);
    context.enable(context.STENCIL_TEST);
    context.stencilOp(context.REPLACE, context.REPLACE, context.REPLACE);
    context.stencilFunc(context.ALWAYS, 1, 0xffffffff);

    renderer.setRenderTarget(readBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);

    renderer.setRenderTarget(writeBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);

    context.colorMask(true, true, true, true);
    context.depthMask(true);
    context.stencilFunc(context.EQUAL, 1, 0xffffffff);
    context.stencilOp(context.KEEP, context.KEEP, context.KEEP);
  }
};

THREE.ClearMaskPass = function() {};
THREE.ClearMaskPass.prototype = {
  needsSwap: false,
  enabled: true,
  render: function(renderer, writeBuffer, readBuffer, delta) {
    const context = renderer.getContext();
    context.disable(context.STENCIL_TEST);
  }
};
