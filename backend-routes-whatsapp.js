const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body, param } = require('express-validator');
const { ROLES } = require('../config/constants');
const WhatsappController = require('../controllers/WhatsappController');

// Initialize controller
const whatsappController = new WhatsappController();

/**
 * Create WhatsApp session for a school
 * @route POST /api/whatsapp/schools/:schoolId/session
 */
router.post(
  "/schools/:schoolId/session",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
    body("label")
      .optional()
      .isString()
      .withMessage("Label must be a string")
      .isLength({ min: 1, max: 100 })
      .withMessage("Label must be between 1 and 100 characters"),
  ]),
  whatsappController.createSession,
);

/**
 * Get WhatsApp session status for a school
 * @route GET /api/whatsapp/schools/:schoolId/status
 */
router.get(
  "/schools/:schoolId/status",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
  ]),
  whatsappController.getSessionStatus,
);

/**
 * Get connection details for a school
 * @route GET /api/whatsapp/schools/:schoolId/connection
 */
router.get(
  "/schools/:schoolId/connection",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
  ]),
  whatsappController.getConnectionDetails,
);

/**
 * Get QR code for WhatsApp session
 * @route GET /api/whatsapp/schools/:schoolId/qr
 */
router.get(
  "/schools/:schoolId/qr",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
  ]),
  whatsappController.getQRCode,
);

/**
 * Disconnect WhatsApp session for a school
 * @route POST /api/whatsapp/schools/:schoolId/disconnect
 */
router.post(
  "/schools/:schoolId/disconnect",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
  ]),
  whatsappController.disconnectSession,
);

/**
 * Send test notification
 * @route POST /api/whatsapp/schools/:schoolId/test-notification
 */
router.post(
  "/schools/:schoolId/test-notification",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
    body("phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^\+[1-9]\d{9,14}$/)
      .withMessage("Phone number must include country code (e.g., +254712345678)"),
    body("message")
      .notEmpty()
      .withMessage("Message is required")
      .isString()
      .withMessage("Message must be a string")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
  ]),
  whatsappController.sendTestNotification,
);

/**
 * Get WhatsApp session history for a school
 * @route GET /api/whatsapp/schools/:schoolId/history
 */
router.get(
  "/schools/:schoolId/history",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
  ]),
  whatsappController.getSessionHistory,
);

/**
 * Refresh QR code for existing session
 * @route POST /api/whatsapp/schools/:schoolId/refresh-qr
 */
router.post(
  "/schools/:schoolId/refresh-qr",
  authenticate,
  authorize([ROLES.SCHOOL_ADMIN]),
  validate([
    param("schoolId")
      .notEmpty()
      .withMessage("School ID is required")
      .isMongoId()
      .withMessage("Invalid school ID"),
  ]),
  whatsappController.refreshQRCode,
);

module.exports = router;
