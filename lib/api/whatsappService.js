import apiClient from "./apiClient";

/**
 * WhatsApp API service for school WhatsApp integration
 */
const whatsappService = {
  /**
   * Create a WhatsApp session for a school
   * @param {String} schoolId - School ID
   * @param {String} label - Session label
   * @returns {Promise<Object>} Session creation response
   */
  createSession: async (schoolId, label = "School WhatsApp Session") => {
    const response = await apiClient.post(
      `/whatsapp/session`,
      { label }
    );
    return response.data;
  },

  /**
   * Get WhatsApp session status for a school or specific session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Session status response
   */
  getSessionStatus: async (sessionId) => {
    const response = await apiClient.get(`/whatsapp/schools/${sessionId}/status`);
    return response.data;
  },

  /**
   * Get connection details for a session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Connection details
   */
  getConnectionDetails: async (sessionId) => {
    const response = await apiClient.get(
      `/whatsapp/schools/${sessionId}/connection`
    );
    return response.data;
  },

  /**
   * Get QR code for WhatsApp session
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} QR code response
   */
  getQRCode: async (sessionId) => {
    const response = await apiClient.get(`/whatsapp/schools/${sessionId}/qr`);
    return response.data;
  },

  /**
   * Get all WhatsApp sessions for a school
   * @returns {Promise<Object>} Sessions response
   */
  getSessions: async () => {
    const response = await apiClient.get(`/whatsapp/sessions`);
    return response.data;
  },

  /**
   * Disconnect WhatsApp session for a school
   * @param {String} sessionId - Session ID
   * @returns {Promise<Object>} Disconnect response
   */
  disconnectSession: async (sessionId) => {
    const response = await apiClient.post(
      `/whatsapp/schools/${sessionId}/disconnect` 
    );
    return response.data;
  },

  /**
   * Send test notification
   * @param {String} sessionId - Session ID
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - Message to send
   * @returns {Promise<Object>} Send response
   */
  sendTestNotification: async (sessionId, phoneNumber, message) => {
    const response = await apiClient.post(
      `/whatsapp/schools/${sessionId}/test-notification`,
      {
        phoneNumber,
        message,
      }
    );
    return response.data;
  },

  /**
   * Check if school has active WhatsApp connection
   * @param {String} schoolId - School ID
   * @returns {Promise<Boolean>} Connection status
   */
  // isConnected: async (schoolId) => {
  //   try {
  //     const response = await whatsappService.getConnectionDetails(schoolId);
  //     return response.data?.connection === "connected" && response.data?.isActive;
  //   } catch (error) {
  //     console.error("Error checking WhatsApp connection:", error);
  //     return false;
  //   }
  // },

  /**
   * Get formatted connection status for UI
   * @param {String} schoolId - School ID
   * @returns {Promise<Object>} Formatted status
   */
  // getFormattedStatus: async (schoolId) => {
  //   try {
  //     const response = await whatsappService.getConnectionDetails(schoolId);
  //     const data = response.data;

  //     return {
  //       isConnected: data.connection === "connected" && data.isActive,
  //       status: data.status,
  //       connectionText: data.connection === "connected" ? "Connected" : "Disconnected",
  //       statusText: data.status === "OPEN" ? "Active" : data.status || "Inactive",
  //       sessionId: data.sessionId,
  //       connectedAt: data.connectedAt,
  //       lastUpdated: data.lastUpdated,
  //       hasActiveSession: data.hasActiveSession,
  //     };
  //   } catch (error) {
  //     console.error("Error getting formatted status:", error);
  //     return {
  //       isConnected: false,
  //       status: "DISCONNECTED",
  //       connectionText: "Disconnected",
  //       statusText: "Inactive",
  //       sessionId: null,
  //       connectedAt: null,
  //       lastUpdated: null,
  //       hasActiveSession: false,
  //     };
  //   }
  // },

  /**
   * Poll for session status changes
   * @param {String} schoolId - School ID
   * @param {Function} callback - Callback function for status updates
   * @param {Number} interval - Polling interval in milliseconds (default: 5000)
   * @returns {Function} Stop polling function
   */
  pollSessionStatus: (schoolId, callback, interval = 5000) => {
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const status = await whatsappService.getFormattedStatus(schoolId);
        callback(status);

        // Continue polling if still connecting
        if (isPolling && status.status === "CONNECTING") {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error("Error polling session status:", error);
        callback({
          isConnected: false,
          status: "ERROR",
          connectionText: "Error",
          statusText: "Connection Error",
          error: error.message,
        });
      }
    };

    // Start polling
    poll();

    // Return stop function
    return () => {
      isPolling = false;
    };
  },

  /**
   * Validate phone number format
   * @param {String} phoneNumber - Phone number to validate
   * @returns {Object} Validation result
   */
  validatePhoneNumber: (phoneNumber) => {
    // Remove spaces, dashes, and parentheses
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Check if it starts with + and has 10-15 digits
    const isValid = /^\+[1-9]\d{9,14}$/.test(cleaned);

    return {
      isValid,
      cleaned,
      message: isValid
        ? "Valid phone number"
        : "Phone number must include country code (e.g., +254712345678)",
    };
  },

  /**
   * Format error messages for UI display
   * @param {Error} error - Error object
   * @returns {String} Formatted error message
   */
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message) {
      return error.message;
    }

    return "An unexpected error occurred";
  },
};

export default whatsappService;
