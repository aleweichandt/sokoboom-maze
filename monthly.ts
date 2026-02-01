import 'dotenv/config';
import { removeGroupFromConfig } from "./src/firebase/removeGroupFromConfig";

const dayjs = require('dayjs');

const getGroupId = (): string => {
  return dayjs().subtract(4, 'month').format('YYMM');
}

const mainScript = async () => {
  try {
    const groupToRemoveId = getGroupId()
    console.log(`===> Removing group ${groupToRemoveId}...`)
    await removeGroupFromConfig(groupToRemoveId)
    console.log('===> Update complete')
    process.exit(0)
  } catch(e) {
    console.error(e)
    process.exit(1)
  }
}

mainScript()