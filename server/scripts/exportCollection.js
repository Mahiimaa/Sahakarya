const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const dbName = "Sahakarya";
const outputFolder = path.join(__dirname, "exported_collections");

async function exportCollectionStructure() {
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();

  for (const { name } of collections) {
    const collection = db.collection(name);
    const doc = await collection.findOne();

    let content;
    if (doc) {
      content = [doc]; 
    } else {
      content = [{ _info: "no data, structure unknown" }];
    }

    const filePath = path.join(outputFolder, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Saved ${filePath}`);
  }

  await client.close();
  console.log("🎉 All collection structures exported.");
}

exportCollectionStructure();
