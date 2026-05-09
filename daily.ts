import 'dotenv/config';
import createDailyMaze from './src/tasks/createDailyMaze';

const main = async () => {
  try {
    await createDailyMaze()
    console.log('===> Update complete') 
    process.exit(0)
  } catch(e) {
    console.error(e)
    process.exit(1)
  }
}

main();