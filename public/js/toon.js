// Trickfilm-Look: Cel-Shading (wenige harte Licht-Stufen) für alle Materialien
// und dicke dunkle Umrisslinien als Nachbearbeitung über das ganze Bild.
import * as THREE from 'three';

// Drei Helligkeits-Stufen: Schattenseite, Halbschatten, volles Licht
const gradient = new THREE.DataTexture(new Uint8Array([120, 200, 255]), 3, 1, THREE.RedFormat);
gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
gradient.generateMipmaps = false;
gradient.needsUpdate = true;

// Ersatz für MeshLambertMaterial mit denselben Optionen
export function toonMat(o = {}) {
  return new THREE.MeshToonMaterial({ ...o, gradientMap: gradient });
}

// Umrisslinien: Das Bild wird in eine Textur gezeichnet. Wo die Tiefe springt (Kante, Ecke) wird eine Linie gezogen.
// Danach werden die Farben kräftiger gemacht. Linien verblassen in der Ferne, damit es ruhig bleibt.
export class Outline {
  constructor(renderer) {
    this.renderer = renderer;
    this.enabled = true;
    this.size = new THREE.Vector2();
    renderer.getDrawingBufferSize(this.size);
    this.samples = renderer.getPixelRatio() >= 2 ? 2 : 4;
    this.rt = new THREE.WebGLRenderTarget(this.size.x, this.size.y, {
      samples: this.samples,
      depthTexture: new THREE.DepthTexture(this.size.x, this.size.y),
    });
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture },
        texel: { value: new THREE.Vector2() }, near: { value: 0.1 }, far: { value: 500 },
        thick: { value: 1.5 }, ink: { value: new THREE.Color('#2a1630') }, sat: { value: 1.25 },
        fade: { value: new THREE.Vector2(70, 170) },
      },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `#include <packing>
        uniform sampler2D tColor, tDepth; uniform vec2 texel, fade; uniform float near, far, thick, sat; uniform vec3 ink;
        varying vec2 vUv;
        float inv(vec2 uv) { return 1.0 / max(-perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far), 0.01); }
        void main() {
          vec4 col = texture2D(tColor, vUv);
          float l = dot(col.rgb, vec3(0.299, 0.587, 0.114));
          col.rgb = max(mix(vec3(l), col.rgb, sat), 0.0);
          vec2 o = texel * thick;
          float c = inv(vUv);
          // 1/Tiefe ist auf ebenen Flächen gleichmässig: die zweite Ableitung ist nur an Kanten gross
          float e = abs(inv(vUv - vec2(o.x, 0.0)) + inv(vUv + vec2(o.x, 0.0)) - 2.0 * c)
                  + abs(inv(vUv - vec2(0.0, o.y)) + inv(vUv + vec2(0.0, o.y)) - 2.0 * c)
                  + 0.5 * abs(inv(vUv - o) + inv(vUv + o) - 2.0 * c)
                  + 0.5 * abs(inv(vUv + vec2(o.x, -o.y)) + inv(vUv + vec2(-o.x, o.y)) - 2.0 * c);
          float edge = smoothstep(0.03, 0.09, e / c);
          edge *= 1.0 - smoothstep(fade.x, fade.y, 1.0 / c);
          col.rgb = mix(col.rgb, ink, edge * 0.92);
          col.a = max(col.a, edge * 0.92); // Vorschau mit durchsichtigem Hintergrund: Umriss auch aussen sichtbar
          gl_FragColor = col;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      depthTest: false, depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.quad.frustumCulled = false;
    this.qScene = new THREE.Scene();
    this.qScene.add(this.quad);
    this.qCam = new THREE.Camera();
    this.setSize();
  }

  setSize() {
    this.renderer.getDrawingBufferSize(this.size);
    this.rt.setSize(this.size.x, this.size.y);
    this.mat.uniforms.texel.value.set(1 / this.size.x, 1 / this.size.y);
    this.mat.uniforms.thick.value = 1.3 * this.renderer.getPixelRatio();
  }

  // null = Standard-Kantenglättung
  setSamples(n) {
    const want = n ?? this.samples;
    if (this.rt.samples === want) return;
    this.rt.samples = want;
    this.rt.dispose();
  }

  render(scene, camera) {
    const r = this.renderer;
    if (!this.enabled) { r.render(scene, camera); return; }
    const u = this.mat.uniforms;
    u.near.value = camera.near; u.far.value = camera.far;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.qScene, this.qCam);
  }

  dispose() {
    this.rt.depthTexture.dispose();
    this.rt.dispose();
    this.mat.dispose();
    this.quad.geometry.dispose();
  }
}
