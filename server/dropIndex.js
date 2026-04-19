require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

async function dropOldIndex() {
  await connectDB();
  try {
    const db = mongoose.connection.db;
    const collections = await db.collections();
    const voteCollection = collections.find(c => c.collectionName === 'votes');
    
    if (voteCollection) {
      const indexes = await voteCollection.indexes();
      const oldIndexExists = indexes.some(idx => idx.name === 'voterId_1_position_1_department_1');
      
      if (oldIndexExists) {
        await voteCollection.dropIndex('voterId_1_position_1_department_1');
        console.log('Successfully dropped old double-voting index');
      } else {
        console.log('Old index not found, nothing to drop');
      }
    }
  } catch (error) {
    console.error('Error dropping index:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

dropOldIndex();
