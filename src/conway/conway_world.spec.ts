import test from 'ava';
import {
  ConwaysWorld,
  ConwaysWrappedWorld,
  IConwaysWorld,
  cellNeighbors,
  evolveWorld,
} from './conway_world';
import {examples} from './conway_patterns';

test('cell neighbors (fixed world)', (t) => {
  const w: IConwaysWorld = new ConwaysWorld();
  w.setSize({
    width: 10,
    height: 10,
  });

  w.setCell({x: 0, y: 0}, true);

  t.deepEqual(w.neighbors({x: 0, y: 0}), [false, false, false]);

  t.deepEqual(w.neighbors({x: 9, y: 9}), [false, false, false]);

  t.deepEqual(w.neighbors({x: 4, y: 4}), [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
});

test('cell neighbors (wrapped world)', (t) => {
  const w: IConwaysWorld = new ConwaysWrappedWorld();
  w.setSize({
    width: 10,
    height: 10,
  });

  w.setCell({x: 0, y: 0}, true);

  t.deepEqual(w.neighbors({x: 0, y: 0}), [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);

  t.deepEqual(w.neighbors({x: 9, y: 9}), [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    true,
  ]);

  t.deepEqual(w.neighbors({x: 4, y: 4}), [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
});

test('neighbor algorithm', (t) => {
  t.deepEqual(cellNeighbors(0, 0, 3, 3), [
    [1, 0],
    [0, 1],
    [1, 1],
  ]);

  t.deepEqual(cellNeighbors(1, 1, 3, 3), [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ]);

  t.deepEqual(cellNeighbors(2, 2, 3, 3), [
    [1, 1],
    [2, 1],
    [1, 2],
  ]);
});

test('conway patterns (still lifes: block)', (t) => {
  const pattern = examples['stillLifes']['block'];
  const w = ConwaysWorld.fromPattern(pattern[0]);
  t.deepEqual(w, pattern[0].flat());

  // this still life is static
  t.deepEqual(
    evolveWorld(w, {
      height: pattern[0].length,
      width: pattern[0][0].length,
    }),
    pattern[0].flat(),
  );
});

test('conway patterns (oscillator: blinker)', (t) => {
  const pattern = examples['oscillator']['blinker'];
  const w = ConwaysWorld.fromPattern(pattern[0]);
  t.deepEqual(w, pattern[0].flat());
  const step1 = evolveWorld(w, {
    height: pattern[0].length,
    width: pattern[0][0].length,
  });

  t.deepEqual(step1, pattern[1].flat());

  const step2 = evolveWorld(step1, {
    height: pattern[0].length,
    width: pattern[0][0].length,
  });
  t.deepEqual(step2, pattern[0].flat());
});

// test("conway patterns (spaceships: glider)", (t) => {
//   const pattern = examples["spaceships"]["glider"];
//   const w = ConwaysWorld.fromPattern(pattern[0], {
//     width: pattern[0][0].length + 1,
//     height: pattern[0].length + 1,
//   });
//   t.deepEqual(w.state(), [
//     ...pattern[0].map(function (r) {
//       return [...r, false];
//     }),
//     [false, false, false, false, false],
//   ]);

//   w.evolve();
//   t.deepEqual(w.state(), [
//     ...pattern[1].map(function (r) {
//       return [...r, false];
//     }),
//     [false, false, false, false, false],
//   ]);
// });
