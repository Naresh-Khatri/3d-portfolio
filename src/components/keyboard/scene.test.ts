import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { validateDocument } from "@chibi3d/runtime/schema";
import { SKILLS } from "../../data/constants";
import { createKeyboardScene, resolveKeyboardAsset, KEYBOARD_MODEL_URL } from "./scene";

const skills = Object.values(SKILLS).map((skill) => ({ ...skill, icon: skill.keyboardIcon ?? skill.icon }));

describe("generated keyboard", () => {
  it("validates a full, serializable scene for every configured skill", () => {
    const scene = createKeyboardScene(skills);
    const doc = validateDocument(JSON.parse(JSON.stringify(scene.document)));
    expect(scene.keys).toHaveLength(skills.length);
    expect(new Set(scene.keys.map((key) => key.skill.name)).size).toBe(skills.length);
    expect(doc.interactions).toEqual([]);
    for (const key of scene.keys) {
      expect(doc.nodes[key.nodeId].name).toBe(key.skill.name);
      expect(doc.states[key.pressedStateId].nodeId).toBe(key.nodeId);
      expect(doc.materials[key.materialId].color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(doc.nodes[key.motionId].children).toContain(key.nodeId);
    }
    expect(doc.nodes[scene.boardId].children).toEqual([scene.revealId]);
    expect(doc.nodes[scene.revealId].children).toEqual([scene.spinId]);
    const referenced = new Set([...doc.root, ...Object.values(doc.nodes).flatMap((node) => node.children)]);
    expect(referenced.size).toBe(Object.keys(doc.nodes).length);
    for (const id of referenced) expect(doc.nodes[id]).toBeDefined();
  });

  it.each([[1, 1], [7, 6], [25, 5], [96, 12]])("lays out %i skills in %i columns without phantom keys", (count, columns) => {
    const scene = createKeyboardScene(Array.from({ length: count }, (_, index) => ({ ...skills[0], name: `skill-${index}` })), columns);
    expect(() => validateDocument(scene.document)).not.toThrow();
    expect(scene.keys).toHaveLength(count);
    const slots = Object.values(scene.document.nodes).filter((node) => node.name.startsWith("Slot "));
    expect(new Set(slots.map((slot) => slot.transform.position.join(","))).size).toBe(count);
  });

  it.each([[1, 1], [24, 6], [25, 5], [96, 12]])("anchors %i keys at their geometry center, excluding all text", (count, columns) => {
    const { document: doc } = createKeyboardScene(Array.from({ length: count }, (_, index) => ({
      ...skills[0], name: `skill-${index}`, label: "A deliberately very wide heading", shortDescription: "Long description ".repeat(20),
    })), columns);
    const bytes = readFileSync(new URL("../../../public/assets/keyboard/keycaps.glb", import.meta.url));
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    const parents = new Map(Object.values(doc.nodes).flatMap((node) => node.children.map((id) => [id, node.id] as const)));
    const world = (id: string): Matrix4 => {
      const { position, rotation, scale } = doc.nodes[id].transform;
      const local = new Matrix4().compose(new Vector3(...position), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...scale));
      return parents.has(id) ? world(parents.get(id)!).multiply(local) : local;
    };
    const bounds = new Box3();
    for (const node of Object.values(doc.nodes)) {
      if (node.type !== "model" || doc.assets[node.assetId].name !== "keycaps.glb") continue;
      const mesh = gltf.meshes[gltf.nodes[Number(node.path)].mesh];
      const accessor = gltf.accessors[mesh.primitives[0].attributes.POSITION];
      bounds.union(new Box3(new Vector3(...accessor.min), new Vector3(...accessor.max)).applyMatrix4(world(node.id)));
    }
    const center = bounds.getCenter(new Vector3());
    expect(center.x).toBeCloseTo(0, 5);
    expect(center.y).toBeCloseTo(0, 5);
    expect(center.z).toBeCloseTo(0, 5);
  });

  it("attaches labels and flat cat frames to the keyboard layout", () => {
    const scene = createKeyboardScene(skills);
    const { nodes } = scene.document;
    const layout = Object.values(nodes).find((node) => node.name === "Keyboard layout")!;
    expect(layout.children).toContain(scene.labelsId);
    expect(layout.children).toContain(scene.catId);
    expect(nodes[scene.labelsId].children).toContain(scene.defaultLabelId);
    for (const key of scene.keys) {
      expect(nodes[scene.labelsId].children).toContain(key.labelId);
      const heading = nodes[nodes[key.labelId].children[0]];
      expect(heading.type === "mesh" && heading.geometry.kind).toBe("text3d");
    }
    expect(nodes[scene.catId].children).toEqual(scene.frameIds);
    expect(scene.frameIds.map((id) => nodes[id].visible)).toEqual([true, false]);
    expect(scene.frameIds.every((id) => nodes[id].type === "model")).toBe(true);
  });

  it("left-aligns headings using the actual font outlines, including narrow and wide names", () => {
    const font = new FontLoader().parse(JSON.parse(readFileSync(new URL("../../../public/fonts/helvetiker_regular.typeface.json", import.meta.url), "utf8")));
    const { document: doc } = createKeyboardScene(["Git", "Node.js", "PostgreSQL"].map((label) => ({ ...skills[0], name: label, label })));
    for (const node of Object.values(doc.nodes)) {
      if (node.type !== "mesh" || node.geometry.kind !== "text3d") continue;
      const { text, size } = node.geometry.params;
      const geometry = new TextGeometry(String(text), { font, size: Number(size), depth: 0.1, curveSegments: 12 });
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox!;
      expect(bounds.min.x + node.transform.position[0]).toBeCloseTo(0, 2);
      geometry.dispose();
    }
  });

  it("keeps both original PNGs in unlit image quads", () => {
    const asset = readFileSync(new URL("../../../public/assets/keyboard/bongo-frames.glb", import.meta.url));
    expect(asset.readUInt32LE(8)).toBe(asset.length);
    const jsonLength = asset.readUInt32LE(12);
    const gltf = JSON.parse(asset.subarray(20, 20 + jsonLength).toString());
    const binary = asset.subarray(28 + jsonLength);
    expect(gltf.nodes).toHaveLength(2);
    expect(gltf.accessors[0].count).toBe(4);
    for (let index = 0; index < 2; index++) {
      expect(gltf.materials[index].extensions.KHR_materials_unlit).toEqual({});
      const view = gltf.bufferViews[gltf.images[index].bufferView];
      const png = readFileSync(new URL(`../../../public/assets/keyboard/bongo-frame-${index + 1}.png`, import.meta.url));
      expect(binary.subarray(view.byteOffset, view.byteOffset + view.byteLength).equals(png)).toBe(true);
    }
  });

  it("rejects ambiguous or out-of-budget layouts", () => {
    expect(() => createKeyboardScene([])).toThrow(RangeError);
    expect(() => createKeyboardScene([skills[0], skills[0]])).toThrow(/unique/);
    expect(() => createKeyboardScene(skills, 0)).toThrow(RangeError);
    expect(() => createKeyboardScene(skills, 1.5)).toThrow(RangeError);
  });

  it("resolves all default artwork locally and enables cap-to-cap shadows", async () => {
    const { document: doc } = createKeyboardScene(skills);
    for (const asset of Object.values(doc.assets)) {
      const url = await resolveKeyboardAsset(asset);
      expect(url.startsWith("/assets/keyboard/") || url.startsWith("data:image/svg+xml,")).toBe(true);
      if (asset.name === "keycaps.glb") expect(url).toBe(KEYBOARD_MODEL_URL);
    }
    expect(doc.environment.shadows).toBe(true);
    expect(doc.environment.exposure).toBe(0.84);
    const logos = Object.values(doc.nodes).filter((node) => node.name.startsWith("Logo "));
    expect(logos.every((node) => node.type === "mesh" && node.receiveShadow)).toBe(true);
  });
});
