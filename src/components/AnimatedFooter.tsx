import React from 'react';
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Heart, 
  Zap,
  TrendingUp,
  Shield,
  Award,
  Globe
} from 'lucide-react';

const AnimatedFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Dashboard', href: '/' },
      { name: 'Portfolio Optimization', href: '/optimize' },
      { name: 'Risk Management', href: '/risk' },
      { name: 'Analytics', href: '/analytics' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press', href: '/press' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'API Documentation', href: '/docs' },
      { name: 'Community', href: '/community' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Security', href: '/security' },
    ]
  };

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#', color: 'hover:text-gray-300' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-500' },
    { name: 'Email', icon: Mail, href: '#', color: 'hover:text-purple-400' },
  ];

  const features = [
    { icon: TrendingUp, text: 'AI-Powered Optimization' },
    { icon: Shield, text: 'Bank-Grade Security' },
    { icon: Award, text: 'Award-Winning Platform' },
    { icon: Globe, text: 'Global Markets Access' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-black overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,219,255,0.2),transparent_50%)]"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Features Section */}
        <div className="px-6 py-12 border-b border-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-gray-700/30 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-purple-500/30"></div>
                      <Icon className="absolute top-3 left-3 w-6 h-6 text-white transform -rotate-3 group-hover:-rotate-12 transition-transform duration-500" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300 font-medium">
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            {/* Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-xl rotate-12 shadow-lg shadow-purple-500/30"></div>
                    <Zap className="absolute top-3 left-3 w-6 h-6 text-white transform -rotate-12" />
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                    MKTO
                  </span>
                </div>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Revolutionizing portfolio management with AI-powered optimization algorithms. 
                  Trade smarter, not harder with our cutting-edge knapsack optimization technology.
                </p>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        className={`group p-3 rounded-xl bg-slate-800/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${social.color}`}
                        aria-label={social.name}
                      >
                        <Icon className="w-5 h-5 text-gray-400 group-hover:rotate-12 transition-all duration-300" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Links Sections */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-6 relative">
                      Product
                      <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </h3>
                    <ul className="space-y-3">
                      {footerLinks.product.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold text-lg mb-6 relative">
                      Company
                      <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </h3>
                    <ul className="space-y-3">
                      {footerLinks.company.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold text-lg mb-6 relative">
                      Support
                      <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </h3>
                    <ul className="space-y-3">
                      {footerLinks.support.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold text-lg mb-6 relative">
                      Legal
                      <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </h3>
                    <ul className="space-y-3">
                      {footerLinks.legal.map((link) => (
                        <li key={link.name}>
                          <a
                            href={link.href}
                            className="text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 block"
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="border-t border-gray-800/50 pt-12 mb-12">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Stay ahead of the market
                </h3>
                <p className="text-gray-400 mb-8">
                  Get the latest insights, market analysis, and optimization tips delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors duration-300"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-800/50 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-2 text-gray-400">
                  <span>© {currentYear} MKTO. Made with</span>
                  <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                  <span>by the MKTO Team</span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <span>🔒 256-bit SSL encryption</span>
                  <span>⚡ 99.9% uptime</span>
                  <span>🌍 Global infrastructure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-50"></div>
    </footer>
  );
};

export default AnimatedFooter;
