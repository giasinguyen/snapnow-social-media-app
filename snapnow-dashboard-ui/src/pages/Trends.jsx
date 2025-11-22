import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Image, Video, Users, ArrowUp, ArrowDown } from 'lucide-react';
import trendsService from '../services/trendsService';

const Trends = () => {
  const [hashtags, setHashtags] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [growingUsers, setGrowingUsers] = useState([]);
  const [engagementLeaders, setEngagementLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hashtagsData, postsData, usersData, engagementData] = await Promise.all([
        trendsService.getTrendingHashtags({ limit: 5 }),
        trendsService.getTopPosts({ limit: 5 }),
        trendsService.getGrowingUsers({ limit: 3 }),
        trendsService.getEngagementLeaders({ limit: 3 }),
      ]);
      setHashtags(hashtagsData.hashtags || []);
      setTopPosts(postsData.posts || []);
      setGrowingUsers(usersData.users || []);
      setEngagementLeaders(engagementData.posts || []);
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Trending Content</h1>
          <p className="text-gray-600 mt-1">Discover what's popular on SnapNow</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Trending Hashtags</h3>
            <Hash className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-center py-8">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {hashtags.length > 0 ? `${hashtags.length} trending hashtags` : 'No trending hashtags yet'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Posts</h3>
            <Image className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-center py-8">
            <Image className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {topPosts.length > 0 ? `${topPosts.length} top posts` : 'No top posts yet'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Viral Videos</h3>
            <Video className="w-6 h-6 text-pink-500" />
          </div>
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No viral videos yet</p>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fastest Growing Users</h3>
          <div className="space-y-3">
            {growingUsers.length > 0 ? (
              growingUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username || `User #${i + 1}`}</p>
                      <p className="text-sm text-gray-500">{user.followersCount || 0} followers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">{user.growthRate || 0}%</span>
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">User #{i}</p>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">0%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Engagement Leaders</h3>
          <div className="space-y-3">
            {engagementLeaders.length > 0 ? (
              engagementLeaders.map((post, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{post.caption?.substring(0, 30) || `Post #${i + 1}`}</p>
                      <p className="text-sm text-gray-500">{post.likes || 0} likes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <ArrowDown className="w-4 h-4 rotate-180" />
                    <span className="text-sm font-semibold">{post.engagement || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Post #{i}</p>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <ArrowDown className="w-4 h-4 rotate-180" />
                    <span className="text-sm font-semibold">0</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Trends Analytics</h3>
        <p className="text-gray-600">Advanced trending content analytics coming soon. Track hashtags, viral posts, and user growth trends.</p>
      </div>
    </div>
  );
};

export default Trends;
