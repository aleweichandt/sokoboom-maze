import { ELEMENT_BIT_MASK, ELEMENT_VOID, TILE_BIT_MASK, TILE_FLOOR, TILE_GOAL } from "./const";
import { Direction, Maze, Position } from "./types";

export const isWalkableTile = (t: number): boolean => 
  t === TILE_FLOOR || t === TILE_GOAL

export const getTile = (entry: number): number =>
  entry & TILE_BIT_MASK

export const getElement = (entry: number): number =>
  entry & ELEMENT_BIT_MASK

export const isVoidElement = (element: number): boolean =>
  element === ELEMENT_VOID

export const isFreeAndWalkableEntry = (
  entry: number,
  withElementCheck: boolean = false
): boolean =>{
  const isWalkable = isWalkableTile(getTile(entry))
  const hasNoElement = !withElementCheck || isVoidElement(getElement(entry))
  return isWalkable && hasNoElement
}

export const isValidWalkablePosition = (
  maze: Maze,
  { x, y }: Position,
  withElementCheck: boolean = false,
): boolean => {
  const height = maze.length
  const width = maze[0].length
  if(x >= width || x < 0) {
    return false
  }
  if(y >= height || y < 0) {
    return false
  }
  return isFreeAndWalkableEntry(maze[y][x], withElementCheck)
}

export const getNextPositionInDirection = (
  { x: x0, y: y0 }: Position, 
  { x: x1, y: y1 }: Direction,
): Position => {
  return { x: x0 + x1, y: y0 + y1}
}

export const getDirection = ({ x: x0, y: y0 }: Position, { x: x1, y: y1 }: Position): Direction => {
  const x = Math.sign(x1 - x0)
  const y = Math.sign(y1 - y0)
  return { x, y }
}

export const printMaze = (maze: Maze) => {
  console.log('====== begin ======')
  maze.forEach(row => console.log(JSON.stringify(row)))
  console.log('====== end ======')
}

export const runWithinTime = async (
  promise: Promise<void>, 
  millis: number,
) => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise(resolve => setTimeout(resolve, millis))
  ])
}