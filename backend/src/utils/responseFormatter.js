class ResponseFormatter {
  static success(data, message, statusCode) {
    const msg = message || 'Success';
    const code = statusCode || 200;

    return {
      success: true,
      statusCode: code,
      message: msg,
      data
    };
  }

  static error(message, statusCode, code, details) {
    const msg = message || 'Internal server error';
    const status = statusCode || 500;
    const errCode = code || 'INTERNAL_ERROR';

    const response = {
      success: false,
      statusCode: status,
      error: {
        code: errCode,
        message: msg
      }
    };

    if (details) {
      response.error.details = details;
    }

    return response;
  }
}

module.exports = ResponseFormatter;
