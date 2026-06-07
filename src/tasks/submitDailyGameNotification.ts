import { broadcastMessage } from "../firebase/broadcastMessage";
import { getDailyGameId } from "./utils";

const DAILY_MESSAGE_CONTENT = {
    'de': { title: 'Die tägliche Herausforderung ist da', body: 'Nimm am täglichen Spiel teil und setze deinen Highscore!', },
    'en': { title: 'The daily challenge has arrived', body: 'Join the daily game and set your score!', },
    'es': { title: 'El desafío diario ha llegado', body: '¡Únete al juego diario y establece tu puntuación!', },
    'fr': { title: 'Le défi quotidien est arrivé', body: 'Rejoignez le jeu quotidien et établissez votre score !', },
    'it': { title: 'La sfida giornaliera è arrivata', body: 'Unisciti al gioco giornaliero e stabilisci il tuo punteggio!', },
    'ja': { title: 'デイリーチャレンジが到着しました', body: 'デイリーゲームに参加してスコアを記録しよう!', },
    'ko': { title: '데일리 챌린지가 도착했습니다', body: '데일리 게임에 참여하고 점수를 기록하세요!', },
    'pt': { title: 'O desafio diário chegou', body: 'Participe do jogo diário e estabeleça sua pontuação!', },
    'ru': { title: 'Ежедневное испытание прибыло', body: 'Присоединяйтесь к ежедневной игре и установите свой счёт!', },
    'zh': { title: '每日挑战已到来', body: '加入每日游戏并创造你的得分!', },
}

const submitDailyGameNotification = async () => {
    const dailyGameId = getDailyGameId()
    const deeplink = `sokoboom://games/${dailyGameId}`
    await broadcastMessage('daily-challenge', DAILY_MESSAGE_CONTENT, { deeplink })
}

export default submitDailyGameNotification;