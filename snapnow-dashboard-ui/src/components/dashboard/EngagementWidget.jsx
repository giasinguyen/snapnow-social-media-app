import { Activity, Heart, MessageCircle, TrendingUp } from 'lucide-react';

const EngagementWidget = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="animate-pulse p-6">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="flex items-center justify-center mb-6">
            <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const engagementRate = data?.engagementRate || 0;
  const avgLikesPerPost = data?.avgLikesPerPost || 0;
  const avgCommentsPerPost = data?.avgCommentsPerPost || 0;
  const totalEngagements = data?.totalEngagements || 0;

  return (
    <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className="relative bg-linear-to-r from-purple-50 via-pink-50 to-purple-50 px-6 py-5 border-b border-gray-200">
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Engagement Analytics
            </h2>
            <p className="text-gray-600 text-sm">Real-time insights</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Engagement Rate Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#f3e8ff"
                strokeWidth="6"
              />
              
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeDasharray={`${Number(engagementRate) * 2.639}, 263.9`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-black bg-linear-to-br from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {Number(engagementRate).toFixed(1)}%
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mt-1">
                  Engagement
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Avg Likes/Post</span>
            </div>
            <span className="text-xl font-bold text-blue-600">
              {Number(avgLikesPerPost).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Avg Comments/Post</span>
            </div>
            <span className="text-xl font-bold text-purple-600">
              {Number(avgCommentsPerPost).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Total Engagements</span>
            </div>
            <span className="text-xl font-bold text-green-600">
              {totalEngagements.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementWidget;
