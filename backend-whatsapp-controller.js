const BaseController = require('./BaseController');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

class WhatsappController extends BaseController {
  /**
   * Constructor
   * @param {Object} whatsappService - WhatsApp service
   * @param {Object} schoolService - School service
   */
  constructor(whatsappService, schoolService) {
    super(whatsappService);
    this.schoolService = schoolService;
  }

  /**
   * Create WhatsApp session for a school
   * @route POST /api/whatsapp/schools/:schoolId/session
   */
  createSession = catchAsync(async (req, res) => {
    const { schoolId } = req.params;
    const { label } = req.body;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Create session
    const result = await this.service.createSession(
      schoolId,
      label || `${req.user.firstName} ${req.user.lastName} - School WhatsApp`
    );

    res.status(201).json({
      success: true,
      message: 'WhatsApp session created successfully',
      data: result
    });
  });

  /**
   * Get WhatsApp session status for a school
   * @route GET /api/whatsapp/schools/:schoolId/status
   */
  getSessionStatus = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Get session status
    const result = await this.service.getSessionStatus(schoolId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Get connection details for a school
   * @route GET /api/whatsapp/schools/:schoolId/connection
   */
  getConnectionDetails = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Get connection details
    const result = await this.service.getConnectionDetails(schoolId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Get QR code for WhatsApp session
   * @route GET /api/whatsapp/schools/:schoolId/qr
   */
  getQRCode = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Get QR code
    const result = await this.service.getQRCode(schoolId);

    if (!result.qr) {
      throw new ApiError('No QR code available. Session may be connected or expired.', 404);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Disconnect WhatsApp session for a school
   * @route POST /api/whatsapp/schools/:schoolId/disconnect
   */
  disconnectSession = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Disconnect session
    const result = await this.service.disconnectSession(schoolId);

    res.status(200).json({
      success: true,
      message: 'WhatsApp session disconnected successfully',
      data: result
    });
  });

  /**
   * Send test notification
   * @route POST /api/whatsapp/schools/:schoolId/test-notification
   */
  sendTestNotification = catchAsync(async (req, res) => {
    const { schoolId } = req.params;
    const { phoneNumber, message } = req.body;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Verify session is connected
    const connectionDetails = await this.service.getConnectionDetails(schoolId);
    if (!connectionDetails.isActive || connectionDetails.connection !== 'connected') {
      throw new ApiError('WhatsApp is not connected. Please connect first.', 400);
    }

    // Send test notification
    const result = await this.service.sendTestNotification(
      schoolId,
      phoneNumber,
      message,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
      data: result
    });
  });

  /**
   * Get WhatsApp session history for a school
   * @route GET /api/whatsapp/schools/:schoolId/history
   */
  getSessionHistory = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Get session history
    const result = await this.service.getSessionHistory(schoolId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  /**
   * Refresh QR code for existing session
   * @route POST /api/whatsapp/schools/:schoolId/refresh-qr
   */
  refreshQRCode = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    // Refresh QR code
    const result = await this.service.refreshQRCode(schoolId);

    res.status(200).json({
      success: true,
      message: 'QR code refreshed successfully',
      data: result
    });
  });

  /**
   * Verify school access for the authenticated user
   * @param {Object} user - Authenticated user
   * @param {String} schoolId - School ID to verify
   * @private
   */
  async verifySchoolAccess(user, schoolId) {
    // For ADMIN role, allow access to any school
    if (user.role === ROLES.ADMIN) {
      return;
    }

    // For SCHOOL_ADMIN, verify they belong to this school
    if (user.role === ROLES.SCHOOL_ADMIN) {
      if (user.schoolId?.toString() !== schoolId) {
        throw new ApiError('Access denied. You can only manage your own school.', 403);
      }
      return;
    }

    // Other roles don't have access
    throw new ApiError('Access denied. Insufficient permissions.', 403);
  }

  /**
   * Get all WhatsApp sessions (Admin only)
   * @route GET /api/whatsapp/sessions
   */
  getAllSessions = catchAsync(async (req, res) => {
    // Only admins can view all sessions
    if (req.user.role !== ROLES.ADMIN) {
      throw new ApiError('Access denied. Admin access required.', 403);
    }

    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: req.query.sort || '-createdAt'
    };

    const sessions = await this.service.getAllSessions(options);

    res.status(200).json({
      success: true,
      data: sessions.docs,
      pagination: {
        total: sessions.totalDocs,
        limit: sessions.limit,
        page: sessions.page,
        pages: sessions.totalPages
      }
    });
  });

  /**
   * Get WhatsApp analytics for a school
   * @route GET /api/whatsapp/schools/:schoolId/analytics
   */
  getAnalytics = catchAsync(async (req, res) => {
    const { schoolId } = req.params;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    const analytics = await this.service.getAnalytics(schoolId);

    res.status(200).json({
      success: true,
      data: analytics
    });
  });

  /**
   * Update WhatsApp settings for a school
   * @route PATCH /api/whatsapp/schools/:schoolId/settings
   */
  updateSettings = catchAsync(async (req, res) => {
    const { schoolId } = req.params;
    const settings = req.body;

    // Verify school exists and user has access
    await this.verifySchoolAccess(req.user, schoolId);

    const result = await this.service.updateSettings(schoolId, settings);

    res.status(200).json({
      success: true,
      message: 'WhatsApp settings updated successfully',
      data: result
    });
  });

  /**
   * Health check for WhatsApp service
   * @route GET /api/whatsapp/health
   */
  healthCheck = catchAsync(async (req, res) => {
    const health = await this.service.healthCheck();

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ...health
      }
    });
  });
}

module.exports = WhatsappController;
