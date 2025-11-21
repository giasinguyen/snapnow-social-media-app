import { Users, BarChart3 } from 'lucide-react';

const TopUsersList = ({ users, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/3"></div>
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
          <h2 className="text-xl font-bold text-gray-900">Top Users</h2>
          <p className="text-gray-600 text-sm mt-1">By followers</p>
        </div>
        <div className="p-2 bg-purple-100 rounded-lg">
          <BarChart3 className="w-5 h-5 text-purple-600" />
        </div>
      </div>
      
      <div className="space-y-4">
        {users && users.length > 0 ? users.map((user, index) => (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
              index === 0 ? 'bg-yellow-100 text-yellow-600' :
              index === 1 ? 'bg-gray-100 text-gray-600' :
              index === 2 ? 'bg-orange-100 text-orange-600' :
              'bg-purple-100 text-purple-600'
            }`}>
              {index + 1}
            </div>
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username || user.displayName}&background=random`} 
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${user.username || user.displayName || 'User'}&background=random`;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.username || user.displayName || 'Unknown User'}</p>
              <p className="text-xs text-gray-500">{user.followersCount || 0} followers</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No users yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUsersList;
