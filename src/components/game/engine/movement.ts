import { PLAYER_R, collide, type GameInput } from "../protocol";

type Position = { x: number; z: number };
type Step = { dx: number; dz: number };
type PendingInput = { sequence: number; end: number };

const MAX_PENDING_INPUTS = 200;
const MAX_STEPS = 2_048;
const r2 = (value: number) => Math.round(value * 100) / 100;

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
    position.x += dx;
    position.z += dz;
    collide(position, PLAYER_R);
    if (dx === 0 && dz === 0) return;
    this.steps.push({ dx, dz });
    if (this.steps.length > MAX_STEPS) this.discardSteps(this.steps.length - MAX_STEPS);
  }

  input(position: Position, aim: number, firing: boolean, runId: string | null): GameInput {
    const sequence = ++this.sequence;
    this.pending.push({ sequence, end: this.steps.length });
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

    const end = this.pending[index].end;
    this.pending.splice(0, index + 1);
    this.discardSteps(end);
    this.acknowledged = sequence;

    // Snapshots describe an acknowledged input, not the client's current frame.
    position.x = server.x;
    position.z = server.z;
    for (const { dx, dz } of this.steps) {
      position.x += dx;
      position.z += dz;
      collide(position, PLAYER_R);
    }
  }

  private discardSteps(count: number) {
    this.steps.splice(0, count);
    this.pending = this.pending
      .filter((input) => input.end >= count)
      .map((input) => ({ sequence: input.sequence, end: input.end - count }));
  }
}
