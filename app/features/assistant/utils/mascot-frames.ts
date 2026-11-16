import type { LiveRun } from './run-state';

type Pixel = [x: number, y: number, width?: number, height?: number];
type MascotState = LiveRun['state'];

export const MASCOT_BODY = 'M11 1h2v5h4v2h3v2h2v9h-2v2H4v-2H2v-9h2V8h3V6h4z';
export const MASCOT_SCREEN = 'M7 10h10v1h2v6h-2v1H7v-1H5v-6h2z';

const rest: Pixel[] = [
  [8, 13, 2, 2],
  [14, 13, 2, 2],
];
const blink: Pixel[] = [
  [8, 14, 2],
  [14, 14, 2],
];
const dot = (x: number): Pixel => [x, 14];
const cursor = (x: number): Pixel => [x, 12, 1, 4];

export const MASCOT_FRAMES: Record<MascotState | 'asleep', Pixel[][]> = {
  idle: [rest, blink],
  queued: [[dot(9)], [dot(9), dot(12)], [dot(9), dot(12), dot(15)]],
  thinking: [[dot(9)], [dot(9), dot(12)], [dot(9), dot(12), dot(15)]],
  reading: [
    [
      [7, 13, 2, 2],
      [13, 13, 2, 2],
    ],
    [
      [9, 13, 2, 2],
      [15, 13, 2, 2],
    ],
  ],
  writing: [
    [dot(8), cursor(10)],
    [dot(8), dot(10), cursor(12)],
    [dot(8), dot(10), dot(12), cursor(14)],
    [dot(8), dot(10), dot(12)],
  ],
  proposing: [
    [
      [8, 13, 2, 2],
      [14, 13],
      [15, 14],
      [14, 15],
    ],
    [
      [8, 13, 2, 2],
      [15, 13],
      [16, 14],
      [15, 15],
    ],
  ],
  done: [
    [
      [8, 14],
      [9, 13],
      [10, 14],
      [13, 14],
      [14, 13],
      [15, 14],
    ],
  ],
  question: [
    [
      [10, 12, 4],
      [13, 13],
      [12, 14],
      [12, 16],
    ],
  ],
  error: [
    [
      [7, 12],
      [8, 13],
      [9, 14],
      [14, 14],
      [15, 13],
      [16, 12],
      [11, 16, 2],
    ],
  ],
  cancelled: [rest],
  asleep: [blink],
};

export const MASCOT_INTERVAL: Partial<Record<MascotState, number>> = {
  idle: 5600,
  queued: 166,
  thinking: 166,
  reading: 250,
  writing: 125,
  proposing: 300,
  done: 600,
};
