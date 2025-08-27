import type { Direction, Maze, Position } from './types';
import {
    TILE_GOAL,
    ELEMENT_PLAYER,
    ELEMENT_BOX,
    DIRECTION_LEFT,
    DIRECTION_RIGHT,
    DIRECTION_UP,
    DIRECTION_DOWN
} from './const';
import { getTile, getElement, getNextPositionInDirection, isValidWalkablePosition } from './helpers';

interface GameState {
    boxes: Position[];
    goals: Position[];
    player: Position | null;
}

interface SearchNode {
    player: Position;
    boxes: Position[];
    moves: number;
    pushes: number;
    priority: number;
}

interface Move {
    player: Position;
    boxes: Position[];
    isPush: boolean;
}


    
// Check if position is valid and walkable (NO CHECK OF ENTITIES)
const isValidWalkableNextPositionInDirection = (
  maze: Maze,
  post: Position,
  dir: Direction,
): boolean => {
    const nextPos = getNextPositionInDirection(post, dir)
    return isValidWalkablePosition(maze, nextPos)
};

// Deadlock detection - simple freeze deadlock
const isSimpleDeadlock = (
    maze: Maze,
    boxes: Position[], 
    goals: Position[],
): boolean => {
    for (const box of boxes) {
        // Skip if box is on goal
        if (goals.some(goal => goal.x === box.x && goal.y === box.y)) continue;
        
        // Check for corner deadlock
        const { x, y } = box;
        const left = !isValidWalkableNextPositionInDirection(maze, box, DIRECTION_LEFT);
        const right = !isValidWalkableNextPositionInDirection(maze, box, DIRECTION_RIGHT);
        const up = !isValidWalkableNextPositionInDirection(maze, box, DIRECTION_UP);
        const down = !isValidWalkableNextPositionInDirection(maze, box, DIRECTION_DOWN);
        
        // Corner deadlock: box against two perpendicular walls
        if ((left && up) || (left && down) || (right && up) || (right && down)) {
            return true;
        }
        
        // Line deadlock: box against wall with no goals in that line
        if (left && right) {
            // Check if there are any goals in this row
            const hasGoalInRow = goals.some(goal => goal.y === y);
            if (!hasGoalInRow) return true;
        }
        if (up && down) {
            // Check if there are any goals in this column
            const hasGoalInCol = goals.some(goal => goal.x === x);
            if (!hasGoalInCol) return true;
        }
    }
    return false;
};

const buildBoxFormation = (box: Position, vd: Direction, hd: Direction): Position[] =>
    [
        box,
        getNextPositionInDirection(box, hd),
        getNextPositionInDirection(box, vd), 
        getNextPositionInDirection(getNextPositionInDirection(box, vd), hd)
    ]

// Advanced deadlock: check for box clusters that can't be moved
const isAdvancedDeadlock = (
    maze: Maze,
    boxes: Position[], 
    goals: Position[],
): boolean => {
    // Check for 2x2 box formations not entirely on goals
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const box1 = boxes[i];
            const box2 = boxes[j];
            
            // Check adjacent boxes forming potential deadlocks
            if (Math.abs(box1.x - box2.x) <= 1 && Math.abs(box1.y - box2.y) <= 1) {
                // Look for 2x2 formations
                const formations = [
                    buildBoxFormation(box1, DIRECTION_DOWN, DIRECTION_RIGHT),
                    buildBoxFormation(box1, DIRECTION_DOWN, DIRECTION_LEFT),
                    buildBoxFormation(box1, DIRECTION_UP, DIRECTION_RIGHT),
                    buildBoxFormation(box1, DIRECTION_UP, DIRECTION_LEFT)
                ];
                
                for (const formation of formations) {
                    const boxesInFormation = formation.filter(pos => 
                        boxes.some(b => b.x === pos.x && b.y === pos.y)
                    );
                    
                    if (boxesInFormation.length >= 2) {
                        const goalsInFormation = formation.filter(pos => 
                            goals.some(g => g.x === pos.x && g.y === pos.y)
                        );
                        
                        // If 2+ boxes in formation but fewer goals, it's a deadlock
                        if (boxesInFormation.length > goalsInFormation.length) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
};
    
// Combined deadlock detection
const isDeadlock = (
    maze: Maze,
    boxes: Position[], 
    goals: Position[],
): boolean => {
    return isSimpleDeadlock(maze, boxes, goals) || isAdvancedDeadlock(maze, boxes, goals);
};

// Parse initial state from matrix
const parseInitialState = (
    maze: Maze
): GameState => {
    const height = maze.length;
    const width = maze[0]?.length;
    const boxes: Position[] = [];
    const goals: Position[] = [];
    let player: Position | null = null;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const entry = maze[y][x];
            const tile = getTile(entry);
            const element = getElement(entry);
            
            if (element === ELEMENT_PLAYER) {
                player = { x, y };
            }
            
            if (element === ELEMENT_BOX) {
                boxes.push({ x, y });
            }
            
            if (tile === TILE_GOAL) {
                goals.push({ x, y });
            }
        }
    }
    
    return { boxes, goals, player };
}

// Create state key for memoization
const stateKey = (
    playerPos: Position, 
    boxes: Position[],
): string => {
    const boxesStr = boxes
        .map(b => `${b.x},${b.y}`)
        .sort()
        .join('|');
    return `${playerPos.x},${playerPos.y}:${boxesStr}`;
}

// Check if all boxes are on goals
const isWin = (
    boxes: Position[], 
    goals: Position[],
): boolean => {
    if (boxes.length !== goals.length) return false;
    return boxes.every(box => 
        goals.some(goal => goal.x === box.x && goal.y === box.y)
    );
}

// Improved heuristic with goal distance and box clustering
const heuristic = (
    maze: Maze,
    boxes: Position[],
    goals: Position[],
): number  => {
    if (boxes.length !== goals.length) return Infinity;
    
    let totalDist = 0;
    const usedGoals = new Set<number>();
    
    // Greedy assignment of boxes to goals
    for (const box of boxes) {
        let minDist = Infinity;
        let bestGoal: number | null = null;
        
        for (let i = 0; i < goals.length; i++) {
            if (usedGoals.has(i)) continue;
            const dist = Math.abs(box.x - goals[i].x) + Math.abs(box.y - goals[i].y);
            if (dist < minDist) {
                minDist = dist;
                bestGoal = i;
            }
        }
        
        if (bestGoal !== null) {
            usedGoals.add(bestGoal);
            totalDist += minDist;
        }
    }
    
    // Add penalty for boxes close to walls (harder to maneuver)
    for (const box of boxes) {
        let wallCount = 0;
        if (!isValidWalkableNextPositionInDirection(maze, box, DIRECTION_LEFT)) wallCount++;
        if (!isValidWalkableNextPositionInDirection(maze, box, DIRECTION_RIGHT)) wallCount++;
        if (!isValidWalkableNextPositionInDirection(maze, box, DIRECTION_DOWN)) wallCount++;
        if (!isValidWalkableNextPositionInDirection(maze, box, DIRECTION_UP)) wallCount++;
        totalDist += wallCount * 0.5; // Small penalty
    }
    
    return totalDist;
}

// Check if there's a box at given position
const getBoxIndexAt = (
    boxes: Position[],
    { x, y }: Position,
): number => boxes.findIndex(box => box.x === x && box.y === y);

// Get possible moves from current state
const getPossibleMoves = (
    maze: Maze,
    playerPos: Position, 
    boxes: Position[],
): Move[] => {
    const moves: Move[] = [];
    const directions: Direction[] = [
        DIRECTION_UP,
        DIRECTION_DOWN,
        DIRECTION_LEFT,
        DIRECTION_RIGHT,
    ];
    
    for (const dir of directions) {
        const newPos = getNextPositionInDirection(playerPos, dir)
        
        if (!isValidWalkableNextPositionInDirection(maze, playerPos, dir)) continue;
        
        // Check if there's a box at the new position
        const boxIndex = getBoxIndexAt(boxes, newPos)
        
        if (boxIndex === -1) {
            // Simple move - no box
            moves.push({
                player: newPos,
                boxes: boxes,
                isPush: false
            });
        } else {
            // Box push
            const boxPos = getNextPositionInDirection(playerPos, dir)
            const boxNewPos = getNextPositionInDirection(boxPos, dir)
            
            // Check if box destination is valid
            if (!isValidWalkableNextPositionInDirection(maze, boxPos, dir)) continue;
            
            // Check if another box is at the destination
            if (getBoxIndexAt(boxes, boxNewPos) !== -1) continue;
            
            // Create new boxes array with moved box
            const newBoxes = [...boxes];
            newBoxes[boxIndex] = boxNewPos;
            
            moves.push({
                player: boxPos,
                boxes: newBoxes,
                isPush: true
            });
        }
    }
    
    return moves;
}

// YASS-inspired greedy best-first search
const yassSolve = (
    maze: Maze, 
    initialState: GameState,
): number => {
    const { boxes, goals, player } = initialState;
    
    if (!player) return -1;
    if (isWin(boxes, goals)) return 0;
    
    const openSet: SearchNode[] = [];
    const closedSet = new Set<string>();
    let bestSolution = Infinity;
    
    openSet.push({
        player,
        boxes,
        moves: 0,
        pushes: 0,
        priority: heuristic(maze, boxes, goals)
    });
    
    let iterations = 0;
    const maxIterations = 100000;
    
    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Sort by priority (greedy approach)
        openSet.sort((a, b) => a.priority - b.priority);
        const current = openSet.shift()!;
        
        const currentKey = stateKey(current.player, current.boxes);
        
        if (closedSet.has(currentKey)) continue;
        closedSet.add(currentKey);
        
        if (isWin(current.boxes, goals)) {
            bestSolution = Math.min(bestSolution, current.moves);
            continue; // Continue searching for potentially better solutions
        }
        
        // Skip if current path is already longer than best known solution
        if (current.moves >= bestSolution) continue;
        
        // Skip if deadlock detected
        if (isDeadlock(maze, current.boxes, goals)) continue;
        
        const moves = getPossibleMoves(maze, current.player, current.boxes);
        
        for (const move of moves) {
            const moveKey = stateKey(move.player, move.boxes);
            
            if (closedSet.has(moveKey)) continue;
            
            const newPushes = current.pushes + (move.isPush ? 1 : 0);
            const newMoves = current.moves + 1;
            
            // Calculate priority with emphasis on pushes and heuristic
            const h = heuristic(maze, move.boxes, goals);
            const priority = h + newPushes * 2; // Prioritize fewer pushes
            
            openSet.push({
                player: move.player,
                boxes: move.boxes,
                moves: newMoves,
                pushes: newPushes,
                priority: priority
            });
        }
        
        // Limit open set size to prevent memory issues
        if (openSet.length > 10000) {
            openSet.sort((a, b) => a.priority - b.priority);
            openSet.splice(5000); // Keep best 5000 nodes
        }
    }
    
    return bestSolution === Infinity ? -1 : bestSolution;
}

function solveMaze(maze: Maze): number {
    // Main function logic
    try {
        const initialState = parseInitialState(maze);
        
        // Validation checks
        if (!initialState.player) {
            console.warn('No player found in maze');
            return -1;
        }
        
        if (initialState.boxes.length === 0) {
            console.warn('No boxes found in maze');
            return 0;
        }
        
        if (initialState.goals.length === 0) {
            console.warn('No goals found in maze');
            return -1;
        }
        
        if (initialState.boxes.length !== initialState.goals.length) {
            console.warn('Number of boxes does not match number of goals');
            return -1;
        }
        
        // Check for immediate deadlocks
        if (isDeadlock(maze, initialState.boxes, initialState.goals)) {
            console.warn('Initial state is in deadlock');
            return -1;
        }
        
        return yassSolve(maze, initialState);
        
    } catch (error) {
        console.error('Error solving Sokoban:', error);
        return -1;
    }
}

export default solveMaze;