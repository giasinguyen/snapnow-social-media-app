const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all notifications
 * @route   GET /api/notifications
 * @access  Private/Admin
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { page = 1, limit = 20 } = req.query;

  let query = db.collection('notifications').orderBy('createdAt', 'desc');

  // Get total count
  const totalSnapshot = await query.count().get();
  const total = totalSnapshot.data().count;

  // Apply pagination
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(parseInt(limit)).offset(offset).get();

  const notifications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get notification statistics
 * @route   GET /api/notifications/stats
 * @access  Private/Admin
 */
exports.getStats = asyncHandler(async (req, res) => {
  const db = getFirestore();

  const [totalSnap, deliveredSnap, openedSnap] = await Promise.all([
    db.collection('notifications').count().get(),
    db.collection('notifications').where('status', '==', 'delivered').count().get(),
    db.collection('notifications').where('status', '==', 'opened').count().get(),
  ]);

  const total = totalSnap.data().count;
  const delivered = deliveredSnap.data().count;
  const opened = openedSnap.data().count;
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      totalSent: total,
      delivered,
      opened,
      openRate: `${openRate}%`,
    },
  });
});

/**
 * @desc    Send notification to users
 * @route   POST /api/notifications/send
 * @access  Private/Admin
 */
exports.sendNotification = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { title, message, targetUsers = 'all' } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required',
    });
  }

  // Get target users
  let userIds = [];
  if (targetUsers === 'all') {
    const usersSnapshot = await db.collection('users').get();
    userIds = usersSnapshot.docs.map(doc => doc.id);
  } else if (Array.isArray(targetUsers)) {
    userIds = targetUsers;
  }

  // Create notifications for each user
  const batch = db.batch();
  const timestamp = new Date();

  userIds.forEach(userId => {
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, {
      userId,
      title,
      message,
      status: 'sent',
      createdAt: timestamp,
    });
  });

  await batch.commit();

  res.json({
    success: true,
    message: `Notification sent to ${userIds.length} users`,
    data: {
      recipientCount: userIds.length,
    },
  });
});
