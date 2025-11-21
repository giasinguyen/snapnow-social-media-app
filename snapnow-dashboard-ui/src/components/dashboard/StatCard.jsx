import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ stat, index }) => {
  return (
    <div
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-gray-100 hover:border-transparent"
      style={{ 
        animationDelay: `${index * 150}ms`,
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-all duration-500`}></div>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}></div>
      
      <div className="relative p-6 transform group-hover:scale-105 transition-transform duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg transform group-hover:rotate-12 transition-transform duration-500`}>
            <stat.icon className="w-8 h-8 text-white" />
          </div>
          
          {stat.change && (
            <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${
              stat.trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            } font-semibold text-sm shadow-sm`}>
              {stat.trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {stat.change}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.name}</p>
          <h3 className="text-4xl font-bold text-gray-900">
            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
          </h3>
          {stat.description && (
            <p className="text-xs text-gray-500">{stat.description}</p>
          )}
        </div>

        <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full opacity-5 group-hover:opacity-10 transform group-hover:scale-150 transition-all duration-700`}></div>
      </div>
    </div>
  );
};

export default StatCard;
