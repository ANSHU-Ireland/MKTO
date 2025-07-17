import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Star,
  Globe
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  const stats = [
    {
      title: "Total Portfolio Value",
      value: "$125,890.50",
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
      color: "from-green-400 to-emerald-500"
    },
    {
      title: "Daily P&L",
      value: "$3,245.78",
      change: "+2.8%",
      isPositive: true,
      icon: TrendingUp,
      color: "from-blue-400 to-cyan-500"
    },
    {
      title: "Portfolio Return",
      value: "18.7%",
      change: "+0.9%",
      isPositive: true,
      icon: Target,
      color: "from-purple-400 to-pink-500"
    },
    {
      title: "Risk Score",
      value: "6.2/10",
      change: "-0.3",
      isPositive: false,
      icon: Activity,
      color: "from-orange-400 to-red-500"
    }
  ];

  const chartData = [
    { name: 'Jan', value: 95000, portfolio: 92000 },
    { name: 'Feb', value: 102000, portfolio: 98000 },
    { name: 'Mar', value: 108000, portfolio: 105000 },
    { name: 'Apr', value: 115000, portfolio: 112000 },
    { name: 'May', value: 121000, portfolio: 118000 },
    { name: 'Jun', value: 125890, portfolio: 122500 },
  ];

  const topPerformers = [
    { symbol: 'NVDA', change: '+15.2%', price: '$875.50', isPositive: true },
    { symbol: 'TSLA', change: '+8.7%', price: '$245.80', isPositive: true },
    { symbol: 'AAPL', change: '+5.3%', price: '$175.50', isPositive: true },
    { symbol: 'META', change: '-2.1%', price: '$320.75', isPositive: false },
    { symbol: 'GOOGL', change: '-1.8%', price: '$2850.00', isPositive: false },
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-6 space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center py-12">
        <h1 className="text-5xl font-bold text-gradient mb-4">
          Welcome to MKTO Trading Platform
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          AI-powered portfolio optimization using advanced knapsack algorithms for maximum returns
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="glass-card cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <motion.div variants={itemVariants} className="xl:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Portfolio Value</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(147, 51, 234, 0.5)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8B5CF6" 
                fillOpacity={1} 
                fill="url(#colorPortfolio)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Performers */}
        <motion.div variants={itemVariants} className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Top Performers</h3>
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="space-y-4">
            {topPerformers.map((stock, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stock.symbol}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{stock.symbol}</p>
                    <p className="text-gray-400 text-sm">{stock.price}</p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  stock.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stock.change}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Market Overview */}
      <motion.div variants={itemVariants} className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Market Overview</h3>
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg bg-slate-700/30">
            <div className="text-2xl font-bold text-green-400 mb-2">+1.2%</div>
            <div className="text-gray-400">S&P 500</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-700/30">
            <div className="text-2xl font-bold text-blue-400 mb-2">+0.8%</div>
            <div className="text-gray-400">NASDAQ</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-700/30">
            <div className="text-2xl font-bold text-purple-400 mb-2">+2.1%</div>
            <div className="text-gray-400">Crypto</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary h-16 flex items-center justify-center space-x-3"
        >
          <Target className="w-6 h-6" />
          <span>Optimize Portfolio</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-secondary h-16 flex items-center justify-center space-x-3"
        >
          <BarChart3 className="w-6 h-6" />
          <span>View Analytics</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-success h-16 flex items-center justify-center space-x-3"
        >
          <Zap className="w-6 h-6" />
          <span>Live Trading</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
