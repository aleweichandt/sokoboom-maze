import { RemoteConfigParameter } from "firebase-admin/remote-config"
import { updateRemoteConfig } from "../firebase/updateRemoteConfig"
import { getCurrentGroupId, getDailyGameId } from "./utils"
import generate from "../maze"

const getTimeToSolve = (
  _moves: number, // TODO use this later on
): number => {
  if(process.env.TIME_SECONDS_TO_SOLVE) {
    return parseInt(process.env.TIME_SECONDS_TO_SOLVE, 10) * 1000
  }
  return 2 * 60 * 1000 // 2 mins
}

const createDailyMaze = async () => {
  const minSolutionMoves = process.env.MIN_MOVES_TO_SOLVE ? parseInt(process.env.MIN_MOVES_TO_SOLVE, 10) : undefined
  const miaxolutionMoves = process.env.MAX_MOVES_TO_SOLVE ? parseInt(process.env.MAX_MOVES_TO_SOLVE, 10) : undefined
  const [maze, moves] = generate(
    minSolutionMoves,
    miaxolutionMoves,
  )

  // get daily key
  const groupKey = getCurrentGroupId()
  const gameKey = getDailyGameId()
  const timeToSolve = getTimeToSolve(moves)

  const dailyUpdate: RemoteConfigParameter = {
    defaultValue: {
      value: JSON.stringify([timeToSolve, maze])
    },
    description: `Generated game data for ${gameKey}`,
  }

  await updateRemoteConfig(groupKey, gameKey, dailyUpdate)
}

export default createDailyMaze;