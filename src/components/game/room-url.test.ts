import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readRoomCode, roomUrl } from "./room-url";

test("room links preserve the current path, other query parameters, and hash", () => {
  const url = roomUrl("https://example.com/projects?ref=friend&game=oldcode#about", "abc12345");
  assert.equal(url.href, "https://example.com/projects?ref=friend&room=abc12345#about");
  assert.equal(readRoomCode(url.href), "abc12345");
});

test("reads canonical and existing invite links and normalizes codes", () => {
  assert.equal(readRoomCode("https://example.com/?room=ABC123"), "abc123");
  assert.equal(readRoomCode("https://example.com/?game=ABC123"), "abc123");
  assert.equal(readRoomCode("https://example.com/?room=first&game=second"), "first");
  assert.equal(readRoomCode("https://example.com/?ref=friend"), null);
  assert.equal(readRoomCode("https://example.com/?room="), "");
});

test("leaving clears both invite parameters without losing the rest of the URL", () => {
  assert.equal(roomUrl("https://example.com/work?room=abc123&ref=friend&game=oldcode#projects", null).href, "https://example.com/work?ref=friend#projects");
});
