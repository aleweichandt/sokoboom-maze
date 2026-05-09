const dayjs = require('dayjs');


export const getCurrentGroupId = (): string => {
  return dayjs().format('YYMM');
}

export const getExpiredGroupId = (): string => {
  return dayjs().subtract(4, 'month').format('YYMM');
}

export const getDailyGameId = (): string => {
  if(process.env.GAME_KEY) {
    return process.env.GAME_KEY
  }

  const date = dayjs().format('YYMMDD');
  return `game${date}`
}