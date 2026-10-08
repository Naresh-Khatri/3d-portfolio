const STICK_RADIUS = 56;
const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

// keyboard + mouse on desktop, one-thumb stick on touch (game auto-aims there)
export class Input {
  suspended = false;
  mouseX = 0; // ndc
  mouseY = 0;
  firing = false;
  touch = false;

  private keys = new Set<string>();
  private dash = false;
  private fireLatch = false;
  private stickId = -1;
  private stickOrigin = { x: 0, y: 0 };
  private stick = { x: 0, z: 0 };
  private out = { x: 0, z: 0 };

  constructor(
    private el: HTMLElement,
    private actions: { exit: () => void; start: () => void }
  ) {
    // capture + stop so site shortcuts (nyan cat, chat, radial menu) stay quiet
    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    window.addEventListener("blur", this.reset);
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);
    el.addEventListener("mousedown", this.stop);
    el.addEventListener("contextmenu", this.stop);
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("keyup", this.onKeyUp, true);
    window.removeEventListener("blur", this.reset);
    this.el.removeEventListener("pointerdown", this.onPointerDown);
    this.el.removeEventListener("pointermove", this.onPointerMove);
    this.el.removeEventListener("pointerup", this.onPointerUp);
    this.el.removeEventListener("pointercancel", this.onPointerUp);
    this.el.removeEventListener("mousedown", this.stop);
    this.el.removeEventListener("contextmenu", this.stop);
  }

  // normalized, screen-up = -z
  move() {
    let x = this.stick.x;
    let z = this.stick.z;
    for (const code of this.keys) {
      const dir = MOVE_KEYS[code];
      if (!dir) continue;
      x += dir[0];
      z += dir[1];
    }
    const len = Math.hypot(x, z);
    this.out.x = len > 1 ? x / len : x;
    this.out.z = len > 1 ? z / len : z;
    return this.out;
  }

  suspend(value: boolean) {
    this.suspended = value;
    this.reset();
    this.dash = false;
    this.fireLatch = false;
  }

  queueDash() {
    this.dash = true;
  }

  takeDash() {
    const d = this.dash;
    this.dash = false;
    return d;
  }

  // true if fire was pressed since last call -> quick taps survive the 20hz send
  takeFireLatch() {
    const f = this.fireLatch;
    this.fireLatch = false;
    return f;
  }

  private stop = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  private reset = () => {
    this.keys.clear();
    this.firing = false;
    this.stickId = -1;
    this.stick.x = this.stick.z = 0;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.suspended) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.code === "Enter" || e.code === "Space") && e.target instanceof Element && e.target.closest("button, a, input, select, textarea")) return;
    e.stopPropagation();
    if (e.code === "Escape") return this.actions.exit();
    if (e.code === "Enter" && !e.repeat) return this.actions.start();
    if (e.code === "Space" || e.code === "ShiftLeft") {
      e.preventDefault();
      if (!e.repeat) this.dash = true;
      return;
    }
    if (MOVE_KEYS[e.code]) {
      e.preventDefault();
      this.keys.add(e.code);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      this.touch = true;
      if (this.stickId !== -1) return;
      this.stickId = e.pointerId;
      this.stickOrigin.x = e.clientX;
      this.stickOrigin.y = e.clientY;
      return;
    }
    this.touch = false;
    this.aim(e);
    if (e.button === 2) this.dash = true;
    else if (e.button === 0) {
      this.firing = true;
      this.fireLatch = true;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      if (e.pointerId !== this.stickId) return;
      const dx = (e.clientX - this.stickOrigin.x) / STICK_RADIUS;
      const dy = (e.clientY - this.stickOrigin.y) / STICK_RADIUS;
      const len = Math.max(1, Math.hypot(dx, dy));
      this.stick.x = dx / len;
      this.stick.z = dy / len;
      return;
    }
    this.aim(e);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      if (e.pointerId !== this.stickId) return;
      this.stickId = -1;
      this.stick.x = this.stick.z = 0;
      return;
    }
    if (e.button === 0) this.firing = false;
  };

  private aim(e: PointerEvent) {
    const rect = this.el.getBoundingClientRect();
    this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
