import { getRemoteConfig, RemoteConfigParameter, RemoteConfigParameterGroup } from 'firebase-admin/remote-config';
import getInstance from "./getInstance"

export const updateRemoteConfig = async (
  groupKey: string,
  key: string,
  value: RemoteConfigParameter
) => {
  const remoteConfig = getRemoteConfig(getInstance())
  
  try {
    // Get the current template
    const template = await remoteConfig.getTemplate()

    let group: RemoteConfigParameterGroup = template.parameterGroups[groupKey]
    if(!group) {
      group = {
        description: `daily games for ${groupKey}`,
        parameters: {}
      }
    }
    if(group.parameters[key]) {
      throw new Error(`entry for key: ${key} already present in group ${groupKey}`)
    }
    
    // Update the parameters directly on the template object
    template.parameterGroups[groupKey] = {
      ...group,
      parameters: {
        ...group.parameters,
        [key]: value
      }
    };

    // Validate and publish the modified template
    const validTemplate = await remoteConfig.validateTemplate(template)
    await remoteConfig.publishTemplate(validTemplate);
    
    console.log('===> Successfully updated remote config');
    
  } catch (error: any) {
    console.error('===> Error in updateRemoteConfig:', error);
    throw error;
  }
}