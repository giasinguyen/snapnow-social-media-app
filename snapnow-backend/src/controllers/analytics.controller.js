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

exports.getUsersList = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;
  const result = await analyticsService.getUsersList({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    sortBy,
    sortOrder,
  });
  res.status(200).json({ success: true, data: result });
});

exports.getPostsList = asyncHandler(async (req, res) => {
  const { page, limit, userId, sortBy, sortOrder } = req.query;
  const result = await analyticsService.getPostsList({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    userId,
    sortBy,
    sortOrder,
  });
  res.status(200).json({ success: true, data: result });
});

exports.getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await analyticsService.getUserDetails(userId);
  res.status(200).json({ success: true, data: user });
});

exports.getPostDetails = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await analyticsService.getPostDetails(postId);
  res.status(200).json({ success: true, data: post });
});

exports.getModerationStats = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getModerationStats();
  res.status(200).json({ success: true, data: stats });
});

exports.searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const users = await analyticsService.searchUsers(q);
  res.status(200).json({ success: true, data: users });
});
