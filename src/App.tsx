import { useState, useEffect } from 'react'

function App() {
  const [selectedAssets, setSelectedAssets] = useState(['AAPL', 'GOOGL', 'MSFT'])
  const [budget, setBudget] = useState(50000)
  const [riskLevel, setRiskLevel] = useState('mid')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Header shrink effect - exactly as specified
  useEffect(() => {
    const hdr = document.querySelector('header')
    let prev = 0
    const handleScroll = () => {
      const y = window.scrollY
      if (y > 150 && prev <= 150) hdr?.classList.add('shrink')
      if (y <= 150 && prev > 150) hdr?.classList.remove('shrink')
      prev = y
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Ripple effect - exactly as specified
  const handleOptimizeClick = (e: React.MouseEvent) => {
    const btn = e.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    const r = document.createElement('span')
    const d = Math.max(btn.clientWidth, btn.clientHeight)
    r.className = 'ripple'
    r.style.width = r.style.height = d + 'px'
    r.style.left = e.clientX - rect.left - d / 2 + 'px'
    r.style.top = e.clientY - rect.top - d / 2 + 'px'
    btn.appendChild(r)
    setTimeout(() => r.remove(), 600)
  }

  const removeAsset = (asset: string) => {
    setSelectedAssets(prev => prev.filter(a => a !== asset))
  }

  const addSuggestion = (symbol: string) => {
    if (!selectedAssets.includes(symbol)) {
      setSelectedAssets(prev => [...prev, symbol])
    }
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  const suggestions = [
    { symbol: 'TSLA', name: 'Tesla Inc', sharpe: 1.8, score: 8.5 },
    { symbol: 'NVDA', name: 'NVIDIA Corp', sharpe: 2.1, score: 9.2 },
    { symbol: 'META', name: 'Meta Platforms', sharpe: 1.6, score: 7.8 },
    { symbol: 'AMZN', name: 'Amazon.com Inc', sharpe: 1.4, score: 8.1 },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', sharpe: 1.2, score: 6.9 }
  ]

  return (
    <>
      {/* Header with exact positioning */}
      <header>
        <div className="hamburger" onClick={toggleDrawer}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <div className="logo">
          📈
        </div>
        
        <nav>
          <a href="#" className={activeNav === 'Dashboard' ? 'active' : ''} onClick={() => setActiveNav('Dashboard')}>Dashboard</a>
          <a href="#" className={activeNav === 'Portfolio' ? 'active' : ''} onClick={() => setActiveNav('Portfolio')}>Portfolio</a>
          <a href="#" className={activeNav === 'Analytics' ? 'active' : ''} onClick={() => setActiveNav('Analytics')}>Analytics</a>
          <a href="#" className={activeNav === 'Settings' ? 'active' : ''} onClick={() => setActiveNav('Settings')}>Settings</a>
        </nav>
        
        <div className="themeSwitch">🌙</div>
        <div className="avatar">👤</div>
      </header>

      {/* Sidebar with exact icon positioning */}
      <aside className={drawerOpen ? 'drawerOpen' : ''}>
        <button className="sideBtn" aria-label="Overview">
          📊
        </button>
        <button className="sideBtn" aria-label="Orders">
          📋
        </button>
        <button className="sideBtn" aria-label="Risk">
          🛡️
        </button>
        <button className="sideBtn" aria-label="Logs">
          📄
        </button>
        <button className="sideBtn" aria-label="Settings">
          ⚙️
        </button>
      </aside>

      {/* Main content with exact grid */}
      <main>
        {/* Row 1: Stock Picker */}
        <section className="stockRow">
          <h2>Select Assets</h2>
          <div className="pillLane" role="list">
            {selectedAssets.map(asset => (
              <div key={asset} className="pill" role="listitem">
                {asset}
                <button 
                  className="pillRemove"
                  onClick={() => removeAsset(asset)}
                  aria-label={`Remove ${asset}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input 
            type="text" 
            className="stockInput"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        {/* Row 2: Suggestions */}
        <section className="suggRow">
          <h3>Smart Suggestions</h3>
          <div className="suggRail">
            {suggestions.map(suggestion => (
              <div 
                key={suggestion.symbol} 
                className="sCard"
                role="button"
                tabIndex={0}
                aria-label={`Add ${suggestion.symbol}`}
              >
                <div className="sCardTicker">{suggestion.symbol}</div>
                <div className="sCardScore">Score: {suggestion.score}</div>
                <div className="sCardPlus" onClick={() => addSuggestion(suggestion.symbol)}>+</div>
              </div>
            ))}
          </div>
        </section>

        {/* Row 3: Controls */}
        <section style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px'}}>
          {/* Budget Control */}
          <div className="budgetWrap">
            <svg className="budgetSVG" viewBox="0 0 240 240">
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="#283043"
                strokeWidth="6"
              />
              <path
                d="M 30 120 A 90 90 0 0 1 210 120"
                fill="none"
                stroke="#58a6ff"
                strokeWidth="6"
                strokeDasharray={`${(budget / 100000) * 283} 283`}
                strokeLinecap="round"
              />
              <text x="120" y="140" textAnchor="middle" fontSize="32" fontWeight="600" fill="#58a6ff">
                ${(budget / 1000).toFixed(0)}K
              </text>
            </svg>
            <input 
              type="number" 
              className="budgetInput"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              aria-describedby="budgetHelp"
            />
            <div id="budgetHelp" style={{display: 'none'}}>Enter budget between $1,000 and $1,000,000</div>
          </div>

          {/* Risk Control */}
          <div className="riskWrap">
            <div className="dialPlate" role="radiogroup" aria-label="Risk level">
              <button 
                className={`dialIcon dialIcon--low ${riskLevel === 'low' ? 'chosen' : ''}`}
                onClick={() => setRiskLevel('low')}
                aria-pressed={riskLevel === 'low'}
              >
                🛡️
              </button>
              <button 
                className={`dialIcon dialIcon--mid ${riskLevel === 'mid' ? 'chosen' : ''}`}
                onClick={() => setRiskLevel('mid')}
                aria-pressed={riskLevel === 'mid'}
              >
                📊
              </button>
              <button 
                className={`dialIcon dialIcon--high ${riskLevel === 'high' ? 'chosen' : ''}`}
                onClick={() => setRiskLevel('high')}
                aria-pressed={riskLevel === 'high'}
              >
                ⚡
              </button>
            </div>
          </div>
        </section>

        {/* Row 4: Optimize Button */}
        <section className="optRow">
          <button className="optimize" onClick={handleOptimizeClick}>
            🎯 Optimize Portfolio
          </button>
        </section>

        {/* Row 5: Results Header */}
        <section style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h3 style={{margin: 0, fontSize: '24px', fontWeight: 700}}>Optimization Results</h3>
          <button style={{width: '32px', height: '32px', background: 'none', border: 'none', color: 'var(--color-fg-base)', cursor: 'pointer'}}>
            📥
          </button>
        </section>

        {/* Row 6: Results Grid */}
        <section className="resultsGrid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card" tabIndex={0}>
              <div className="inner">
                <div className="front">
                  <h4>Portfolio {i}</h4>
                  <p>Expected Return: {(Math.random() * 5 + 8).toFixed(1)}%</p>
                  <p>Risk Score: {(Math.random() * 3 + 4).toFixed(1)}</p>
                  <p>Sharpe Ratio: {(Math.random() * 0.5 + 1.2).toFixed(2)}</p>
                </div>
                <div className="back">
                  <h4>Holdings</h4>
                  <p>AAPL: 25%</p>
                  <p>GOOGL: 20%</p>
                  <p>MSFT: 30%</p>
                  <p>Others: 25%</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        gridArea: '3 / 1 / 4 / -1',
        position: 'relative',
        width: '100%',
        height: '120px',
        background: 'radial-gradient(circle, #0b0f14 0%, #0d1117 100%)',
        overflow: 'hidden',
        zIndex: 5
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '40px',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '1200px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 2
        }}>
          <div style={{display: 'flex', gap: '24px'}}>
            <a href="#">🐙</a>
            <a href="#">🐦</a>
            <a href="#">💼</a>
          </div>
          <div>MKTO Portfolio Optimizer</div>
        </div>
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '50px',
          fontSize: '12px',
          color: '#6e7681'
        }}>
          v2.1.0
        </div>
      </footer>
    </>
  )
}

export default App
