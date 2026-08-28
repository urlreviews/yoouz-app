import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace Firebase imports and usages
content = content.replace(/import \{ adminAuth, adminDb, adminStorage \} from "\.\/src\/lib\/firebase-admin\.ts";/g, 'const adminDb: any = null;');

// Add NoSQL routes
const nosqlRoutes = `
import { firestore_video_reviews, firestore_users, firestore_places, firestore_chats } from "./src/db/schema.ts";

const getNoSqlTable = (col: string) => {
  switch(col) {
    case 'videoReviews': return firestore_video_reviews;
    case 'users': return firestore_users;
    case 'places': return firestore_places;
    case 'chats': return firestore_chats;
    default: return null;
  }
};

app.get('/api/nosql/:collection', async (req, res) => {
  try {
    const table = getNoSqlTable(req.params.collection);
    if (!table) return res.status(404).json({ error: 'Collection not found' });
    const records = await db.select().from(table).orderBy(desc(table.createdAt));
    res.json(records.map((r: any) => ({ id: r.id, ...r.data })));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/nosql/:collection/:id', async (req, res) => {
  try {
    const table = getNoSqlTable(req.params.collection);
    if (!table) return res.status(404).json({ error: 'Collection not found' });
    const [record] = await db.select().from(table).where(eq(table.id, req.params.id));
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json({ id: record.id, ...record.data });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/nosql/:collection/:id', express.json({limit: '50mb'}), async (req, res) => {
  try {
    const table = getNoSqlTable(req.params.collection);
    if (!table) return res.status(404).json({ error: 'Collection not found' });
    const { data } = req.body;
    const [existing] = await db.select().from(table).where(eq(table.id, req.params.id));
    if (existing) {
      await db.update(table).set({ data }).where(eq(table.id, req.params.id));
    } else {
      await db.insert(table).values({ id: req.params.id, data });
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/nosql/:collection/:id', async (req, res) => {
  try {
    const table = getNoSqlTable(req.params.collection);
    if (!table) return res.status(404).json({ error: 'Collection not found' });
    await db.delete(table).where(eq(table.id, req.params.id));
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

`;

content = content.replace('app.get("/api/health"', nosqlRoutes + '\n  app.get("/api/health"');

fs.writeFileSync('server.ts', content);
console.log("Server patched!");
