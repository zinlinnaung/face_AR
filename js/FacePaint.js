class FacePaint {
  static get EYE_VERTICES() {
    return [
      // LEFT EYE
      133, 173, 157, 158, 159, 160, 161, 246, 33, 7, 163, 144, 145, 153, 154,
      155,
      // RIGHT EYE
      362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381,
      382,
    ];
  }
  _addCamera() {
    this._camera = new THREE.OrthographicCamera(
      this._halfW,
      -this._halfW,
      -this._halfH,
      this._halfH,
      1,
      1000
    );
    this._camera.position.x = this._halfW;
    this._camera.position.y = this._halfH;
    this._camera.position.z = -600;
    this._camera.lookAt(this._halfW, this._halfH, 0);
  }

  set blendMode(val) {
    this._renderer.domElement.style.mixBlendMode = val;
  }

  _addLights() {
    const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
    this._scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position
      .set(this._halfW, this._halfH * 0.5, -1000)
      .normalize();
    this._scene.add(directionalLight);
  }

  _addGeometry() {
    this._geometry = new THREE.BufferGeometry();
    this._geometry.setIndex(TRIANGULATION);

    const numVertices = positionBufferData.length / 3;
    const alphaValues = new Float32Array(numVertices);

    // Set alpha value for each vertex in the UV coordinates
    for (let i = 0; i < numVertices; i++) {
      const alpha = i < FacePaint.EYE_VERTICES.length ? 0.0 : 1.0; // Set alpha value for eye vertices
      alphaValues[i] = alpha;
    }

    this._geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionBufferData, 3)
    );
    this._geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    this._geometry.setAttribute(
      "alpha",
      new THREE.Float32BufferAttribute(alphaValues, 1)
    );
    this._geometry.computeVertexNormals();
  }

  _addMaterial() {
    this._textureLoader = new THREE.TextureLoader();
    const texture = this._textureLoader.load(this._textureFilePath);

    // Set the "color space" of the texture
    texture.encoding = THREE.sRGBEncoding;

    // Reduce blurring at glancing angles
    texture.anisotropy = 16;

    const alpha = 0.4;
    const beta = 0.5;

    this._material = new THREE.MeshPhongMaterial({
      map: texture,
      color: new THREE.Color(0xffffff),
      specular: new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2),
      reflectivity: beta,
      shininess: Math.pow(2, alpha * 10),
      transparent: true, // Enable transparency
      alphaTest: 0.5, // Set alpha test threshold for transparency
    });
  }

  _setupScene() {
    this._scene = new THREE.Scene();
    this._addCamera();
    this._addLights();
    this._addGeometry();
    this._addMaterial();
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this._scene.add(this._mesh);
  }

  async updateTexture(url, isVideo) {
    let texture;
    if (this._video) {
      this._video.pause();
    }
    if (isVideo) {
      this._video = document.querySelector(`video[src="${url}"]`);
      this._video.play();
      texture = new THREE.VideoTexture(this._video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    } else {
      texture = await this._textureLoader.loadAsync(url);
    }

    this._material.map = texture;
  }

  render(positionBufferData) {
    this._geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positionBufferData, 3)
    );
    this._geometry.attributes.position.needsUpdate = true;

    this._renderer.render(this._scene, this._camera);
  }

  constructor({ id, textureFilePath, w, h }) {
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: document.querySelector(`#${id}`),
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(w, h);
    this._halfW = w * 0.5;
    this._halfH = h * 0.5;
    this._textureFilePath = textureFilePath;
    this._setupScene();
  }
}
