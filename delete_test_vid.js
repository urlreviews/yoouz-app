import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.BUNNY_DB_URL;
  const token = process.env.BUNNY_DB_ACCESS_KEY;
  if (!url || !token) {
    console.error("Missing Bunny DB credentials in env.");
    return;
  }

  const query = {
    query: `SELECT id, placeName, authorName FROM videoReviews ORDER BY updatedAt DESC LIMIT 20;`
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "AccessKey": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(query)
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
