import { useEffect, useState } from 'react';
import { Users, FileText, Heart, MessageCircle, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import analyticsService from '../services/analyticsService';

const DashboardOverview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getOverview();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-purple-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 text-red-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold">Error loading overview</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Users',
      value: overview?.totalUsers || 0,
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Total Posts',
      value: overview?.totalPosts || 0,
      change: '+8.2%',
      trend: 'up',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      name: 'Total Likes',
      value: overview?.totalLikes || 0,
      change: '+15.3%',
      trend: 'up',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500',
      lightBg: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      name: 'Total Comments',
      value: overview?.totalComments || 0,
      change: '+5.7%',
      trend: 'up',
      icon: MessageCircle,
      color: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-500',
      lightBg: 'bg-green-50',
      borderColor: 'border-green-200'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden bg-linear-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl p-10 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white mb-3 flex items-center gap-3">
              Welcome back, Admin! 
              <span className="animate-wave inline-block">👋</span>
            </h1>
            <p className="text-purple-100 text-xl">Here's what's happening with SnapNow today</p>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
              <Zap className="w-16 h-16 text-yellow-300" />
            </div>
          </div>
        </div>

        {/* Animated blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      {/* Stats Grid with Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-gray-100 hover:border-transparent"
            style={{ 
              animationDelay: `${index * 150}ms`,
              animation: 'slideUp 0.6s ease-out forwards'
            }}
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-linear-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-all duration-500`}></div>
            
            {/* Top gradient line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${stat.color}`}></div>
            
            <div className="relative p-6 transform group-hover:scale-105 transition-transform duration-500">
              {/* Icon with modern design */}
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br ${stat.color} shadow-lg transform group-hover:rotate-12 transition-transform duration-500`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Trend badge */}
                {stat.trend === 'up' ? (
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold text-sm shadow-sm">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-semibold text-sm shadow-sm">
                    <TrendingDown className="w-4 h-4" />
                    {stat.change}
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.name}</p>
                <h3 className="text-4xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-linear-to-r group-hover:bg-clip-text group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-500">
                  {stat.value.toLocaleString()}
                </h3>
              </div>

              {/* Decorative elements */}
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-linear-to-br ${stat.color} rounded-full opacity-5 group-hover:opacity-10 transform group-hover:scale-150 transition-all duration-700`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Section with Ultra Modern Design */}
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header with gradient */}
        <div className="relative bg-linear-to-r from-purple-50 via-pink-50 to-purple-50 px-8 py-6 border-b border-gray-200">
          <div className="absolute inset-0 bg-grid-gray-900/[0.04] mask-[linear-gradient(0deg,transparent,black)]"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Engagement Analytics
              </h2>
              <p className="text-gray-600 mt-1">Real-time user interaction insights</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Metrics cards */}
            <div className="space-y-6">
              {/* Likes metric */}
              <div className="group relative bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Avg Likes/Post</h3>
                  </div>
                  
                  <p className="text-5xl font-bold text-blue-600 mb-4">
                    {Number(overview?.avgLikesPerPost || 0).toFixed(1)}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="relative h-3 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${Math.min(Number(overview?.avgLikesPerPost || 0) * 10, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments metric */}
              <div className="group relative bg-linear-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">Avg Comments/Post</h3>
                  </div>
                  
                  <p className="text-5xl font-bold text-purple-600 mb-4">
                    {Number(overview?.avgCommentsPerPost || 0).toFixed(1)}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="relative h-3 bg-purple-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-linear-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${Math.min(Number(overview?.avgCommentsPerPost || 0) * 15, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Circular progress */}
            <div className="lg:col-span-2 flex items-center justify-center relative">
              {/* Background glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-96 h-96 bg-linear-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-10 animate-pulse"></div>
              </div>

              <div className="relative z-10">
                {/* SVG Circle with modern effects */}
                <div className="relative w-80 h-80">
                  <svg className="w-80 h-80 transform -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6">
                          <animate attributeName="stop-color" values="#8b5cf6; #ec4899; #8b5cf6" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#ec4899">
                          <animate attributeName="stop-color" values="#ec4899; #8b5cf6; #ec4899" dur="3s" repeatCount="indefinite" />
                        </stop>
                      </linearGradient>
                      
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#f3e8ff"
                      strokeWidth="6"
                    />
                    
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="6"
                      strokeDasharray={`${Number(overview?.engagementRate || 0) * 2.639}, 263.9`}
                      strokeLinecap="round"
                      filter="url(#glow)"
                      className="transition-all duration-1000 ease-out"
                    />
                    
                    {/* Animated dots */}
                    <circle
                      cx="50"
                      cy="8"
                      r="3"
                      fill="#8b5cf6"
                      className="animate-pulse"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 50 50"
                        to="360 50 50"
                        dur="10s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="inline-block">
                        <div className="text-7xl font-black bg-linear-to-br from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                          {Number(overview?.engagementRate || 0).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-base font-semibold text-gray-700 uppercase tracking-wider">Engagement Rate</div>
                        
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-purple-100 to-pink-100 border-2 border-purple-200">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-bold text-purple-700">+5.2% vs last week</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
