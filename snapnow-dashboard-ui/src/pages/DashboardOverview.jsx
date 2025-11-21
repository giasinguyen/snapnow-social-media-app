import { useEffect, useState } from 'react';
import { Users, FileText, Heart, MessageCircle, Zap } from 'lucide-react';
import analyticsService from '../services/analyticsService';
import StatCard from '../components/dashboard/StatCard';
import UserGrowthChart from '../components/dashboard/UserGrowthChart';
import TopUsersList from '../components/dashboard/TopUsersList';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import EngagementWidget from '../components/dashboard/EngagementWidget';

const DashboardOverview = () => {
  const [overview, setOverview] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, activityData, growthData, usersData] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getRecentActivity(10),
        analyticsService.getUserGrowth(7),
        analyticsService.getTopUsers(5),
      ]);
      
      setOverview(overviewData);
      setRecentActivity(activityData);
      setUserGrowth(growthData);
      setTopUsers(usersData);
    } catch (err) {
      console.error('Error loading overview:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 text-red-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold">Error loading dashboard</h3>
            <p className="text-sm">{error}</p>
            <button 
              onClick={loadOverview}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: overview?.totalUsers || 0,
      change: overview?.userGrowthRate || '+0%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      description: 'Registered users'
    },
    {
      name: 'Total Posts',
      value: overview?.totalPosts || 0,
      change: overview?.postGrowthRate || '+0%',
      trend: 'up',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      description: 'Content shared'
    },
    {
      name: 'Total Likes',
      value: overview?.totalLikes || 0,
      change: overview?.likeGrowthRate || '+0%',
      trend: 'up',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      description: 'Reactions received'
    },
    {
      name: 'Total Comments',
      value: overview?.totalComments || 0,
      change: overview?.commentGrowthRate || '+0%',
      trend: 'up',
      icon: MessageCircle,
      color: 'from-green-500 to-emerald-500',
      description: 'User discussions'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl p-10 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white mb-3 flex items-center gap-3">
              Welcome back, Admin! 
              <span className="inline-block">👋</span>
            </h1>
            <p className="text-purple-100 text-xl">Here's what's happening with SnapNow today</p>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
              <Zap className="w-16 h-16 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Modern Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded-2xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.name} stat={stat} index={index} />
          ))}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserGrowthChart data={userGrowth} loading={loading} />
        <TopUsersList users={topUsers} loading={loading} />
      </div>

      {/* Recent Activity & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={recentActivity} loading={loading} />
        <EngagementWidget data={overview} loading={loading} />
      </div>
    </div>
  );
};

export default DashboardOverview;
