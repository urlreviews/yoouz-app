
import { db } from './src/db/index.js';
import { firestore_video_reviews, firestore_users, firestore_places, firestore_chats } from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

const getTable = (collectionName) => {
  switch(collectionName) {
    case 'videoReviews': return firestore_video_reviews;
    case 'users': return firestore_users;
    case 'places': return firestore_places;
    case 'chats': return firestore_chats;
    default: return null;
  }
};

export const registerFirestoreRoutes = (app) => {
  app.get('/api/firestore/:collection', async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: 'Collection not found' });
      
      const records = await db.select().from(table).orderBy(desc(table.createdAt));
      res.json(records.map(r => ({ id: r.id, ...r.data })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/firestore/:collection/:id', async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: 'Collection not found' });
      
      const [record] = await db.select().from(table).where(eq(table.id, req.params.id));
      if (!record) return res.status(404).json({ error: 'Not found' });
      res.json({ id: record.id, ...record.data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/firestore/:collection/:id', async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: 'Collection not found' });
      
      const { data } = req.body;
      const [existing] = await db.select().from(table).where(eq(table.id, req.params.id));
      if (existing) {
        await db.update(table).set({ data }).where(eq(table.id, req.params.id));
      } else {
        await db.insert(table).values({ id: req.params.id, data });
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/firestore/:collection/:id', async (req, res) => {
    try {
      const table = getTable(req.params.collection);
      if (!table) return res.status(404).json({ error: 'Collection not found' });
      
      await db.delete(table).where(eq(table.id, req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
};
