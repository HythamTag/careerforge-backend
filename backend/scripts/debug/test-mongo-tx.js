const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function diagnose() {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected to MongoDB');

        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();

        console.log('--- Server Info ---');
        console.log('Version:', serverStatus.version);
        console.log('Process:', serverStatus.process);

        if (serverStatus.repl) {
            console.log('--- Replica Set Info ---');
            console.log('SetName:', serverStatus.repl.setName);
            console.log('IsMaster/IsPrimary:', serverStatus.repl.isWritablePrimary || serverStatus.repl.ismaster);
        } else {
            console.log('❌ NOT running as a replica set');
        }

        try {
            console.log('\n--- Testing Transaction Support ---');
            const session = await mongoose.startSession();
            console.log('✅ Session started successfully');

            session.startTransaction();
            console.log('✅ Transaction started successfully');

            // Try to write something
            const TestModel = mongoose.model('TestTx', new mongoose.Schema({ name: String }));
            await TestModel.create([{ name: 'tx-test' }], { session });
            console.log('✅ Write inside transaction successful');

            await session.commitTransaction();
            await session.endSession();
            console.log('✅ Transaction committed and session ended successfully');
            console.log('🚀 transactions ARE supported');
        } catch (txError) {
            console.log('❌ Transaction test failed at write/commit:', txError.message);
            if (txError.codeName) console.log('CodeName:', txError.codeName);
            if (txError.code) console.log('Code:', txError.code);
        }

    } catch (error) {
        console.error('💥 Connection failed:', error.message);
    } finally {
        // Clean up
        try {
            if (mongoose.models.TestTx) {
                await mongoose.models.TestTx.collection.drop();
            }
        } catch (e) { }
        await mongoose.disconnect();
        process.exit(0);
    }
}

diagnose();
