const AuditLog = require('../models/AuditLog');

/**
 * createAuditEntry — logs a write action to the AuditLog collection
 * Called in all controllers that mutate data.
 * @param {Object} options
 * @param {string} options.action - enum value from AuditLog schema
 * @param {Object} options.performedBy - user object from req.user
 * @param {string} options.targetModel - e.g. 'Student'
 * @param {string} options.targetId - MongoDB ObjectId of the affected document
 * @param {string} options.details - human-readable summary
 * @param {Object} options.req - Express request (for IP/user-agent)
 */
const createAuditEntry = async ({ action, performedBy, targetModel, targetId, details, req }) => {
  try {
    await AuditLog.create({
      action,
      performedBy: performedBy._id || performedBy,
      targetModel,
      targetId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    //Audit logging should never crash the main operation
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { createAuditEntry };
