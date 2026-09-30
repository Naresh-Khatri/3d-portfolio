export async function loadSplineScene(
  scene: string,
  signal: AbortSignal,
  start: (data: ArrayBuffer) => Promise<void>,
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      signal.throwIfAborted();
      const response = await fetch(scene, {
        signal,
        cache: attempt === 0 ? "default" : "reload",
      });
      if (!response.ok) {
        throw new Error(`Spline scene request failed: HTTP ${response.status}`);
      }
      if (response.headers.get("content-type")?.includes("text/html")) {
        throw new Error("Spline scene request returned HTML instead of scene data");
      }
      const data = await response.arrayBuffer();
      if (data.byteLength === 0) throw new Error("Spline scene response was empty");
      signal.throwIfAborted();
      await start(data);
      signal.throwIfAborted();
      return;
    } catch (error) {
      if (signal.aborted || attempt === 1) throw error;
    }
  }
}
