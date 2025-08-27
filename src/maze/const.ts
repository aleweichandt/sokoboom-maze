import templates from "./templates"
import type { Direction } from "./types"

export const TEMPLATES_SIZE = templates.length
export const TEMPLATE_SIZE = templates[0].length
export const TEMPLATE_FILL_SIZE = templates[0].length - 2 // remove borders

export const MIN_TILES = 2 // inclusive
export const MAX_TILES = 5 // exclusive

export const BOXES_PER_SPACES_RATIO = 1/20
export const MOVEMENTS_BATCH_MIN = 200
export const MOVEMENTS_BATCH_MAX = 500
export const MOVEMENTS_BATCH_MAX_COUNT = 500

export const DIRECTION_UP: Direction = { x: 0, y: -1 }
export const DIRECTION_DOWN : Direction= { x: 0, y: 1 }
export const DIRECTION_LEFT: Direction = { x: -1, y: 0 }
export const DIRECTION_RIGHT: Direction = { x: 1, y: 0 }


export const TILE_BIT_MASK = 0x0F;
export const ELEMENT_BIT_MASK = 0xF0;

export const TILE_VOID = 0x00
export const TILE_WALL = 0x01
export const TILE_FLOOR = 0x02
export const TILE_GOAL = 0x03

export const ELEMENT_VOID = 0x00
export const ELEMENT_PLAYER = 0x10
export const ELEMENT_BOX = 0x20
