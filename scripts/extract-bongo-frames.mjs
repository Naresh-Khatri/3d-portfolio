import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Preserve the original artwork; the GLB contains only two flat, unlit image planes.
const source = readFileSync(new URL("../public/assets/skills-keyboard.spline", import.meta.url));
const directory = new URL("../public/assets/keyboard/", import.meta.url);
const chunks = [];
const bufferViews = [];
let length = 0;
function append(data, target) {
  const bytes = Buffer.from(data.buffer ?? data, data.byteOffset ?? 0, data.byteLength ?? data.length);
  const index = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length, ...(target ? { target } : {}) });
  const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4);
  bytes.copy(padded);
  chunks.push(padded);
  length += padded.length;
  return index;
}
const position = append(new Float32Array([-.5, 0, 0, .5, 0, 0, .5, 1, 0, -.5, 1, 0]), 34962);
const normal = append(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 34962);
const uv = append(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), 34962);
const indices = append(new Uint16Array([0, 1, 2, 0, 2, 3]), 34963);
const images = [1, 2].map((frame) => {
  const marker = source.indexOf(`frame-${frame}`);
  const start = source.indexOf(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), marker);
  const end = source.indexOf("IEND", start) + 8;
  if (marker < 0 || start < 0 || end <= start) throw new Error(`Missing bongo frame ${frame}`);
  const png = source.subarray(start, end);
  writeFileSync(new URL(`bongo-frame-${frame}.png`, directory), png);
  return { bufferView: append(png), mimeType: "image/png" };
});
const gltf = {
  asset: { version: "2.0", generator: "Portfolio original Spline image extraction" },
  extensionsUsed: ["KHR_materials_unlit"], extensionsRequired: ["KHR_materials_unlit"],
  scene: 0, scenes: [{ nodes: [0, 1] }],
  nodes: [0, 1].map((mesh) => ({ name: `Bongo frame ${mesh + 1}`, mesh })),
  meshes: [0, 1].map((material) => ({ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material }] })),
  materials: [0, 1].map((index) => ({ doubleSided: true, alphaMode: "BLEND",
    extensions: { KHR_materials_unlit: {} }, pbrMetallicRoughness: { baseColorTexture: { index }, metallicFactor: 0, roughnessFactor: 1 } })),
  textures: [0, 1].map((source) => ({ source, sampler: 0 })),
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
  images, buffers: [{ byteLength: length }], bufferViews,
  accessors: [
    { bufferView: position, componentType: 5126, count: 4, type: "VEC3", min: [-.5, 0, 0], max: [.5, 1, 0] },
    { bufferView: normal, componentType: 5126, count: 4, type: "VEC3" },
    { bufferView: uv, componentType: 5126, count: 4, type: "VEC2" },
    { bufferView: indices, componentType: 5123, count: 6, type: "SCALAR" },
  ],
};
const json = Buffer.from(JSON.stringify(gltf));
const paddedJson = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32);
json.copy(paddedJson);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJson.length + length, 8);
header.writeUInt32LE(paddedJson.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
const result = Buffer.concat([header, paddedJson, binaryHeader, ...chunks]);
writeFileSync(new URL("bongo-frames.glb", directory), result);
console.log({ size: result.length, hash: createHash("sha256").update(result).digest("hex") });
