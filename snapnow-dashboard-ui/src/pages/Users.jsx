import { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, Eye, MoreVertical, ChevronLeft, ChevronRight, Ban, Shield, ShieldCheck, CheckCircle } from 'lucide-react';
import analyticsService from '../services/analyticsService';
import userService from '../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getUsersList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const userDetails = await analyticsService.getUserDetails(userId);
      setSelectedUser(userDetails);
      setShowUserModal(true);
    } catch (err) {
      console.error('Error loading user details:', err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) {
      alert('Please provide a reason for banning this user');
      return;
    }
    
    try {
      setActionLoading(true);
      await userService.updateUserStatus(selectedUser.id, 'banned', banReason);
      
      // Update local state
      setSelectedUser({ ...selectedUser, status: 'banned', banReason });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'banned' } : u));
      
      setShowBanModal(false);
      setBanReason('');
      alert('User banned successfully');
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!confirm('Are you sure you want to unban this user?')) return;
    
    try {
      setActionLoading(true);
      await userService.updateUserStatus(selectedUser.id, 'active');
      
      // Update local state
      setSelectedUser({ ...selectedUser, status: 'active', banReason: null });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: 'active' } : u));
      
      alert('User unbanned successfully');
    } catch (err) {
      console.error('Error unbanning user:', err);
      alert('Failed to unban user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async (newRole) => {
    const roleAction = newRole === 'admin' ? 'promote to Admin' : 'demote to User';
    if (!confirm(`Are you sure you want to ${roleAction}?`)) return;
    
    try {
      setActionLoading(true);
      await userService.updateUserRole(selectedUser.id, newRole);
      
      // Update local state
      setSelectedUser({ ...selectedUser, role: newRole, isAdmin: newRole === 'admin' });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      
      alert(`User role updated to ${newRole} successfully`);
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor user accounts</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700">
            Error: {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Followers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Following
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.fullName || 'No name'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.followersCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.followingCount || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isBanned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <UserX className="w-3 h-3 mr-1" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="text-purple-600 hover:text-purple-900 inline-flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-backdrop" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <img
                  src={selectedUser.profileImage || `https://ui-avatars.com/api/?name=${selectedUser.username}&background=random`}
                  alt={selectedUser.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.username}</h3>
                    {selectedUser.role === 'admin' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Admin
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      selectedUser.status === 'banned' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedUser.status === 'banned' ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedUser.fullName || 'No name'}</p>
                  <p className="text-gray-500 text-sm mt-1">{selectedUser.email || 'No email'}</p>
                </div>
              </div>

              {/* Ban Reason */}
              {selectedUser.status === 'banned' && selectedUser.banReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-semibold text-red-900 mb-1 text-sm">Ban Reason</h4>
                  <p className="text-red-700 text-sm">{selectedUser.banReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                {selectedUser.status === 'active' ? (
                  <button
                    onClick={() => setShowBanModal(true)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban className="w-4 h-4" />
                    Ban User
                  </button>
                ) : (
                  <button
                    onClick={handleUnbanUser}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Unban User
                  </button>
                )}

                {selectedUser.role !== 'admin' ? (
                  <button
                    onClick={() => handleUpdateRole('admin')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Make Admin
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateRole('user')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="w-4 h-4" />
                    Remove Admin
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.postsCount || 0}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedUser.followersCount || 0}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-pink-600">{selectedUser.followingCount || 0}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                  <p className="text-gray-600">{selectedUser.bio}</p>
                </div>
              )}

              {/* Recent Posts */}
              {selectedUser.recentPosts && selectedUser.recentPosts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Posts</h4>
                  <div className="space-y-3">
                    {selectedUser.recentPosts.map((post) => (
                      <div key={post.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 line-clamp-2">{post.caption || 'No caption'}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>❤️ {post.likes || 0} likes</span>
                          <span>💬 {post.commentsCount || 0} comments</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-60 modal-backdrop" onClick={() => setShowBanModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Ban User</h2>
                <button
                  onClick={() => setShowBanModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                You are about to ban <span className="font-semibold">{selectedUser?.username}</span>. 
                Please provide a reason:
              </p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason (e.g., spam, inappropriate content, harassment)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="4"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBanUser}
                  disabled={actionLoading || !banReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Banning...' : 'Confirm Ban'}
                </button>
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
