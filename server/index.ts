import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';

const app = express();
app.use(cors());
app.use(express.json());

// Store Firebase app instances
const firebaseApps = new Map<string, admin.app.App>();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint to list all collections
app.post('/api/collections', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    const { serviceAccount } = req.body;
    if (!serviceAccount) {
      console.log('No service account found in request body');
      return res.status(400).json({ error: 'Service account credentials required' });
    }

    console.log('Service account project_id:', serviceAccount.project_id);
    console.log('Service account type:', serviceAccount.type);

    let firebaseApp: admin.app.App;

    // Check if we already have an app instance for this project
    if (firebaseApps.has(serviceAccount.project_id)) {
      console.log('Found existing Firebase app instance');
      firebaseApp = firebaseApps.get(serviceAccount.project_id)!;
    } else {
      console.log('Initializing new Firebase app');
      // Initialize new Firebase Admin app with the provided service account
      try {
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        }, serviceAccount.project_id);
        
        // Store the app instance
        firebaseApps.set(serviceAccount.project_id, firebaseApp);
        console.log('Successfully initialized Firebase app');
      } catch (error) {
        console.error('Error initializing Firebase app:', error);
        return res.status(500).json({ error: 'Failed to initialize Firebase app: ' + (error as Error).message });
      }
    }

    // Get Firestore instance for this app
    const db = firebaseApp.firestore();
    console.log('Getting Firestore instance...');
    
    // List collections with timeout
    const timeoutMs = 30000; // 30 seconds timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout listing collections')), timeoutMs)
    );

    // Only get top-level collections first
    console.log('Listing top-level collections...');
    const collectionsPromise = db.listCollections().then(collections => collections.map(col => col.id));
    
    const collectionIds = await Promise.race([collectionsPromise, timeoutPromise]) as string[];
    console.log('Found collections:', collectionIds);

    res.json({ collections: collectionIds });

    // After sending response, fetch subcollections asynchronously
    if (collectionIds.length > 0) {
      console.log('Starting async subcollection discovery...');
      (async () => {
        const allCollections = [...collectionIds];
        
        for (const colId of collectionIds) {
          try {
            console.log(`Fetching documents in collection: ${colId}`);
            const snapshot = await db.collection(colId).get();
            
            for (const doc of snapshot.docs) {
              const subCollections = await doc.ref.listCollections();
              for (const subCol of subCollections) {
                const subColPath = `${colId}/${doc.id}/${subCol.id}`;
                console.log(`Found subcollection: ${subColPath}`);
                allCollections.push(subColPath);
              }
            }
          } catch (error) {
            console.error(`Error processing collection ${colId}:`, error);
          }
        }
        console.log('Completed subcollection discovery. Total paths:', allCollections.length);
      })().catch(error => {
        console.error('Error in async subcollection discovery:', error);
      });
    }
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({ error: 'Failed to list collections: ' + (error as Error).message });
  }
});

// Cleanup endpoint to delete Firebase app instances
app.delete('/api/cleanup/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const app = firebaseApps.get(projectId);
    if (app) {
      await app.delete();
      firebaseApps.delete(projectId);
    }
    res.json({ message: 'Cleanup successful' });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup Firebase app' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 