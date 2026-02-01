import { getRemoteConfig, RemoteConfigParameter, RemoteConfigParameterGroup } from 'firebase-admin/remote-config';
import getInstance from "./getInstance"

export const removeGroupFromConfig = async (
    groupKey: string,
) => {
  const remoteConfig = getRemoteConfig(getInstance())

  try {
    const template = await remoteConfig.getTemplate()

    const group: RemoteConfigParameterGroup = template.parameterGroups[groupKey]
    if(!group) {
      throw new Error(`group with key ${groupKey} not found in config`)
    }

    // Update the template by removing the group
    delete template.parameterGroups[groupKey];

    // Validate and publish the modified template
    const validTemplate = await remoteConfig.validateTemplate(template)
    await remoteConfig.publishTemplate(validTemplate);
    
    console.log('===> Successfully updated remote config');
  } catch (error: any) {
    console.error('===> Error in updateRemoteConfig:', error);
    throw error;
  }
}