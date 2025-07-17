import { create } from 'zustand';

interface Suggestion {
  ticker: string;
  name: string;
  sector: string;
  score: number;
  risk: 'low' | 'medium' | 'high';
  reason: string;
  momentum: number;
  volatility: number;
  expectedReturn: number;
}

interface OptimizationResult {
  score: number;
  expectedReturn?: number;
  riskLevel?: string;
  totalValue?: number;
  allocations?: Array<{
    symbol: string;
    name?: string;
    weight?: number;
    value?: number;
  }>;
}

interface StoreState {
  // Stock selection
  selectedStocks: string[];
  addStock: (stock: string) => void;
  removeStock: (stock: string) => void;
  
  // Budget control
  budget: number;
  setBudget: (budget: number) => void;
  
  // Risk level
  riskLevel: 'low' | 'medium' | 'high';
  setRiskLevel: (level: 'low' | 'medium' | 'high') => void;
  
  // Suggestions
  suggestions: Suggestion[];
  fetchSuggestions: () => Promise<void>;
  
  // Optimization
  optimizationState: 'idle' | 'optimizing' | 'complete' | 'error';
  optimizationProgress: number;
  optimizationResults: OptimizationResult[];
  startOptimization: () => Promise<void>;
}

const mockSuggestions: Suggestion[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    score: 95,
    risk: 'low',
    reason: 'Strong fundamentals with consistent growth and market leadership in consumer electronics.',
    momentum: 78,
    volatility: 25,
    expectedReturn: 8.5
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    score: 92,
    risk: 'high',
    reason: 'Leading AI and GPU technology with explosive growth potential in data centers.',
    momentum: 95,
    volatility: 85,
    expectedReturn: 15.2
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    score: 89,
    risk: 'low',
    reason: 'Dominant cloud platform with steady revenue growth and strong enterprise presence.',
    momentum: 65,
    volatility: 22,
    expectedReturn: 7.8
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    score: 87,
    risk: 'medium',
    reason: 'Search monopoly with growing cloud business and strong AI development capabilities.',
    momentum: 58,
    volatility: 35,
    expectedReturn: 9.1
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Automotive',
    score: 82,
    risk: 'high',
    reason: 'Electric vehicle pioneer with energy storage and autonomous driving potential.',
    momentum: 88,
    volatility: 92,
    expectedReturn: 18.7
  },
  {
    ticker: 'V',
    name: 'Visa Inc.',
    sector: 'Financial',
    score: 85,
    risk: 'low',
    reason: 'Payment processing leader benefiting from digital payment growth trends.',
    momentum: 45,
    volatility: 18,
    expectedReturn: 6.9
  }
];

export const useStore = create<StoreState>((set, get) => ({
  // Stock selection
  selectedStocks: [],
  addStock: (stock) => set((state) => ({
    selectedStocks: state.selectedStocks.includes(stock) 
      ? state.selectedStocks 
      : [...state.selectedStocks, stock]
  })),
  removeStock: (stock) => set((state) => ({
    selectedStocks: state.selectedStocks.filter(s => s !== stock)
  })),
  
  // Budget control
  budget: 10000,
  setBudget: (budget) => set({ budget }),
  
  // Risk level
  riskLevel: 'medium',
  setRiskLevel: (riskLevel) => set({ riskLevel }),
  
  // Suggestions
  suggestions: [],
  fetchSuggestions: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { selectedStocks, riskLevel, budget } = get();
    
    // Filter suggestions based on selection and preferences
    let filteredSuggestions = mockSuggestions.filter(
      suggestion => !selectedStocks.includes(suggestion.ticker)
    );
    
    // Sort by risk preference
    if (riskLevel === 'low') {
      filteredSuggestions = filteredSuggestions
        .filter(s => s.risk === 'low' || s.risk === 'medium')
        .sort((a, b) => a.volatility - b.volatility);
    } else if (riskLevel === 'high') {
      filteredSuggestions = filteredSuggestions
        .sort((a, b) => b.expectedReturn - a.expectedReturn);
    } else {
      filteredSuggestions = filteredSuggestions
        .sort((a, b) => b.score - a.score);
    }
    
    set({ suggestions: filteredSuggestions.slice(0, 6) });
  },
  
  // Optimization
  optimizationState: 'idle',
  optimizationProgress: 0,
  optimizationResults: [],
  startOptimization: async () => {
    const { selectedStocks, budget, riskLevel } = get();
    
    if (selectedStocks.length === 0 || budget <= 0) {
      return;
    }
    
    set({ optimizationState: 'optimizing', optimizationProgress: 0 });
    
    try {
      // Simulate optimization progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 150));
        set({ optimizationProgress: i });
      }
      
      // Generate mock optimization results
      const results: OptimizationResult[] = [
        {
          score: 92,
          expectedReturn: 12.5,
          riskLevel: riskLevel,
          totalValue: budget,
          allocations: selectedStocks.map((stock, index) => ({
            symbol: stock,
            name: mockSuggestions.find(s => s.ticker === stock)?.name || stock,
            weight: (index === 0 ? 40 : index === 1 ? 30 : 20) + Math.random() * 10,
            value: budget * ((index === 0 ? 40 : index === 1 ? 30 : 20) + Math.random() * 10) / 100
          }))
        },
        {
          score: 88,
          expectedReturn: 10.8,
          riskLevel: riskLevel,
          totalValue: budget,
          allocations: selectedStocks.map((stock, index) => ({
            symbol: stock,
            name: mockSuggestions.find(s => s.ticker === stock)?.name || stock,
            weight: (index === 0 ? 35 : index === 1 ? 35 : 25) + Math.random() * 5,
            value: budget * ((index === 0 ? 35 : index === 1 ? 35 : 25) + Math.random() * 5) / 100
          }))
        }
      ];
      
      set({ 
        optimizationState: 'complete', 
        optimizationResults: results,
        optimizationProgress: 100 
      });
      
    } catch (error) {
      set({ optimizationState: 'error' });
    }
  }
}));
