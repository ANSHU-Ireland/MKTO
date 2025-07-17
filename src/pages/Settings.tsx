import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Key,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Mail,
  Phone,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    trading: true,
    portfolio: true,
    news: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'trading', label: 'Trading', icon: Database },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // Show success message
    }, 2000);
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
      className="min-h-screen p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
        <p className="text-gray-400">Customize your MKTO experience</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div variants={itemVariants} className="glass-card h-fit">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="glass-card">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                  <User className="w-6 h-6 mr-3 text-purple-400" />
                  Profile Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-300"
                      >
                        <Upload className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Profile Picture</h3>
                      <p className="text-gray-400">Upload your avatar</p>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="input-field"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="input-field"
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        defaultValue="john.doe@example.com"
                        className="input-field pl-10"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        defaultValue="+1 (555) 123-4567"
                        className="input-field pl-10"
                        placeholder="Enter your phone"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 form-group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      className="input-field resize-none"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      defaultValue="Passionate trader and investor with 5+ years of experience in quantitative finance."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="glass-card">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Bell className="w-6 h-6 mr-3 text-blue-400" />
                Notification Preferences
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div>
                        <h3 className="text-white font-medium capitalize">{key} Notifications</h3>
                        <p className="text-gray-400 text-sm">
                          {key === 'email' && 'Receive notifications via email'}
                          {key === 'push' && 'Browser push notifications'}
                          {key === 'sms' && 'SMS notifications'}
                          {key === 'trading' && 'Trade execution alerts'}
                          {key === 'portfolio' && 'Portfolio performance updates'}
                          {key === 'news' && 'Market news and analysis'}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                          value ? 'bg-purple-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="glass-card">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-green-400" />
                  Security Settings
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="input-field pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="md:col-span-2 form-group">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h3 className="text-green-400 font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-success text-sm"
                    >
                      Enable 2FA
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="glass-card">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Palette className="w-6 h-6 mr-3 text-pink-400" />
                Appearance Settings
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                    <div>
                      <h3 className="text-white font-medium">Dark Mode</h3>
                      <p className="text-gray-400 text-sm">Toggle between light and dark themes</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      isDarkMode ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </motion.button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-full h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2 cursor-pointer hover:scale-105 transition-transform duration-300"></div>
                    <span className="text-sm text-gray-400">Purple Pink</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-2 cursor-pointer hover:scale-105 transition-transform duration-300"></div>
                    <span className="text-sm text-gray-400">Blue Cyan</span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mb-2 cursor-pointer hover:scale-105 transition-transform duration-300"></div>
                    <span className="text-sm text-gray-400">Green Emerald</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trading Settings */}
          {activeTab === 'trading' && (
            <div className="glass-card">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Database className="w-6 h-6 mr-3 text-orange-400" />
                Trading Preferences
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Order Type
                  </label>
                  <select className="input-field">
                    <option>Market Order</option>
                    <option>Limit Order</option>
                    <option>Stop Loss</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Risk Tolerance
                  </label>
                  <select className="input-field">
                    <option>Conservative</option>
                    <option>Moderate</option>
                    <option>Aggressive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Position Size (%)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="25"
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auto-Rebalance Frequency
                  </label>
                  <select className="input-field">
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeTab === 'api' && (
            <div className="glass-card">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Key className="w-6 h-6 mr-3 text-yellow-400" />
                API Keys Management
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-700/30 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Production API Key</h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  <code className="text-gray-300 text-sm font-mono">mk_prod_1234567890abcdef...</code>
                  <p className="text-gray-400 text-xs mt-2">Created on Jan 15, 2024</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/30 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Development API Key</h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Limited</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  <code className="text-gray-300 text-sm font-mono">mk_dev_abcdef1234567890...</code>
                  <p className="text-gray-400 text-xs mt-2">Created on Dec 20, 2023</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate New API Key</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <motion.div variants={itemVariants} className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={isSaving}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Settings;
