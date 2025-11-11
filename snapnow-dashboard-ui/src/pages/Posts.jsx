import { useEffect, useState } from 'react';
import { Search, Heart, MessageCircle, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import analyticsService from '../services/analyticsService';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getPostsList({
        page: currentPage,
        limit: 20,
      });
      setPosts(result.posts);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [currentPage]);

  const handleViewPost = async (postId) => {
    try {
      const postDetails = await analyticsService.getPostDetails(postId);
      setSelectedPost(postDetails);
      setShowPostModal(true);
    } catch (err) {
      console.error('Error loading post details:', err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && posts.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Posts Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage user posts</p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700">
            Error: {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Post Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.caption || 'Post'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Post Info */}
                  <div className="p-3 space-y-2">
                    {/* User */}
                    <div className="flex items-center gap-2">
                      <img
                        src={post.user?.profileImage || `https://ui-avatars.com/api/?name=${post.user?.username || 'User'}&background=random`}
                        alt={post.user?.username || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.user?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-sm text-gray-700 line-clamp-2">{post.caption}</p>
                    )}

                    {/* Engagement */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.commentsCount || 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => handleViewPost(post.id)}
                        className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> posts
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

      {/* Post Details Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Post Details</h2>
                <button
                  onClick={() => setShowPostModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Post Image */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {selectedPost.imageUrl ? (
                    <img
                      src={selectedPost.imageUrl}
                      alt={selectedPost.caption || 'Post'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Post Info */}
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <img
                      src={selectedPost.user?.profileImage || `https://ui-avatars.com/api/?name=${selectedPost.user?.username || 'User'}&background=random`}
                      alt={selectedPost.user?.username || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{selectedPost.user?.username || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{selectedPost.user?.followersCount || 0} followers</p>
                    </div>
                  </div>

                  {/* Caption */}
                  {selectedPost.caption && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Caption</h3>
                      <p className="text-gray-700">{selectedPost.caption}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <Heart className="w-5 h-5" />
                        <span className="font-semibold">Likes</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{selectedPost.likesCount || 0}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-semibold">Comments</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{selectedPost.commentsCount || 0}</div>
                    </div>
                  </div>

                  {/* Posted Date */}
                  <div className="text-sm text-gray-500">
                    Posted on {formatDate(selectedPost.createdAt)}
                  </div>

                  {/* Recent Comments */}
                  {selectedPost.recentComments && selectedPost.recentComments.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Recent Comments</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedPost.recentComments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <img
                                src={comment.user?.profileImage || `https://ui-avatars.com/api/?name=${comment.user?.username || 'User'}&background=random`}
                                alt={comment.user?.username || 'User'}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{comment.user?.username || 'Unknown'}</p>
                                <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(comment.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts;
