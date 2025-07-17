import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Sliders,
  BarChart3,
  PieChart,
  Eye,
  Download
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  expected_return: number;
  risk: number;
}

interface OptimizationRequest {
  budget: number;
  assets: string[];
  risk_tolerance: number;
}

interface OptimizationResult {
  selected_assets: Array<{
    symbol: string;
    price: number;
    expected_return: number;
    risk: number;
    weight: number;
    shares: number;
    investment: number;
  }>;
  total_value: number;
  expected_return: number;
  total_risk: number;
  allocation: Record<string, number>;
  sharpe_ratio: number;
  diversification_score: number;
}

const Optimize = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [budget, setBudget] = useState(50000);
  const [riskTolerance, setRiskTolerance] = useState(0.6);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Mock assets data
  const mockAssets: Asset[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.50, expected_return: 0.12, risk: 0.18 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2850.00, expected_return: 0.15, risk: 0.22 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 385.20, expected_return: 0.11, risk: 0.16 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, expected_return: 0.25, risk: 0.35 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3200.00, expected_return: 0.14, risk: 0.25 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.50, expected_return: 0.28, risk: 0.40 },
    { symbol: 'META', name: 'Meta Platforms', price: 320.75, expected_return: 0.18, risk: 0.28 },
    { symbol: 'BTC', name: 'Bitcoin', price: 42000.00, expected_return: 0.45, risk: 0.65 },
  ];

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B', '#EC4899', '#6366F1'];

  useEffect(() => {
    setAssets(mockAssets);
  }, []);

  const handleOptimize = async () => {
    if (selectedAssets.length === 0) {
      alert('Please select at least one asset');
      return;
    }

    setIsOptimizing(true);
    
    // Simulate API call
    setTimeout(() => {
      const selectedAssetData = assets.filter(asset => selectedAssets.includes(asset.symbol));
      
      // Mock knapsack optimization
      const optimizedAssets = selectedAssetData.map(asset => {
        const efficiency = (asset.expected_return * (1 - asset.risk * (1 - riskTolerance))) / asset.price;
        return { ...asset, efficiency };
      }).sort((a, b) => b.efficiency - a.efficiency);

      let remainingBudget = budget;
      const selectedForPortfolio = [];
      const allocation: Record<string, number> = {};

      for (const asset of optimizedAssets) {
        if (asset.price <= remainingBudget) {
          const maxShares = Math.floor(remainingBudget / asset.price);
          const shares = Math.max(1, Math.floor(maxShares * 0.7)); // Use 70% of max possible
          const investment = shares * asset.price;
          
          selectedForPortfolio.push({
            ...asset,
            shares,
            investment,
            weight: investment / budget
          });
          
          allocation[asset.symbol] = investment;
          remainingBudget -= investment;
        }
      }

      const totalInvestment = Object.values(allocation).reduce((sum, val) => sum + val, 0);
      const expectedReturn = selectedForPortfolio.reduce((sum, asset) => 
        sum + (asset.expected_return * asset.weight), 0);
      const totalRisk = selectedForPortfolio.reduce((sum, asset) => 
        sum + (asset.risk * asset.weight), 0);

      const result: OptimizationResult = {
        selected_assets: selectedForPortfolio,
        total_value: totalInvestment,
        expected_return: expectedReturn,
        total_risk: totalRisk,
        allocation,
        sharpe_ratio: expectedReturn / totalRisk,
        diversification_score: selectedForPortfolio.length / selectedAssets.length
      };

      setOptimizationResult(result);
      setIsOptimizing(false);
    }, 2000);
  };

  const toggleAssetSelection = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-6 space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center py-8">
        <h1 className="text-4xl font-bold text-gradient mb-4">Portfolio Optimization</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Use our advanced knapsack algorithm to optimize your portfolio for maximum risk-adjusted returns
        </p>
      </motion.div>

      {/* Optimization Controls */}
      <motion.div variants={itemVariants} className="glass-card">
        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <Sliders className="w-6 h-6 mr-3 text-purple-400" />
          Optimization Parameters
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Budget
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="input-field pl-10"
                placeholder="Enter budget amount"
              />
            </div>
            <p className="text-xs text-gray-500">Total amount available for investment</p>
          </div>

          {/* Risk Tolerance */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Risk Tolerance: {Math.round(riskTolerance * 100)}%
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Conservative</span>
                <span>Moderate</span>
                <span>Aggressive</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Higher values favor high-return assets</p>
          </div>

          {/* Optimize Button */}
          <div className="flex items-end">
            <motion.button
              onClick={handleOptimize}
              disabled={isOptimizing || selectedAssets.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full btn-primary flex items-center justify-center space-x-3 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5" />
                  <span>Optimize Portfolio</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Asset Selection */}
      <motion.div variants={itemVariants} className="glass-card">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-3 text-blue-400" />
          Select Assets ({selectedAssets.length} selected)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {assets.map((asset) => (
            <motion.div
              key={asset.symbol}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleAssetSelection(asset.symbol)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedAssets.includes(asset.symbol)
                  ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30'
                  : 'border-gray-600 bg-slate-700/30 hover:border-gray-500 hover:bg-slate-700/50'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-bold text-white mb-1">{asset.symbol}</div>
                <div className="text-xs text-gray-400 mb-2">${asset.price.toLocaleString()}</div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">{(asset.expected_return * 100).toFixed(0)}%</span>
                  <span className="text-orange-400">{(asset.risk * 100).toFixed(0)}%</span>
                </div>
                {selectedAssets.includes(asset.symbol) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2"
                  >
                    <CheckCircle className="w-4 h-4 text-purple-400 mx-auto" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Optimization Results */}
      {optimizationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card text-center"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg mx-auto w-fit mb-3">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-gray-400 mb-1">Total Investment</div>
              <div className="text-xl font-bold text-white">${optimizationResult.total_value.toLocaleString()}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card text-center"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg mx-auto w-fit mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-gray-400 mb-1">Expected Return</div>
              <div className="text-xl font-bold text-green-400">{(optimizationResult.expected_return * 100).toFixed(2)}%</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card text-center"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg mx-auto w-fit mb-3">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-gray-400 mb-1">Portfolio Risk</div>
              <div className="text-xl font-bold text-orange-400">{(optimizationResult.total_risk * 100).toFixed(2)}%</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card text-center"
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg mx-auto w-fit mb-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm text-gray-400 mb-1">Sharpe Ratio</div>
              <div className="text-xl font-bold text-purple-400">{optimizationResult.sharpe_ratio.toFixed(2)}</div>
            </motion.div>
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Asset Allocation Pie Chart */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-3 text-purple-400" />
                  Optimized Allocation
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-sm flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </motion.button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={optimizationResult.selected_assets.map((asset, index) => ({
                      name: asset.symbol,
                      value: asset.investment,
                      color: COLORS[index % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${Number(value).toLocaleString()}`}
                  >
                    {optimizationResult.selected_assets.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(147, 51, 234, 0.5)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Investment']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk vs Return Analysis */}
            <div className="glass-card">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-3 text-blue-400" />
                Risk vs Return Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={optimizationResult.selected_assets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="symbol" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(147, 51, 234, 0.5)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="expected_return" fill="#10B981" name="Expected Return" />
                  <Bar dataKey="risk" fill="#EF4444" name="Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Optimization Details</h3>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-sm"
                >
                  Export Results
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-sm"
                >
                  Execute Trade
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Shares</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Investment</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Weight</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Expected Return</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizationResult.selected_assets.map((asset, index) => (
                    <motion.tr
                      key={asset.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}
                      className="border-b border-gray-700/50 transition-colors duration-300"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center`}
                               style={{ background: COLORS[index % COLORS.length] }}>
                            <span className="text-white font-bold text-xs">{asset.symbol}</span>
                          </div>
                          <span className="text-white font-medium">{asset.symbol}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-white">{asset.shares}</td>
                      <td className="py-4 px-4 text-right text-gray-300">${asset.price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right text-white font-medium">${asset.investment.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-gray-300">{(asset.weight * 100).toFixed(1)}%</td>
                      <td className="py-4 px-4 text-right text-green-400">{(asset.expected_return * 100).toFixed(1)}%</td>
                      <td className="py-4 px-4 text-right text-orange-400">{(asset.risk * 100).toFixed(1)}%</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Optimize;
