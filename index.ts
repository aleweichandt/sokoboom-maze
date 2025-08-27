import 'dotenv/config';
import { RemoteConfigParameter } from "firebase-admin/remote-config";
import generate from "./src/maze";
import { updateRemoteConfig } from "./src/firebase/updateRemoteConfig";

const dayjs = require('dayjs');

const getDailyGameId = (): string => {
  if(process.env.GAME_KEY) {
    return process.env.GAME_KEY
  }

  const date = dayjs().format('YYMMDD');
  return `game${date}`
}

const getGroupId = (): string => {
  return dayjs().format('YYMM');
}

const getTimeToSolve = (
  _moves: number, // TODO use this later on
): number => {
  if(process.env.TIME_SECONDS_TO_SOLVE) {
    return parseInt(process.env.TIME_SECONDS_TO_SOLVE, 10) * 1000
  }
  return 2 * 60 * 1000 // 2 mins
}

const deployUpdate = async () => {
  const minSolutionMoves = process.env.MIN_MOVES_TO_SOLVE ? parseInt(process.env.MIN_MOVES_TO_SOLVE, 10) : undefined
  const miaxolutionMoves = process.env.MAX_MOVES_TO_SOLVE ? parseInt(process.env.MAX_MOVES_TO_SOLVE, 10) : undefined
  const [maze, moves] = generate(
    minSolutionMoves,
    miaxolutionMoves,
  )

  // get daily key
  const groupKey = getGroupId()
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

const mainScript = async () => {
  try {
    await deployUpdate()
    console.log('===> Update complete')
    process.exit(0)
  } catch(e) {
    console.error(e)
    process.exit(1)
  }
}

mainScript()