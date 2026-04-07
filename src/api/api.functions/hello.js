// GET /api/hello
// Health check / test endpoint
exports.main = async (context, sendResponse) => {
  sendResponse({
    statusCode: 200,
    body: {
      status: "ok",
      portal: context.portalId,
      timestamp: new Date().toISOString()
    }
  });
};
