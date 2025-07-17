import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

const stockDatabase = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', score: 98, risk: 'low' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', score: 95, risk: 'low' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', score: 97, risk: 'low' },
  { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', score: 85, risk: 'high' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce', score: 92, risk: 'medium' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', score: 90, risk: 'high' },
  { ticker: 'META', name: 'Meta Platforms', sector: 'Technology', score: 88, risk: 'medium' },
  { ticker: 'BTC', name: 'Bitcoin', sector: 'Crypto', score: 75, risk: 'high' },
  { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment', score: 80, risk: 'medium' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', score: 87, risk: 'high' },
  { ticker: 'PYPL', name: 'PayPal Holdings', sector: 'Fintech', score: 78, risk: 'medium' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial', score: 89, risk: 'low' },
  { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Financial', score: 90, risk: 'low' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Banking', score: 85, risk: 'low' },
  { ticker: 'BAC', name: 'Bank of America', sector: 'Banking', score: 82, risk: 'medium' },
];

interface StockPickerProps {
  className?: string;
}

const StockPicker: React.FC<StockPickerProps> = ({ className }) => {
  const { selectedStocks, addStock, removeStock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredStocks = useMemo(() => {
    if (!searchTerm) return [];
    return stockDatabase.filter(stock =>
      (stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
       stock.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedStocks.includes(stock.ticker)
    ).slice(0, 5);
  }, [searchTerm, selectedStocks]);

  const handleAddStock = (ticker: string) => {
    addStock(ticker);
    setSearchTerm('');
  };

  const handleRemoveStock = (ticker: string) => {
    removeStock(ticker);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const selectedStockData = selectedStocks.map(ticker => 
    stockDatabase.find(stock => stock.ticker === ticker)
  ).filter(Boolean);

  return (
    <div className="pill-container">
      {selectedStockData.map((stock) => (
        <div key={stock!.ticker} className="pill">
          <span className="pill-ticker">{stock!.ticker}</span>
          <span className="pill-name">{stock!.name}</span>
          <button
            className="pill-remove"
            onClick={() => handleRemoveStock(stock!.ticker)}
            aria-label={`Remove ${stock!.ticker}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
      
      <div className="search-container">
        <input
          type="text"
          className="stock-input"
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
        />
        
        {isSearchFocused && filteredStocks.length > 0 && (
          <div className="search-dropdown">
            {filteredStocks.map((stock) => (
              <button
                key={stock.ticker}
                className="search-result"
                onClick={() => handleAddStock(stock.ticker)}
              >
                <div>
                  <strong>{stock.ticker}</strong> - {stock.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`risk-badge risk-${stock.risk}`}>
                    {stock.risk}
                  </span>
                  <span>{stock.sector}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPicker;
