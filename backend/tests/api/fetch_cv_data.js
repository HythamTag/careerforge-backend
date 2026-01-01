
const axios = require('axios');
const { CryptoFactory } = require('../../src/core/security/crypto.factory');
const { User } = require('../../src/modules/users/models/user.model');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Get Token
        const user = await User.findOne();
        if (!user) throw new Error('No user found');

        const tokenService = CryptoFactory.createTokenService();
        const token = tokenService.generateAuthToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role
        });

        // 2. Fetch CV
        const cvId = '69562a3d548d642764fb4807'; // ID from recent benchmark
        const response = await axios.get(`http://localhost:5000/v1/cvs/${cvId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Output Personal Info
        console.log(JSON.stringify(response.data.data.content.personalInfo, null, 2));

    } catch (error) {
        console.error(error.message);
        if (error.response) console.error(error.response.data);
    } finally {
        await mongoose.disconnect();
    }
}

run();
