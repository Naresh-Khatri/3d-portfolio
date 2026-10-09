import { PLAYER_R, collide, type GameInput } from "../protocol";

type Position = { x: number; z: number };
type Step = { dx: number; dz: number };
type PendingInput = Position & { sequence: number; end: number };

const MAX_PENDING_INPUTS = 200;
const MAX_STEPS = 2_048;
// Input and snapshot coordinates are rounded to hundredths of a world unit.
const POSITION_TOLERANCE = 0.02;
const r2 = (value: number) => Math.round(value * 100) / 100;

function move(position: Position, { dx, dz }: Step): Step {
  const { x, z } = position;
  position.x += dx;
  position.z += dz;
  collide(position, PLAYER_R);
  return { dx: position.x - x, dz: position.z - z };
}

export class MovementPrediction {
  private sequence = 0;
  private acknowledged = 0;
  private steps: Step[] = [];
  private pending: PendingInput[] = [];

  reset() {
    this.acknowledged = this.sequence;
    this.steps = [];
    this.pending = [];
  }

  advance(position: Position, dx: number, dz: number) {
    const step = move(position, { dx, dz });
    if (step.dx === 0 && step.dz === 0) return;
    // Replaying attempted movement would reapply pushes already blocked by a collision.
    this.steps.push(step);
    if (this.steps.length > MAX_STEPS) this.discardSteps(this.steps.length - MAX_STEPS);
  }

  input(position: Position, aim: number, firing: boolean, runId: string | null): GameInput {
    const sequence = ++this.sequence;
    this.pending.push({ sequence, end: this.steps.length, x: position.x, z: position.z });
    if (this.pending.length > MAX_PENDING_INPUTS) {
      const expired = this.pending.shift()!;
      this.discardSteps(expired.end);
    }
    return [r2(position.x), r2(position.z), r2(aim), firing ? 1 : 0, sequence, runId];
  }

  reconcile(position: Position, server: Position, sequence: number) {
    if (!Number.isSafeInteger(sequence) || sequence <= this.acknowledged) return;
    const index = this.pending.findIndex((input) => input.sequence === sequence);
    if (index < 0) return;

    const input = this.pending[index];
    const error = Math.hypot(server.x - input.x, server.z - input.z);
    this.pending.splice(0, index + 1);
    this.discardSteps(input.end);
    this.acknowledged = sequence;
    if (error <= POSITION_TOLERANCE) return;

    // Snapshots describe an acknowledged input, not the client's current frame.
    position.x = server.x;
    position.z = server.z;
    let pendingIndex = 0;
    for (let index = 0; index <= this.steps.length; index++) {
      while (pendingIndex < this.pending.length && this.pending[pendingIndex].end === index) {
        const pending = this.pending[pendingIndex++];
        pending.x = position.x;
        pending.z = position.z;
      }
      if (index < this.steps.length) this.steps[index] = move(position, this.steps[index]);
    }
  }

  private discardSteps(count: number) {
    this.steps.splice(0, count);
    this.pending = this.pending
      .filter((input) => input.end >= count)
      .map((input) => ({ ...input, end: input.end - count }));
  }
}
