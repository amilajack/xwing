// eslint-disable
// Loads Three.js "version 2" JSON model format (old OBJ converter output)
THREE.LegacyModelLoader = function() {};

THREE.LegacyModelLoader.prototype.load = function(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function() {
    // Model files define `var model = {...}` and call postMessage/close for Worker use.
    // Provide no-ops for those so the file runs safely, then return model.
    const fn = new Function('postMessage', 'close', xhr.responseText + '; return model;');
    const m = fn(function() {}, function() {});
    const result = THREE.LegacyModelLoader.prototype.parse(m);
    callback(result.geometry, result.materials);
  };
  xhr.onerror = function() {
    console.error('LegacyModelLoader: failed to load', url);
  };
  xhr.send();
};

THREE.LegacyModelLoader.prototype.parse = function(model) {
  const s = (model.scale !== undefined) ? (1.0 / model.scale) : 1.0;
  const verts = model.vertices;
  const faceData = model.faces;
  const norms = model.normals || [];
  const uvLayers = (model.uvs && model.uvs.length) ? model.uvs.length : 0;

  // First pass: decode all faces into triangle records
  const triangles = [];
  let i = 0;
  while (i < faceData.length) {
    const type = faceData[i++];
    const isQuad       = (type & 1) !== 0;
    const hasMat       = (type & 2) !== 0;
    const hasFaceUv    = (type & 4) !== 0;   // one UV index per face
    const hasVertUv    = (type & 8) !== 0;   // one UV index per vertex per layer
    const hasFaceNorm  = (type & 16) !== 0;  // one face-normal index
    const hasVertNorm  = (type & 32) !== 0;  // one normal index per vertex
    const hasFaceColor = (type & 64) !== 0;  // one color per face
    const hasVertColor = (type & 128) !== 0; // one color per vertex

    const nv = isQuad ? 4 : 3;
    const vi = [];
    for (let j = 0; j < nv; j++) vi.push(faceData[i++]);

    let mat = 0;
    if (hasMat) mat = faceData[i++];

    if (hasFaceUv) i += uvLayers;           // one UV index per face per layer
    if (hasVertUv) i += uvLayers * nv;      // one UV index per vertex per layer
    if (hasFaceNorm) i++;

    const vni = [];
    if (hasVertNorm) {
      for (let j = 0; j < nv; j++) vni.push(faceData[i++]);
    }
    if (hasFaceColor) i++;
    if (hasVertColor) i += nv;

    if (isQuad) {
      triangles.push({ vi: [vi[0], vi[1], vi[2]], ni: hasVertNorm ? [vni[0], vni[1], vni[2]] : null, mat });
      triangles.push({ vi: [vi[0], vi[2], vi[3]], ni: hasVertNorm ? [vni[0], vni[2], vni[3]] : null, mat });
    } else {
      triangles.push({ vi: [vi[0], vi[1], vi[2]], ni: hasVertNorm ? [vni[0], vni[1], vni[2]] : null, mat });
    }
  }

  // Group triangles by material index while preserving first-seen order
  const matGroups = {};
  const matOrder = [];
  for (const tri of triangles) {
    if (!matGroups[tri.mat]) {
      matGroups[tri.mat] = [];
      matOrder.push(tri.mat);
    }
    matGroups[tri.mat].push(tri);
  }

  // Build flat Float32 arrays grouped by material
  const positions = [];
  const normalArr = [];
  const groups = [];

  for (const matIdx of matOrder) {
    const start = positions.length / 3;
    const tris = matGroups[matIdx];
    for (const tri of tris) {
      for (let j = 0; j < 3; j++) {
        const v = tri.vi[j];
        positions.push(verts[v * 3] * s, verts[v * 3 + 1] * s, verts[v * 3 + 2] * s);
        if (tri.ni) {
          const n = tri.ni[j];
          normalArr.push(norms[n * 3], norms[n * 3 + 1], norms[n * 3 + 2]);
        }
      }
    }
    groups.push({ start, count: positions.length / 3 - start, materialIndex: matIdx });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normalArr.length > 0) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalArr, 3));
  } else {
    geometry.computeVertexNormals();
  }
  for (const g of groups) {
    geometry.addGroup(g.start, g.count, g.materialIndex);
  }

  // Parse materials
  const materials = [];
  if (model.materials) {
    for (const m of model.materials) {
      const s = 1.0;
      const diffuse = m.colorDiffuse
        ? new THREE.Color(m.colorDiffuse[0] * s, m.colorDiffuse[1] * s, m.colorDiffuse[2] * s)
        : new THREE.Color(0.5 * s, 0.5 * s, 0.5 * s);
      const mat = new THREE.MeshPhongMaterial({
        color: diffuse,
        emissive: diffuse.clone().multiplyScalar(0.05),
        specular: m.colorSpecular
          ? new THREE.Color(m.colorSpecular[0] * s, m.colorSpecular[1] * s, m.colorSpecular[2] * s)
          : new THREE.Color(0.33, 0.33, 0.33),
        shininess: m.specularCoef || 50
      });
      materials.push(mat);
    }
  }

  return { geometry, materials };
};
