import { removeGroupFromConfig } from "../firebase/removeGroupFromConfig"
import { getExpiredGroupId } from "./utils"

const cleanOldMazes = async () => {
  const groupToRemoveId = getExpiredGroupId()
  console.log(`===> Removing group ${groupToRemoveId}...`)
  await removeGroupFromConfig(groupToRemoveId)
}

export default cleanOldMazes;