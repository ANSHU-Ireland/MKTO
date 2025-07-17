import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  Settings, 
  User,
  Menu,
  X,
  Zap
} from 'lucide-react';

const Navbar3D = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Portfolio', path: '/portfolio', icon: Wallet },
    { name: 'Optimize', path: '/optimize', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl shadow-2xl shadow-purple-500/20' 
        : 'bg-gradient-to-r from-slate-900/80 via-purple-900/80 to-slate-900/80 backdrop-blur-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="group flex items-center space-x-2">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-xl rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-lg shadow-purple-500/30"></div>
              <Zap className="absolute top-2 left-2 w-6 h-6 text-white transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              MKTO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group relative px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${
                        isActive ? 'rotate-12' : 'group-hover:rotate-12'
                      }`} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {/* 3D Hover Effect */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 transform transition-all duration-300 ${
                      isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                    }`}></div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          <div className="hidden md:block">
            <div className="group relative">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/30">
                <User className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-300" />
                <span className="text-gray-300 group-hover:text-white transition-colors duration-300 font-medium">Profile</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-purple-600 transition-all duration-300 transform hover:scale-110"
            >
              {isOpen ? (
                <X className="w-6 h-6 transform rotate-180 transition-transform duration-300" />
              ) : (
                <Menu className="w-6 h-6 transform transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl backdrop-blur-sm mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`group block px-3 py-2 rounded-lg text-base font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'text-gray-300 hover:text-white hover:bg-purple-600/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${
                      isActive ? 'rotate-12' : 'group-hover:rotate-12'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-gray-700/50">
              <button className="group flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-purple-600/30 transition-all duration-300">
                <User className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Glowing border effect */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
    </nav>
  );
};

export default Navbar3D;
