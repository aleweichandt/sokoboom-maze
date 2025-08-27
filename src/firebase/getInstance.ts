import { initializeApp, App, cert } from 'firebase-admin/app'

let instance: App | undefined

const getInstance = () => {
  if(instance) {
    return instance
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!serviceAccountKey || !projectId) {
    throw new Error('Missing required environment variables: FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID');
  }

  // Parse the service account key (it should be a JSON string in the environment variable)
  const serviceAccount = JSON.parse(serviceAccountKey);

  instance = initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId,
  });
}

export default getInstance