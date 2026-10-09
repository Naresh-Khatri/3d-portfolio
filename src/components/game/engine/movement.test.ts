import { test } from "node:test";
import assert from "node:assert/strict";
import { MovementPrediction } from "./movement";
import { DASH_SPEED, PLAYER_R, PLAYER_SPEED, collide, type GameInput } from "../protocol";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.02, `${actual} != ${expected}`);

test("held movement survives delayed acknowledgements and dropped packets", () => {
  for (const latency of [50, 150, 400, 900]) {
    for (const dropEvery of [0, 3]) {
      const movement = new MovementPrediction();
      const position = { x: -7, z: 1.5 };
      const replies: { due: number; input: GameInput }[] = [];
      let sent = 0;
      for (let time = 0; time < 2_000; time += 10) {
        for (const reply of replies.filter((reply) => reply.due === time)) {
          movement.reconcile(position, { x: reply.input[0], z: reply.input[1] }, reply.input[4]!);
        }
        movement.advance(position, PLAYER_SPEED * 0.01, 0);
        if (time % 50 !== 0) continue;
        const input = movement.input(position, 0, false, null);
        if (dropEvery && ++sent % dropEvery === 0) continue;
        replies.push({ due: time + latency, input });
      }
      close(position.x, 7);
    }
  }
});

test("a dash is preserved when its acknowledgement arrives after later walking", () => {
  const movement = new MovementPrediction();
  const position = { x: -7, z: 1.5 };
  movement.advance(position, 0.35, 0);
  const walking = movement.input(position, 0, false, null);
  movement.advance(position, DASH_SPEED * 0.16, 0);
  const dash = movement.input(position, 0, false, null);
  movement.advance(position, 0.35, 0);
  const expected = position.x;
  movement.reconcile(position, { x: walking[0], z: walking[1] }, walking[4]!);
  close(position.x, expected);
  movement.reconcile(position, { x: dash[0], z: dash[1] }, dash[4]!);
  close(position.x, expected);
});

test("server corrections retain later movement without applying a correction twice", () => {
  const movement = new MovementPrediction();
  const position = { x: -7, z: 1.5 };
  movement.advance(position, 2, 0);
  const rejected = movement.input(position, 0, false, null);
  movement.advance(position, 0.35, 0);
  const later = movement.input(position, 0, false, null);
  movement.advance(position, 0.35, 0);

  movement.reconcile(position, { x: -6, z: 1.5 }, rejected[4]!);
  close(position.x, -5.3);
  movement.reconcile(position, { x: -5.5, z: 1.5 }, later[4]!);
  close(position.x, -5.15);
  movement.reconcile(position, { x: -6, z: 1.5 }, rejected[4]!);
  movement.reconcile(position, { x: 20, z: 1.5 }, later[4]!);
  close(position.x, -5.15);
});

test("replayed movement still collides with the arena and obstacles", () => {
  const movement = new MovementPrediction();
  const position = { x: 5, z: 5 };
  const input = movement.input(position, 0, false, null);
  movement.advance(position, 0.5, 0);
  movement.advance(position, 0.5, 0);
  const expected = { x: 4.75, z: 5.1 };
  for (let step = 0; step < 2; step++) {
    expected.x += 0.5;
    collide(expected, PLAYER_R);
  }
  movement.reconcile(position, { x: 4.75, z: 5.1 }, input[4]!);
  close(position.x, expected.x);
  close(position.z, expected.z);
  movement.advance(position, 100, 0);
  assert.ok(position.x <= 22 - PLAYER_R);
});

test("reset discards movement from a previous round or connection", () => {
  const movement = new MovementPrediction();
  const position = { x: -7, z: 1.5 };
  movement.advance(position, 1, 0);
  const old = movement.input(position, 0, false, "old-run");
  movement.reset();
  position.x = 2;
  movement.advance(position, 0.35, 0);
  const next = movement.input(position, 0, false, "new-run");
  movement.reconcile(position, { x: old[0], z: old[1] }, old[4]!);
  close(position.x, 2.35);
  assert.ok(next[4]! > old[4]!);
  assert.equal(next[5], "new-run");
});

test("long interruptions expire old history while recent acknowledgements still work", () => {
  const movement = new MovementPrediction();
  const position = { x: -7, z: 1.5 };
  const old = movement.input(position, 0, false, null);
  for (let index = 0; index < 300; index++) {
    movement.advance(position, 0.001, 0);
    movement.input(position, 0, false, null);
  }
  const recent = movement.input(position, 0, false, null);
  for (let index = 0; index < 2_100; index++) movement.advance(position, 0.001, 0);
  movement.reconcile(position, { x: old[0], z: old[1] }, old[4]!);
  const current = movement.input(position, 0, false, null);
  movement.advance(position, 0.35, 0);
  movement.reconcile(position, { x: current[0], z: current[1] }, current[4]!);
  close(position.x, current[0] + 0.35);
  assert.ok(current[4]! > recent[4]!);
});
