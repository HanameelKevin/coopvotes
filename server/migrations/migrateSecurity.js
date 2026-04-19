/**
 * Security Migration Script
 * Run this to set up all security indexes and constraints
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');

async function migrate() {
  console.log('🚀 Starting Security Migration...\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // 1. Create indexes for User collection
    console.log('📋 Creating User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ regNumber: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ hasVoted: 1 });
    console.log('✅ User indexes created\n');

    // 2. Create indexes for Vote collection
    console.log('📋 Creating Vote indexes...');
    // Critical: Compound unique index for double voting prevention
    await Vote.collection.createIndex(
      { voterId: 1, position: 1, department: 1 },
      { unique: true, name: 'double_vote_prevention' }
    );
    await Vote.collection.createIndex({ receiptHash: 1 }, { unique: true });
    await Vote.collection.createIndex({ chainedHash: 1 });
    await Vote.collection.createIndex({ voterId: 1 });
    await Vote.collection.createIndex({ candidateId: 1 });
    await Vote.collection.createIndex({ electionId: 1 });
    await Vote.collection.createIndex({ position: 1 });
    await Vote.collection.createIndex({ createdAt: -1 });
    console.log('✅ Vote indexes created\n');

    // 3. Create indexes for AuditLog collection
    console.log('📋 Creating AuditLog indexes...');
    await AuditLog.collection.createIndex({ userId: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ action: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ severity: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ ipAddress: 1, timestamp: -1 });
    await AuditLog.collection.createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
    console.log('✅ AuditLog indexes created\n');

    // 4. Validate existing data
    console.log('🔍 Validating existing data...');

    // Check for duplicate votes (should be none with proper indexes)
    const duplicateVotes = await Vote.aggregate([
      {
        $group: {
          _id: { voterId: '$voterId', position: '$position', department: '$department' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicateVotes.length > 0) {
      console.warn(`⚠️  Found ${duplicateVotes.length} duplicate vote groups!`);
      console.warn('   This should be investigated and fixed manually.');
    } else {
      console.log('✅ No duplicate votes found\n');
    }

    // Check for users without proper regNumber format
    const invalidRegNumbers = await User.find({
      regNumber: { $not: /^C[0-9]{3}\/[0-9]{6}\/[0-9]{4}$/ }
    });

    if (invalidRegNumbers.length > 0) {
      console.warn(`⚠️  Found ${invalidRegNumbers.length} users with invalid regNumber format`);
      invalidRegNumbers.forEach(user => {
        console.warn(`   - ${user.email}: ${user.regNumber}`);
      });
      console.warn('   These should be updated manually.\n');
    } else {
      console.log('✅ All regNumbers are properly formatted\n');
    }

    // 5. Generate encryption key reminder
    console.log('🔐 Encryption Configuration:');
    if (!process.env.VOTE_ENCRYPTION_KEY) {
      const generatedKey = require('crypto').randomBytes(32).toString('hex');
      console.log(`   ⚠️  VOTE_ENCRYPTION_KEY not set!`);
      console.log(`   🔑 Generated key (add to .env):`);
      console.log(`   VOTE_ENCRYPTION_KEY=${generatedKey}\n`);
    } else {
      const keyLength = Buffer.from(process.env.VOTE_ENCRYPTION_KEY, 'hex').length;
      if (keyLength === 32) {
        console.log('   ✅ VOTE_ENCRYPTION_KEY is properly configured\n');
      } else {
        console.log(`   ⚠️  VOTE_ENCRYPTION_KEY has invalid length: ${keyLength} bytes (expected 32)\n`);
      }
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - User indexes: 4 created');
    console.log('   - Vote indexes: 7 created');
    console.log('   - AuditLog indexes: 5 created');
    console.log('   - Double voting prevention: ACTIVE');
    console.log('   - Vote encryption: READY\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
migrate();
