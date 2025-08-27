import { randomInt } from 'crypto'
import type { Maze, Position, Vector, Direction } from './types'
import { BOXES_PER_SPACES_RATIO, DIRECTION_DOWN, DIRECTION_LEFT, DIRECTION_RIGHT, DIRECTION_UP, ELEMENT_BOX, ELEMENT_PLAYER, MOVEMENTS_BATCH_MAX, MOVEMENTS_BATCH_MAX_COUNT, MOVEMENTS_BATCH_MIN, TILE_FLOOR, TILE_GOAL } from './const'
import { getDirection, getElement, getNextPositionInDirection, getTile, isValidWalkablePosition, isWalkableTile } from './helpers'


const getRandomDirection = (): Direction => {
  const direction = randomInt(0, 4)
  switch (direction) {
    case 0: // UP
      return DIRECTION_UP
    case 1: // DOWN
      return DIRECTION_DOWN
    case 2: // LEFT
      return DIRECTION_LEFT
    case 3: // RIGHT
      return DIRECTION_RIGHT
    default:
      return { x: 0, y: 0 }
  }
}

const getFreeAdjacentPosition = (
  maze: Maze,
  pos: Position,
): Position => {
  while(true) {
    const direction = getRandomDirection()
    const target = getNextPositionInDirection(pos, direction)
    if(!isValidWalkablePosition(maze, target, true)) {
      continue
    }
    return target
  }
}

const addElements = (maze: Maze): [Vector, Position[]] => {
  const height = maze.length
  const width = maze[0].length
  const availableSpaces = maze.reduce((cc, row) => {
    return cc + row.reduce((rc, tile) => {
      return rc + (isWalkableTile(tile) ? 1: 0)
    }, 0)
  }, 0)
  let boxCount = 1 + Math.floor(availableSpaces * BOXES_PER_SPACES_RATIO)
  console.log('==> Adding', boxCount, 'boxes')

  const boxes: Position[] = new Array(boxCount).fill({ x: 0, y: 0})
  while(boxCount > 0) {
    const y = randomInt(0, height)
    const x = randomInt(0, width)
    if(!isWalkableTile(maze[y][x])) {
      continue
    }

    // start position will be the solved puzzle
    maze[y][x] = TILE_GOAL + ELEMENT_BOX
    boxes[boxCount -1] = { x, y } 
    boxCount--
  }

  // start position will be the solved puzzle
  const finalBoxIndex = randomInt(0, boxes.length)
  const finalBox = boxes[finalBoxIndex]
  const playerPos = getFreeAdjacentPosition(maze, finalBox)
  const playerDir = getDirection(playerPos, finalBox)
  const {x, y} = playerPos
  maze[y][x] = ELEMENT_PLAYER + TILE_FLOOR

  return [ [playerPos, playerDir], boxes]
}

const swapElement = (
  maze: Maze,
  p0: Position,
  p1: Position
) => {
  const tempElement = getElement(maze[p0.y][p0.x])
  maze[p0.y][p0.x] = getElement(maze[p1.y][p1.x]) + getTile(maze[p0.y][p0.x])
  maze[p1.y][p1.x] = tempElement + getTile(maze[p1.y][p1.x])
}

const hasBox = (maze: Maze, pos: Position): boolean =>
  isValidWalkablePosition(maze, pos) &&
  getElement(maze[pos.y][pos.x]) === ELEMENT_BOX

const playerCanWalk = (
  maze: Maze,
  player: Vector,
): boolean => {
  const [position] = player
  return isValidWalkablePosition(maze, getNextPositionInDirection(position, DIRECTION_UP), true) || // UP
    isValidWalkablePosition(maze, getNextPositionInDirection(position, DIRECTION_DOWN), true) || // DOWN
    isValidWalkablePosition(maze, getNextPositionInDirection(position, DIRECTION_LEFT), true) || // LEFt
    isValidWalkablePosition(maze, getNextPositionInDirection(position, DIRECTION_RIGHT), true) // RIGHT
}

const reverseMovement = (
  maze: Maze,
  player: Vector,
): Vector => {
  const [position] = player
  const prevPosition = getFreeAdjacentPosition(maze, position)
  const prevDirection = getDirection(prevPosition, position)
  const prevPlayer: Vector = [prevPosition, prevDirection]
  // move player
  swapElement(maze, position, prevPosition)
  // move box if should drag
  const possibleBoxPosition = getNextPositionInDirection(position, prevDirection)
  const isBox = hasBox(maze, possibleBoxPosition)
  if(isBox) {
      // move box
      swapElement(maze, possibleBoxPosition, position)
      if(!playerCanWalk(maze, prevPlayer)) {
        // move box back
        swapElement(maze, position, possibleBoxPosition)
      }
  }
  return prevPlayer
}

const shuffle = (
  maze: Maze,
  player: Vector,
  goals: Position[],
) => {
  let prevPlayer = player
  // retry if not all boxes have been moved
  let count = MOVEMENTS_BATCH_MAX_COUNT
  let allBoxesMoved = false
  while(count-- && !allBoxesMoved) {
    // backwards N random movements
    let movementsLeft = randomInt(MOVEMENTS_BATCH_MIN, MOVEMENTS_BATCH_MAX)
    while(movementsLeft--) {
      // printMaze(maze)
      prevPlayer = reverseMovement(maze, prevPlayer)
    }
    // retry if not all boxes have been moved
    allBoxesMoved = goals.every(pos => !hasBox(maze, pos))
  }
}

const fillMaze = (maze: Maze) => {
  const [player, boxes] = addElements(maze)

  shuffle(maze, player, boxes)
}

export default fillMaze