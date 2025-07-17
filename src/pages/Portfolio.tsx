import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  BarChart3,
  Plus,
  Minus,
  Eye,
  Settings,
  RefreshCw,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PortfolioPosition {
  symbol: string;
  quantity: number;
  current_price: number;
  market_value: number;
  pnl: number;
  weight: number;
  avg_cost: number;
}

const Portfolio = () => {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  // Mock portfolio data
  const mockPositions: PortfolioPosition[] = [
    {
      symbol: 'AAPL',
      quantity: 45.5,
      current_price: 175.50,
      market_value: 7985.25,
      pnl: 1245.30,
      weight: 0.32,
      avg_cost: 148.15
    },
    {
      symbol: 'GOOGL',
      quantity: 2.5,
      current_price: 2850.00,
      market_value: 7125.00,
      pnl: -325.75,
      weight: 0.28,
      avg_cost: 2980.30
    },
    {
      symbol: 'MSFT',
      quantity: 18.0,
      current_price: 385.20,
      market_value: 6933.60,
      pnl: 892.40,
      weight: 0.27,
      avg_cost: 335.65
    },
    {
      symbol: 'TSLA',
      quantity: 8.2,
      current_price: 245.80,
      market_value: 2015.56,
      pnl: -184.22,
      weight: 0.08,
      avg_cost: 268.32
    },
    {
      symbol: 'NVDA',
      quantity: 1.5,
      current_price: 875.50,
      market_value: 1313.25,
      pnl: 425.18,
      weight: 0.05,
      avg_cost: 592.05
    }
  ];

  const portfolioSummary = {
    total_value: mockPositions.reduce((sum, pos) => sum + pos.market_value, 0),
    total_pnl: mockPositions.reduce((sum, pos) => sum + pos.pnl, 0),
    total_cost: mockPositions.reduce((sum, pos) => sum + (pos.avg_cost * pos.quantity), 0),
    num_positions: mockPositions.length
  };

  portfolioSummary.total_return = portfolioSummary.total_pnl / portfolioSummary.total_cost;

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

  const pieData = mockPositions.map((position, index) => ({
    name: position.symbol,
    value: position.market_value,
    weight: position.weight,
    color: COLORS[index % COLORS.length]
  }));

  // Mock historical data
  const historicalData = [
    { date: '1W ago', value: 24500 },
    { date: '6D ago', value: 24750 },
    { date: '5D ago', value: 24200 },
    { date: '4D ago', value: 24900 },
    { date: '3D ago', value: 25100 },
    { date: '2D ago', value: 25300 },
    { date: '1D ago', value: 25200 },
    { date: 'Today', value: portfolioSummary.total_value }
  ];

  useEffect(() => {
    setTimeout(() => {
      setPositions(mockPositions);
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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Portfolio Overview</h1>
          <p className="text-gray-400">Track your investments and performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Portfolio Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="glass-card cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-green-400 text-sm font-medium flex items-center">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +{((portfolioSummary.total_return) * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-white">${portfolioSummary.total_value.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="glass-card cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg">
              {portfolioSummary.total_pnl >= 0 ? (
                <TrendingUp className="w-6 h-6 text-white" />
              ) : (
                <TrendingDown className="w-6 h-6 text-white" />
              )}
            </div>
            <div className={`text-sm font-medium flex items-center ${
              portfolioSummary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {portfolioSummary.total_pnl >= 0 ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              ${Math.abs(portfolioSummary.total_pnl).toFixed(2)}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${
              portfolioSummary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              ${portfolioSummary.total_pnl.toLocaleString()}
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="glass-card cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-purple-400 text-sm font-medium">
              ROI
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Return on Investment</p>
            <p className={`text-2xl font-bold ${
              portfolioSummary.total_return >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(portfolioSummary.total_return * 100).toFixed(2)}%
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          className="glass-card cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg">
              <PieChartIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-orange-400 text-sm font-medium">
              Positions
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Positions</p>
            <p className="text-2xl font-bold text-white">{portfolioSummary.num_positions}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Portfolio Performance & Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Portfolio Performance Chart */}
        <motion.div variants={itemVariants} className="xl:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
            <div className="flex items-center space-x-2">
              {['1D', '1W', '1M', '3M', '1Y'].map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                    selectedTimeframe === timeframe
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(147, 51, 234, 0.5)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Portfolio Value']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8B5CF6" 
                fillOpacity={1} 
                fill="url(#colorValue)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Asset Allocation Pie Chart */}
        <motion.div variants={itemVariants} className="glass-card">
          <h3 className="text-xl font-semibold text-white mb-6">Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, weight }) => `${name} ${(weight * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(147, 51, 234, 0.5)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Positions Table */}
      <motion.div variants={itemVariants} className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Portfolio Positions</h3>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary text-sm"
            >
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-sm"
            >
              Rebalance
            </motion.button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Quantity</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Cost</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Current Price</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Market Value</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Weight</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <motion.tr
                  key={position.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                  className="border-b border-gray-700/50 transition-colors duration-300"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                           style={{ background: COLORS[index % COLORS.length] }}>
                        <span className="text-white font-bold text-sm">{position.symbol}</span>
                      </div>
                      <span className="text-white font-medium">{position.symbol}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-white">{position.quantity.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-gray-300">${position.avg_cost.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-white">${position.current_price.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right text-white font-medium">${position.market_value.toLocaleString()}</td>
                  <td className={`py-4 px-4 text-right font-medium ${
                    position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-300">{(position.weight * 100).toFixed(1)}%</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors duration-300"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors duration-300"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors duration-300"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Portfolio;
