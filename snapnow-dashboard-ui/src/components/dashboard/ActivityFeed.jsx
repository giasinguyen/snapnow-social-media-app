import { FileText, MessageCircle, Heart, Activity, Clock } from 'lucide-react';

const ActivityFeed = ({ activities, loading }) => {
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4" />;
      case 'comment': return <MessageCircle className="w-4 h-4" />;
      case 'like': return <Heart className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'post': return 'bg-purple-100 text-purple-600';
      case 'comment': return 'bg-green-100 text-green-600';
      case 'like': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityText = (type) => {
    switch (type) {
      case 'post': return 'New post created';
      case 'comment': return 'New comment posted';
      case 'like': return 'Post liked';
      default: return 'Activity';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <p className="text-gray-600 text-sm mt-1">Latest platform updates</p>
        </div>
        <div className="p-3 bg-green-100 rounded-xl">
          <Clock className="w-6 h-6 text-green-600" />
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {activities && activities.length > 0 ? activities.map((activity, index) => (
          <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {getActivityText(activity.type)}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activity.username || activity.data?.username || 'User'}
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatActivityTime(activity.createdAt)}
            </span>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
