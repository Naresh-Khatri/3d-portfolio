/**
 * Utility functions for updating textures on Spline objects
 * 
 * There are multiple ways to change icons on the keyboard:
 * 
 * 1. EDIT SPLINE FILE DIRECTLY (Recommended for initial setup)
 *    - Open /assets/skills-keyboard.spline in Spline editor
 *    - Select each keycap object (named after skill, e.g., "python", "lua")
 *    - In Material panel, replace the texture with your 128x128 PNG icon
 *    - Export and save the .spline file
 * 
 * 2. PROGRAMMATIC TEXTURE UPDATE (Dynamic, requires setup)
 *    - Use the functions below to update textures at runtime
 *    - Requires image planes or texture slots in Spline file
 *    - More flexible but requires additional setup
 * 
 * 3. USE IMAGE PLANES AS CHILDREN
 *    - Add image planes as children of keycaps in Spline
 *    - Name them like "python-icon", "lua-icon", etc.
 *    - Update their texture source programmatically
 */

import { Application, SPEObject } from "@splinetool/runtime";
import { TextureLoader, Texture } from "three";

/**
 * Updates a texture on a Spline object's material
 * @param splineApp - The Spline application instance
 * @param objectName - Name of the Spline object (e.g., "python", "lua")
 * @param textureUrl - URL to the new texture image
 * @param materialIndex - Index of the material to update (default: 0)
 */
export async function updateSplineTexture(
  splineApp: Application,
  objectName: string,
  textureUrl: string,
  materialIndex: number = 0
): Promise<boolean> {
  try {
    const obj = splineApp.findObjectByName(objectName) as SPEObject;
    if (!obj) {
      console.warn(`Object "${objectName}" not found in Spline scene`);
      return false;
    }

    // Access the Three.js object
    const threeObject = obj as any;
    if (!threeObject.material) {
      console.warn(`Object "${objectName}" has no material`);
      return false;
    }

    // Handle array of materials
    const material = Array.isArray(threeObject.material)
      ? threeObject.material[materialIndex]
      : threeObject.material;

    if (!material) {
      console.warn(`Material at index ${materialIndex} not found`);
      return false;
    }

    // Load new texture
    const textureLoader = new TextureLoader();
    const newTexture = await new Promise<Texture>((resolve, reject) => {
      textureLoader.load(
        textureUrl,
        (texture) => {
          texture.flipY = false; // Spline textures are typically not flipped
          resolve(texture);
        },
        undefined,
        reject
      );
    });

    // Update material texture
    if (material.map) {
      material.map.dispose(); // Dispose old texture
    }
    material.map = newTexture;
    material.needsUpdate = true;

    return true;
  } catch (error) {
    console.error(`Failed to update texture for "${objectName}:`, error);
    return false;
  }
}

/**
 * Updates texture on an image plane child object
 * @param splineApp - The Spline application instance
 * @param parentName - Name of the parent keycap object
 * @param iconName - Name of the icon image plane (e.g., "python-icon")
 * @param textureUrl - URL to the new texture image
 */
export async function updateImagePlaneTexture(
  splineApp: Application,
  parentName: string,
  iconName: string,
  textureUrl: string
): Promise<boolean> {
  try {
    // Try to find the icon directly
    let iconObj = splineApp.findObjectByName(iconName) as SPEObject;
    
    // If not found, try to find it as a child
    if (!iconObj) {
      const parent = splineApp.findObjectByName(parentName) as SPEObject;
      if (parent) {
        const allObjects = splineApp.getAllObjects();
        iconObj = allObjects.find(
          (obj) => obj.name === iconName && obj.parent === parent
        ) as SPEObject;
      }
    }

    if (!iconObj) {
      console.warn(`Icon object "${iconName}" not found`);
      return false;
    }

    return updateSplineTexture(splineApp, iconName, textureUrl);
  } catch (error) {
    console.error(`Failed to update image plane texture:`, error);
    return false;
  }
}

/**
 * Batch update all skill icons from the SKILLS constant
 * @param splineApp - The Spline application instance
 * @param skills - Object containing skill data with icon URLs
 */
export async function updateAllSkillIcons(
  splineApp: Application,
  skills: Record<string, { name: string; icon: string }>
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const [key, skill] of Object.entries(skills)) {
    const success = await updateSplineTexture(
      splineApp,
      skill.name,
      skill.icon
    );
    if (success) {
      results.success.push(skill.name);
    } else {
      results.failed.push(skill.name);
    }
  }

  return results;
}

