import assert from "node:assert/strict";
import { it } from "vitest";
import { dataState } from "../shared/iot";
import { createDeviceSchema } from "../shared/schemas/iot";

it("freshness and connection have independent one- and three-minute boundaries", () => {
  const now = Date.now();
  assert.deepEqual(dataState(new Date(now - 60_000), now), { status: "online", stale: false });
  assert.deepEqual(dataState(new Date(now - 60_001), now), { status: "online", stale: true });
  assert.deepEqual(dataState(new Date(now - 180_000), now), { status: "online", stale: true });
  assert.deepEqual(dataState(new Date(now - 180_001), now), { status: "offline", stale: true });
  assert.deepEqual(dataState(null, now), { status: "offline", stale: true });
});

it("device configuration accepts zero and negative thresholds and optional initial readings", () => {
  const input = { name: "Freezer", namaNilai: "Suhu", satuanNilai: "C", threshold: 0 };
  assert.equal(createDeviceSchema.parse(input).nilai, undefined);
  assert.equal(createDeviceSchema.parse({ ...input, nilai: 0 }).nilai, 0);
  assert.equal(createDeviceSchema.parse({ ...input, threshold: -20 }).threshold, -20);
  for (const invalid of [NaN, Infinity, 100_000_000, 1.001]) {
    assert.equal(createDeviceSchema.safeParse({ ...input, threshold: invalid }).success, false);
    assert.equal(createDeviceSchema.safeParse({ ...input, nilai: invalid }).success, false);
  }
});
