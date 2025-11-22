const { getFirestore } = require('../config/firebase.admin');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all reports
 * @route   GET /api/reports
 * @access  Private/Admin
 */
exports.getReports = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { page = 1, limit = 20, status = 'all', type = 'all' } = req.query;

  let query = db.collection('reports');

  // Filter by status
  if (status !== 'all') {
    query = query.where('status', '==', status);
  }

  // Filter by type
  if (type !== 'all') {
    query = query.where('type', '==', type);
  }

  // Sort by creation date
  query = query.orderBy('createdAt', 'desc');

  // Get total count
  const totalSnapshot = await query.count().get();
  const total = totalSnapshot.data().count;

  // Apply pagination
  const offset = (page - 1) * limit;
  const snapshot = await query.limit(parseInt(limit)).offset(offset).get();

  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.status(200).json({
    success: true,
    data: {
      reports,
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
 * @desc    Get report statistics
 * @route   GET /api/reports/stats
 * @access  Private/Admin
 */
exports.getReportStats = asyncHandler(async (req, res) => {
  const db = getFirestore();

  const [pendingSnap, reviewingSnap, resolvedSnap, totalSnap] = await Promise.all([
    db.collection('reports').where('status', '==', 'pending').count().get(),
    db.collection('reports').where('status', '==', 'reviewing').count().get(),
    db.collection('reports').where('status', '==', 'resolved').count().get(),
    db.collection('reports').count().get(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pending: pendingSnap.data().count,
      reviewing: reviewingSnap.data().count,
      resolved: resolvedSnap.data().count,
      total: totalSnap.data().count,
    },
  });
});

/**
 * @desc    Update report status
 * @route   PATCH /api/reports/:id/status
 * @access  Private/Admin
 */
exports.updateReportStatus = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const { id } = req.params;
  const { status } = req.body;

  const reportRef = db.collection('reports').doc(id);
  await reportRef.update({
    status,
    updatedAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: 'Report status updated successfully',
  });
});
