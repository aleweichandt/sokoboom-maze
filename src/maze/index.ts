import buildMaze from "./buildMaze";
import fillMaze from "./fillMaze";
import { printMaze } from "./helpers";
import solveMaze from "./solveMaze";
import { Maze } from "./types";

const MIN_SOLUTION_MOVES = 40
const MAX_SOLUTION_MOVES = 60

type ReturnType = [
  maze: Maze,
  moves: number,
]

const generate = (
  minSolutionMoves: number = MIN_SOLUTION_MOVES,
  maxSolutionMoves: number = MAX_SOLUTION_MOVES,
): ReturnType => {
  let maze: Maze | undefined
  let moves: number = 0
  while(!maze || moves < minSolutionMoves || moves > maxSolutionMoves) {
    // build empty maze
    maze = buildMaze()
    // add player and boxes
    fillMaze(maze)
    // check how easy is to solve
    moves = solveMaze(maze)
    console.log('===> takes', moves, 'moves to solve')
  }

  printMaze(maze)
  return [maze, moves]
}

export default generate




