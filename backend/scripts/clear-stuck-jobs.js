/**
 * Utility Script: Clear Stuck Generation Jobs
 * Fixes "Maximum concurrent generations exceeded" error
 */

require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from project root
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-enhancer';

async function clearStuckJobs() {
    console.log('=== CLEARING STUCK GENERATION JOBS ===\n');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const generationsCollection = db.collection('generation_jobs');
        const jobsCollection = db.collection('jobs');

        // 1. Find stuck generations
        const stuckGenerations = await generationsCollection.countDocuments({
            status: { $in: ['pending', 'processing'] }
        });

        console.log(`Found ${stuckGenerations} stuck generation(s).`);

        if (stuckGenerations > 0) {
            // 2. Update them to failed
            const result = await generationsCollection.updateMany(
                { status: { $in: ['pending', 'processing'] } },
                {
                    $set: {
                        status: 'failed',
                        failedAt: new Date(),
                        error: {
                            code: 'MANUAL_CLEANUP',
                            message: 'Job cleared by manual cleanup script (stuck state)'
                        },
                        currentStep: 'Manual cleanup'
                    }
                }
            );

            console.log(`Updated ${result.modifiedCount} generations to 'failed'.`);

            // 3. Mark associated jobs as failed in jobs collection if necessary
            const updateJobs = await jobsCollection.updateMany(
                { status: { $in: ['pending', 'processing'] }, type: 'cv_generation' },
                {
                    $set: {
                        status: 'failed',
                        failedAt: new Date(),
                        error: {
                            message: 'Job cleared by manual cleanup script'
                        }
                    }
                }
            );
            console.log(`Updated ${updateJobs.modifiedCount} underlying jobs to 'failed'.`);
        } else {
            console.log('No stuck jobs found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }

    // Explicit exit to ensure script doesn't hang
    process.exit(0);
}

clearStuckJobs();
