// eslint-disable
THREE.ShaderExtras = {

  screen: {
    uniforms: {
      tDiffuse: { value: null },
      opacity: { value: 1.0 }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      'vUv = vec2( uv.x, 1.0 - uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float opacity;',
      'uniform sampler2D tDiffuse;',
      'varying vec2 vUv;',
      'void main() {',
      'vec4 texel = texture2D( tDiffuse, vUv );',
      'gl_FragColor = opacity * texel;',
      '}'
    ].join('\n')
  },

  convolution: {
    uniforms: {
      tDiffuse: { value: null },
      uImageIncrement: { value: new THREE.Vector2(0.001953125, 0.0) },
      cKernel: { value: [] }
    },
    vertexShader: [
      'uniform vec2 uImageIncrement;',
      'varying vec2 vUv;',
      'void main() {',
      'vUv = uv - ( ( KERNEL_SIZE - 1.0 ) / 2.0 ) * uImageIncrement;',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float cKernel[ KERNEL_SIZE ];',
      'uniform sampler2D tDiffuse;',
      'uniform vec2 uImageIncrement;',
      'varying vec2 vUv;',
      'void main() {',
      'vec2 imageCoord = vUv;',
      'vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );',
      'for( int i = 0; i < KERNEL_SIZE; i ++ ) {',
      'sum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];',
      'imageCoord += uImageIncrement;',
      '}',
      'gl_FragColor = sum;',
      '}'
    ].join('\n')
  },

  film: {
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0.0 },
      nIntensity: { value: 0.5 },
      sIntensity: { value: 0.05 },
      sCount: { value: 4096 },
      grayscale: { value: 1 }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      'vUv = vec2( uv.x, 1.0 - uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float time;',
      'uniform bool grayscale;',
      'uniform float nIntensity;',
      'uniform float sIntensity;',
      'uniform float sCount;',
      'uniform sampler2D tDiffuse;',
      'varying vec2 vUv;',
      'void main() {',
      'vec4 cTextureScreen = texture2D( tDiffuse, vUv );',
      'float x = vUv.x * vUv.y * time * 1000.0;',
      'x = mod( x, 13.0 ) * mod( x, 123.0 );',
      'float dx = mod( x, 0.01 );',
      'vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx * 100.0, 0.0, 1.0 );',
      'vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );',
      'cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;',
      'cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0, 1.0 ) * ( cResult - cTextureScreen.rgb );',
      'if( grayscale ) {',
      'cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );',
      '}',
      'gl_FragColor = vec4( cResult, cTextureScreen.a );',
      '}'
    ].join('\n')
  },

  vignette: {
    uniforms: {
      tDiffuse: { value: null },
      offset: { value: 1.0 },
      darkness: { value: 1.0 }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      'vUv = vec2( uv.x, 1.0 - uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float offset;',
      'uniform float darkness;',
      'uniform sampler2D tDiffuse;',
      'varying vec2 vUv;',
      'void main() {',
      'vec4 texel = texture2D( tDiffuse, vUv );',
      'vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );',
      'gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );',
      '}'
    ].join('\n')
  },

  focus: {
    uniforms: {
      tDiffuse: { value: null },
      screenWidth: { value: 1024 },
      screenHeight: { value: 1024 },
      sampleDistance: { value: 0.94 },
      waveFactor: { value: 0.00125 }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      'vUv = vec2( uv.x, 1.0 - uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float screenWidth;',
      'uniform float screenHeight;',
      'uniform float sampleDistance;',
      'uniform float waveFactor;',
      'uniform sampler2D tDiffuse;',
      'varying vec2 vUv;',
      'void main() {',
      'vec4 color, org, tmp, add;',
      'float sample_dist, f;',
      'vec2 vin;',
      'vec2 uv = vUv;',
      'add = color = org = texture2D( tDiffuse, uv );',
      'vin = ( uv - vec2( 0.5 ) ) * vec2( 1.4 );',
      'sample_dist = dot( vin, vin ) * 2.0;',
      'f = ( waveFactor * 100.0 + sample_dist ) * sampleDistance * 4.0;',
      'vec2 sampleSize = vec2( 1.0 / screenWidth, 1.0 / screenHeight ) * vec2( f );',
      'add += tmp = texture2D( tDiffuse, uv + vec2( 0.111964, 0.993712 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'add += tmp = texture2D( tDiffuse, uv + vec2( 0.846724, 0.532032 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'add += tmp = texture2D( tDiffuse, uv + vec2( 0.943883, -0.330279 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'add += tmp = texture2D( tDiffuse, uv + vec2( 0.330279, -0.943883 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'add += tmp = texture2D( tDiffuse, uv + vec2( -0.532032, -0.846724 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'add += tmp = texture2D( tDiffuse, uv + vec2( -0.993712, -0.111964 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'add += tmp = texture2D( tDiffuse, uv + vec2( -0.707107, 0.707107 ) * sampleSize );',
      'if( tmp.b < color.b ) color = tmp;',
      'color = color * vec4( 2.0 ) - ( add / vec4( 8.0 ) );',
      'color = color + ( add / vec4( 8.0 ) - color ) * ( vec4( 1.0 ) - vec4( sample_dist * 0.5 ) );',
      'vec3 finalRGB = color.rgb * color.rgb * vec3( 0.95 ) + color.rgb;',
      // Apply sRGB gamma encoding so ShaderMaterial output matches built-in material output
      'finalRGB = pow( clamp( finalRGB, 0.0, 1.0 ), vec3( 1.0 / 2.2 ) );',
      'gl_FragColor = vec4( finalRGB, 1.0 );',
      '}'
    ].join('\n')
  },

  buildKernel: function(sigma) {
    function gauss(x, sigma) {
      return Math.exp(-(x * x) / (2.0 * sigma * sigma));
    }
    const kMaxKernelSize = 25;
    let kernelSize = 2 * Math.ceil(sigma * 3.0) + 1;
    if (kernelSize > kMaxKernelSize) kernelSize = kMaxKernelSize;
    const halfWidth = (kernelSize - 1) * 0.5;
    const values = new Array(kernelSize);
    let sum = 0.0;
    for (let i = 0; i < kernelSize; ++i) {
      values[i] = gauss(i - halfWidth, sigma);
      sum += values[i];
    }
    for (let i = 0; i < kernelSize; ++i) values[i] /= sum;
    return values;
  }

};
