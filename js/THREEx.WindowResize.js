// eslint-disable
var THREEx = THREEx || {};

THREEx.WindowResize = function(renderer, camera) {
  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (camera.isPerspectiveCamera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', onResize, false);
  return {
    stop: function() {
      window.removeEventListener('resize', onResize);
    }
  };
};
