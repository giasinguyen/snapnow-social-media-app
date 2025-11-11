const analyticsService = require('../services/analytics.service');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getOverview = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getDashboardOverview();
  res.status(200).json({ success: true, data: overview });
});

exports.getUserGrowth = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const growth = await analyticsService.getUserGrowth(parseInt(days));
  res.status(200).json({ success: true, data: growth });
});

exports.getPostActivity = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const activity = await analyticsService.getPostActivity(parseInt(days));
  res.status(200).json({ success: true, data: activity });
});

exports.getEngagement = asyncHandler(async (req, res) => {
  const engagement = await analyticsService.getEngagementMetrics();
  res.status(200).json({ success: true, data: engagement });
});

exports.getTopUsers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const users = await analyticsService.getTopUsers(parseInt(limit));
  res.status(200).json({ success: true, data: users });
});

exports.getTopPosts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const posts = await analyticsService.getTopPosts(parseInt(limit));
  res.status(200).json({ success: true, data: posts });
});

exports.getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const activity = await analyticsService.getRecentActivity(parseInt(limit));
  res.status(200).json({ success: true, data: activity });
});
