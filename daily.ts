import 'dotenv/config';
import createDailyMaze from './src/tasks/createDailyMaze';
import submitDailyGameNotification from './src/tasks/submitDailyGameNotification';

const main = async () => {
  try {
    await createDailyMaze()
    await submitDailyGameNotification();
    console.log('===> Update complete') 
    process.exit(0)
  } catch(e) {
    console.error(e)
    process.exit(1)
  }
}

main();