
/**
 * Script to drop legacy 'referral.referralCode' index
 * 
 * Usage:
 * 1. Ensure .env has correct MONGODB_URI
 * 2. Run: node scripts/drop_legacy_index.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (try root .env)
const envPath = path.resolve(__dirname, '../../.env');
console.log('📄 Loading .env from:', envPath);
dotenv.config({ path: envPath });

const INDEX_TO_DROP = 'referral.referralCode_1';

async function dropIndex() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI not found in .env');
        }

        console.log('📦 Connecting to MongoDB...');
        console.log(`   URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Mask password

        await mongoose.connect(uri);
        console.log('✅ Connected successfully');

        const collection = mongoose.connection.db.collection('users');

        // List indexes
        console.log('\n🔍 Listing indexes on "users" collection...');
        const indexes = await collection.indexes();

        let found = false;
        indexes.forEach(idx => {
            console.log(`   - ${idx.name} (${JSON.stringify(idx.key)})`);
            if (idx.name === INDEX_TO_DROP) {
                found = true;
            }
        });

        if (found) {
            console.log(`\n⚠️ Found target index: "${INDEX_TO_DROP}"`);
            console.log('🗑️ Dropping index...');
            await collection.dropIndex(INDEX_TO_DROP);
            console.log('✅ Index dropped successfully!');
        } else {
            console.log(`\nℹ️ Target index "${INDEX_TO_DROP}" NOT found. It may have been dropped already.`);

            // Check for other potential matches
            const similar = indexes.filter(idx => idx.name.includes('referralCode') && idx.name !== INDEX_TO_DROP);
            if (similar.length > 0) {
                console.log('⚠️ Found these similar indexes (not dropped automatically):');
                similar.forEach(idx => console.log(`   - ${idx.name}`));
                console.log('   To drop these, modify INDEX_TO_DROP in this script.');
            }
        }

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('\n👋 Disconnected');
        }
    }
}

dropIndex();
