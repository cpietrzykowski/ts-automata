/**
 * https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life#Examples_of_patterns
 *
 * all patterns are assumed to be surrounded by `false` cells
 */
export const examples = {
  stillLifes: {
    block: [
      [
        [true, true],
        [true, true],
      ],
    ],
    beeHive: [
      [
        [false, true, true, false],
        [true, false, false, true],
        [false, true, true, false],
      ],
    ],
    loaf: [
      [
        [false, true, true, false],
        [true, false, false, true],
        [false, true, false, true],
        [false, false, true, false],
      ],
    ],
    boat: [
      [
        [true, true, false],
        [true, false, true],
        [false, true, false],
      ],
    ],
    tub: [
      [
        [false, true, false],
        [true, false, true],
        [false, true, false],
      ],
    ],
  },
  oscillator: {
    blinker: [
      [
        [false, true, false],
        [false, true, false],
        [false, true, false],
      ],
      [
        [false, false, false],
        [true, true, true],
        [false, false, false],
      ],
    ],
  },
  spaceships: {
    /**
     * a 4 period pattern that migrates (1, -1)
     */
    glider: [
      [
        [false, false, true, false],
        [true, false, true, false],
        [false, true, true, false],
        [false, false, false, false],
      ],
      [
        [false, true, false, false],
        [false, false, true, true],
        [false, true, true, false],
        [false, false, false, false],
      ],
      [
        [false, false, true, false],
        [false, false, false, true],
        [false, true, true, true],
        [false, false, false, false],
      ],
      [
        [false, false, false, false],
        [false, true, false, true],
        [false, false, true, true],
        [false, false, true, false],
      ],
    ],
  },
};
