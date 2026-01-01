const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cv_enhancer');
    const jobs = await mongoose.connection.collection('cv_parsing_jobs').find({
        createdAt: { $gte: new Date(Date.now() - 3600 * 1000) }
    }).toArray();

    const cvMap = {};
    jobs.forEach(j => {
        const id = j.cvId.toString();
        if (!cvMap[id] || j.status === 'completed' || j.createdAt > cvMap[id].createdAt) cvMap[id] = j;
    });

    const vals = Object.values(cvMap);
    const completed = vals.filter(c => c.status === 'completed').length;
    const failed = vals.filter(c => c.status === 'failed').length;
    const processing = vals.length - completed - failed;

    console.log(`FINAL_REPORT: Total:${vals.length}, Success:${completed}, Failed:${failed}, Processing:${processing}`);
    process.exit(0);
}
check();
