import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTargetDimensions, formatFileSize } from './imageCompression.ts';

test('calculateTargetDimensions scales down landscape images maintaining aspect ratio', () => {
  const result = calculateTargetDimensions(3200, 1600, 1600);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 800);
});

test('calculateTargetDimensions scales down portrait screenshots maintaining aspect ratio', () => {
  const result = calculateTargetDimensions(1080, 2400, 1600);
  assert.equal(result.height, 1600);
  assert.equal(result.width, 720);
});

test('calculateTargetDimensions leaves images smaller than maxDimension untouched', () => {
  const result = calculateTargetDimensions(800, 600, 1600);
  assert.equal(result.width, 800);
  assert.equal(result.height, 600);
});

test('calculateTargetDimensions handles invalid or zero dimensions defensively', () => {
  const result = calculateTargetDimensions(0, 0, 1600);
  assert.equal(result.width, 1600);
  assert.equal(result.height, 1600);
});

test('formatFileSize formats bytes, kilobytes and megabytes accurately in Arabic', () => {
  assert.equal(formatFileSize(0), '0 ك.ب');
  assert.equal(formatFileSize(512 * 1024), '512 ك.ب');
  assert.equal(formatFileSize(3.5 * 1024 * 1024), '3.5 م.ب');
});
