import { randomInt } from 'crypto'
import templates, { voidTemplate } from './templates'
import rotateTemplate from './rotateTemplate'
import type { Maze, Template } from './types'
import { MAX_TILES, MIN_TILES, TEMPLATE_FILL_SIZE, TEMPLATE_SIZE, TEMPLATES_SIZE, TILE_VOID, TILE_WALL } from './const'
import { isWalkableTile } from './helpers'

const areTilesCompatible = (
  ref: number,
  other: number,
): boolean =>
   !isWalkableTile(ref) || isWalkableTile(other)

const canVoid = (
  x: number, 
  y: number,
  maze: Maze,
  width: number,
  height: number
): boolean => {
  if(isWalkableTile(maze[y][x])) {
    return false
  }

  const minX = Math.max(x-1, 0)
  const maxX = Math.min(x+1, width-1)
  const minY = Math.max(y-1, 0)
  const maxY = Math.min(y+1, height-1)

  for(let j = minY; j <= maxY; j++) {
    for(let i = minX; i <= maxX; i++) {
      if(isWalkableTile(maze[j][i])) {
        return false
      }
    }
  }
  return true
}

const removeExtraWalls = (
  maze: Maze,
): void => {
  const height = maze.length
  const width = maze[0].length
  for(let y=0; y<height ; y++) {
    for(let x=0; x<width ; x++) {
      if(canVoid(x, y, maze, width, height)) {
        maze[y][x] = TILE_VOID
      }
    }
  }
}

const reduceMaze = (maze: Maze): Maze => {
  removeExtraWalls(maze)

  const yFlags = maze.map(row => row.every(tile => tile === TILE_VOID))
  const XFlags = new Array(maze[0].length).fill(null).map((_, x) => {
    for(let y=0; y<maze.length; y++) {
      if(maze[y][x] !== TILE_VOID) {
        return false
      }
    }
    return true;
  })

  const firstY = yFlags.findIndex(v => !v)
  const height = yFlags.filter(v => !v).length
  const firstX = XFlags.findIndex(v => !v)
  const width = XFlags.filter(v => !v).length

  const reducedMaze: Maze = new Array(height).fill(null).map(() => new Array(width).fill(TILE_VOID))
  for(let y=0; y<height; y++) {
    for(let x=0; x<width; x++) {
      reducedMaze[y][x] = maze[y+firstY][x+firstX]
    }
  }
  return reducedMaze
}

const areTemplatesVerticallyAligned = (
  top: Template,
  bottom: Template
): boolean => {
  for(let i=0; i<TEMPLATE_SIZE; i++) {
    if(
      !areTilesCompatible(bottom[0][i], top[TEMPLATE_SIZE-2][i]) ||
      !areTilesCompatible(top[TEMPLATE_SIZE-1][i], bottom[1][i])
     ) {
      return false
     }
  }
  return true
}

const areTemplatesHorizontallyAligned = (
  left: Template,
  right: Template
): boolean => {
  for(let i=0; i<TEMPLATE_SIZE; i++) {
    if(
      !areTilesCompatible(right[i][0], left[i][TEMPLATE_SIZE-2]) ||
      !areTilesCompatible(left[i][TEMPLATE_SIZE-1], right[i][1])
     ) {
      return false
     }
  }
  return true
}

const findTemplate = (
  isBottomEdge: boolean,
  isRightEdge: boolean,
  topTemplate: Template = voidTemplate,
  leftTemplate: Template = voidTemplate,
): Template => {
  let found:Template | undefined
  while(!found) {
    const templateId = randomInt(0, TEMPLATES_SIZE)
    const template = JSON.parse(JSON.stringify(templates[templateId]))
    const rotations = randomInt(0, 4)
    rotateTemplate(template, rotations)
    if(
      areTemplatesVerticallyAligned(topTemplate, template) &&
      areTemplatesHorizontallyAligned(leftTemplate, template) &&
      (!isBottomEdge || areTemplatesVerticallyAligned(template, voidTemplate)) &&
      (!isRightEdge || areTemplatesHorizontallyAligned(template, voidTemplate))
    ) {
      found = template
    }
  } 
  return found
}

const createMazeFromTemplates = (
  width: number,
  height: number,
  mazeTemplates: Template[][],
): Maze => {
  const maze = new Array(2 + (TEMPLATE_FILL_SIZE * height)).fill(null).map(() => new Array(2 + (TEMPLATE_SIZE * width)).fill(TILE_WALL))
  for(let y = 0; y<height ; y++) {
    for(let x = 0; x<width ; x++) {
      const template = mazeTemplates[y][x]
      for(let ty = 0; ty<TEMPLATE_FILL_SIZE; ty++) {
        for(let tx = 0; tx<TEMPLATE_FILL_SIZE; tx++) {
          const mazeY = 1 + (TEMPLATE_FILL_SIZE * y) + ty
          const mazeX = 1 + (TEMPLATE_FILL_SIZE * x) + tx
          maze[mazeY][mazeX] = template[1 + ty][1 + tx]
        }
      }
    }
  }

  return maze
}

const buildMaze = (): Maze => {
  const width = randomInt(MIN_TILES, MAX_TILES)
  const height = randomInt(MIN_TILES, MAX_TILES)
  const mazeTemplates = new Array(height).fill(null).map(() => new Array(width).fill(null))

  for(let y = 0; y<height ; y++) {
    for(let x = 0; x<width ; x++) {
      // find template
      const template = findTemplate(
        y === height - 1,
        x === width - 1,
        y > 0 ? mazeTemplates[y-1][x] : undefined,
        x > 0 ? mazeTemplates[y][x-1] : undefined
      )
      mazeTemplates[y][x] = template
    }
  }

  const maze = createMazeFromTemplates(width, height, mazeTemplates)

  return reduceMaze(maze)
}

export default buildMaze
