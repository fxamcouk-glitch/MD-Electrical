import { describe, expect, it } from 'vitest';
import { getMarkers, initialState, reducer } from './reducer';
import type { Marker } from './types';

const marker = (id: string, x = 10, y = 10): Marker => ({ id, type: 'socket-single', x, y, rotation: 0, label: '' });

describe('markup reducer', () => {
  it('adds markers per page and supports undo/redo', () => {
    let s = initialState();
    s = reducer(s, { type: 'add', page: 1, marker: marker('a') });
    s = reducer(s, { type: 'add', page: 2, marker: marker('b') });
    expect(getMarkers(s.data, 1)).toHaveLength(1);
    expect(getMarkers(s.data, 2)).toHaveLength(1);
    s = reducer(s, { type: 'undo' });
    expect(getMarkers(s.data, 2)).toHaveLength(0);
    s = reducer(s, { type: 'redo' });
    expect(getMarkers(s.data, 2)).toHaveLength(1);
  });

  it('treats a drag (same key) as one undo step', () => {
    let s = initialState();
    s = reducer(s, { type: 'add', page: 1, marker: marker('a', 0, 0) });
    for (let i = 0; i < 5; i++) s = reducer(s, { type: 'moveBy', page: 1, ids: ['a'], dx: 2, dy: 1, key: 'd1' });
    expect(getMarkers(s.data, 1)[0]).toMatchObject({ x: 10, y: 5 });
    s = reducer(s, { type: 'undo' });
    expect(getMarkers(s.data, 1)[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('starts a new undo step for a new drag key', () => {
    let s = initialState();
    s = reducer(s, { type: 'add', page: 1, marker: marker('a', 0, 0) });
    s = reducer(s, { type: 'moveBy', page: 1, ids: ['a'], dx: 5, dy: 0, key: 'd1' });
    s = reducer(s, { type: 'moveBy', page: 1, ids: ['a'], dx: 5, dy: 0, key: 'd2' });
    s = reducer(s, { type: 'undo' });
    expect(getMarkers(s.data, 1)[0].x).toBe(5);
  });

  it('normalises rotation and removes selected markers', () => {
    let s = initialState();
    s = reducer(s, { type: 'add', page: 1, marker: marker('a') });
    s = reducer(s, { type: 'add', page: 1, marker: marker('b') });
    s = reducer(s, { type: 'rotateBy', page: 1, ids: ['a'], degrees: -90 });
    expect(getMarkers(s.data, 1)[0].rotation).toBe(270);
    s = reducer(s, { type: 'remove', page: 1, ids: ['a'] });
    expect(getMarkers(s.data, 1).map((m) => m.id)).toEqual(['b']);
  });

  it('duplicates with an offset and clamps symbol scale', () => {
    let s = initialState();
    s = reducer(s, { type: 'add', page: 1, marker: marker('a', 10, 10) });
    s = reducer(s, { type: 'duplicate', page: 1, ids: ['a'], newIds: ['c'], offset: 12 });
    expect(getMarkers(s.data, 1)[1]).toMatchObject({ id: 'c', x: 22, y: 22 });
    s = reducer(s, { type: 'setSymbolScale', page: 1, scale: 99 });
    expect(s.data.pages[1].symbolScale).toBe(4);
  });
});
