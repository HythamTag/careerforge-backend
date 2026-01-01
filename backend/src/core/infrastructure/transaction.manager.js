const mongoose = require('mongoose');
const logger = require('@utils/logger');

/**
 * TRANSACTION MANAGER
 * 
 * Centralized utility for handling MongoDB transactions across services.
 * Automatically detects if the database supports transactions (replica set) 
 * and falls back to non-transactional execution on standalone instances.
 */
class TransactionManager {
    constructor() {
        this._supportsTransactions = null;
    }

    /**
     * Check if the current database connection supports transactions
     * @returns {Promise<boolean>}
     */
    async supportsTransactions() {
        if (this._supportsTransactions !== null) {
            return this._supportsTransactions;
        }

        try {
            // Check replica set status
            const admin = mongoose.connection.db.admin();
            const serverStatus = await admin.serverStatus();

            this._supportsTransactions = !!serverStatus.repl;

            if (this._supportsTransactions) {
                logger.debug('MongoDB Replica Set detected: Transactions enabled');
            } else {
                logger.warn('MongoDB Standalone detected: Transactions disabled (falling back to atomic-best-effort)');
            }

            return this._supportsTransactions;
        } catch (error) {
            logger.error('Failed to detect MongoDB transaction support', { error: error.message });
            return false;
        }
    }

    /**
     * Execute an operation inside a transaction if supported
     * @param {Function} operation - Function receiving the session: (session) => ...
     * @returns {Promise<any>} Result of the operation
     */
    async executeAtomic(operation) {
        const isSupported = await this.supportsTransactions();

        if (!isSupported) {
            return await operation(null);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const result = await operation(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

// Singleton instance
module.exports = new TransactionManager();
