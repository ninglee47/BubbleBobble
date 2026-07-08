"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Custom Tooltip for premium aesthetic
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '0.5rem 1rem', border: '1px solid var(--accent-blue)' }}>
        <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0, marginBottom: '0.5rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: 0, fontWeight: 'bold', color: entry.color, fontSize: '0.9rem' }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Reusable Chart Component
const MiniChart = ({ data, dataKey = "value", color = "var(--accent-blue)", domain = ['auto', 'auto'] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ height: '100px', width: '100%', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis domain={domain} hide />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Multi-line chart for CapEx
const MultiLineChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ height: '140px', width: '100%', marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="MSFT" stroke="#0ea5e9" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="AMZN" stroke="#f59e0b" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="META" stroke="#8b5cf6" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="GOOGL" stroke="#10b981" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="average" name="Average" stroke="var(--status-red)" strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


// Stock Analysis Component
const StockAnalysisSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStockData() {
      try {
        const res = await fetch('/api/stock-analysis');
        const json = await res.json();
        setData(json.data);
      } catch (error) {
        console.error("Failed to fetch stock analysis:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStockData();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel mt-4" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 className="text-secondary" style={{ animation: 'pulse 2s infinite' }}>Running Gemini AI Quant Analysis...</h3>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-4" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', marginTop: '3rem' }}>Statistical AI Analysis</h2>
      <div className="grid-cards">
        {data.map((stock) => {
           let actionColor = 'var(--status-yellow)';
           if (stock.analysis?.action) {
               const action = String(stock.analysis.action).toUpperCase();
               if (action.includes('BUY')) actionColor = 'var(--status-green)';
               if (action.includes('SELL')) actionColor = 'var(--status-red)';
           }
           
           return (
             <div key={stock.symbol} className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${actionColor}` }}>
               <div className="flex-between mb-2">
                 <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stock.symbol}</h3>
                 <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${stock.current_price}</span>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                 <div className="text-secondary">Take Profit:</div>
                 <div style={{ color: 'var(--status-green)', textAlign: 'right' }}>${stock.tp_line || 'N/A'}</div>
                 <div className="text-secondary">Stop Loss:</div>
                 <div style={{ color: 'var(--status-red)', textAlign: 'right' }}>${stock.sl_line || 'N/A'}</div>
                 <div className="text-secondary">E[max]:</div>
                 <div style={{ textAlign: 'right' }}>${stock.e_max || 'N/A'}</div>
               </div>

               {stock.analysis && !stock.analysis.error ? (
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                   <div style={{ marginBottom: '0.5rem' }}>
                     <span className="text-secondary" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>AI ACTION</span>
                     <div style={{ color: actionColor, fontWeight: 'bold', fontSize: '1.1rem' }}>{String(stock.analysis.action).toUpperCase()}</div>
                   </div>
                   <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                     <strong style={{ color: 'var(--text-primary)' }}>Position:</strong> <span className="text-secondary">{stock.analysis.position}</span>
                   </div>
                   <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                     <strong style={{ color: 'var(--text-primary)' }}>Targets:</strong> <span className="text-secondary">
                       {typeof stock.analysis.targets === 'object' ? JSON.stringify(stock.analysis.targets) : stock.analysis.targets}
                     </span>
                   </div>
                   <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#0ea5e9', borderLeft: '2px solid #0ea5e9', paddingLeft: '0.5rem' }}>
                     "{stock.analysis.description}"
                   </div>
                 </div>
               ) : (
                 <div className="text-red" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                   {stock.analysis?.error || "AI Analysis unavailable."}
                 </div>
               )}
             </div>
           )
        })}
      </div>
    </div>
  );
};


export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/fred');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container flex-between" style={{ height: '100vh', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 className="animate-pulse-red text-red">Initializing Market Sensors...</h2>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="container text-red">Failed to load data.</div>;
  }

  const { metrics, status } = data;
  
  let bannerClass = 'bg-green-soft';
  if (status.level === 'Yellow') bannerClass = 'bg-yellow-soft';
  if (status.level === 'Red') bannerClass = 'bg-red-soft animate-pulse-red';

  return (
    <main className="container">
      <header className="mb-4">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Market Melt-up Tracker</h1>
        <p className="text-secondary">Monitoring structural top liquidity indicators</p>
      </header>

      <div className={`glass-panel mb-4 ${bannerClass}`} style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <div className="flex-between">
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>System Status: {status.level}</h2>
          <span style={{ fontWeight: 'bold' }}>{new Date().toLocaleDateString()}</span>
        </div>
        <p className="mt-1" style={{ fontSize: '1.1rem' }}>{status.message}</p>
      </div>

      <div className="grid-cards">
        {/* Reserve Balances */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary mb-1">Fed Reserve Balances</h3>
          <div className="flex-between mb-1">
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>${metrics.reserves.value}</span>
            <span className="text-secondary">{metrics.reserves.unit}</span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Updated: {metrics.reserves.date}</p>
          <MiniChart 
             data={metrics.reserves.history} 
             color={metrics.reserves.value < 2.8 ? (metrics.reserves.value < 2.5 ? 'var(--status-red)' : 'var(--status-yellow)') : 'var(--status-green)'} 
          />
          <div className={`mt-2 p-2 ${metrics.reserves.value < 2.8 ? (metrics.reserves.value < 2.5 ? 'text-red' : 'text-yellow') : 'text-green'}`} style={{ fontSize: '0.85rem' }}>
            {metrics.reserves.thresholdMsg}
          </div>
        </div>

        {/* SOFR - IORB Spread */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary mb-1">SOFR - IORB Spread</h3>
          <div className="flex-between mb-1">
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.spread.value}</span>
            <span className="text-secondary">{metrics.spread.unit}</span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Updated: {metrics.spread.date}</p>
          <MiniChart 
             data={metrics.spread.history} 
             color={metrics.spread.value > 0 ? (metrics.spread.value > 3 ? 'var(--status-red)' : 'var(--status-yellow)') : 'var(--status-green)'} 
          />
          <div className={`mt-2 p-2 ${metrics.spread.value > 0 ? (metrics.spread.value > 3 ? 'text-red' : 'text-yellow') : 'text-green'}`} style={{ fontSize: '0.85rem' }}>
            {metrics.spread.thresholdMsg}
          </div>
        </div>

        {/* Treasury General Account */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary mb-1">Treasury General Account</h3>
          <div className="flex-between mb-1">
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>${metrics.tga.value}</span>
            <span className="text-secondary">{metrics.tga.unit}</span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Updated: {metrics.tga.date}</p>
          <MiniChart 
             data={metrics.tga.history} 
             color={metrics.tga.value > 0.85 ? 'var(--status-yellow)' : 'var(--status-green)'} 
          />
          <div className={`mt-2 p-2 ${metrics.tga.value > 0.85 ? 'text-yellow' : 'text-green'}`} style={{ fontSize: '0.85rem' }}>
            {metrics.tga.thresholdMsg}
          </div>
        </div>

        {/* Standing Repo Facility */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary mb-1">Standing Repo Facility</h3>
          <div className="flex-between mb-1">
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>${metrics.srf.value}</span>
            <span className="text-secondary">{metrics.srf.unit}</span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Updated: {metrics.srf.date}</p>
          <MiniChart 
             data={metrics.srf.history} 
             color={metrics.srf.value > 10 ? 'var(--status-red)' : 'var(--accent-blue)'} 
          />
          <div className={`mt-2 p-2 ${metrics.srf.value > 10 ? 'text-red' : 'text-green'}`} style={{ fontSize: '0.85rem' }}>
            {metrics.srf.thresholdMsg}
          </div>
        </div>

        {/* CapEx QoQ */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
          <h3 className="text-secondary mb-1">
            Cloud Giants CapEx {metrics.capex.isLive ? '(Live)' : '(Mock)'}
          </h3>
          <div className="flex-between mb-1">
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-red)' }}>{metrics.capex.value}%</span>
            <span className="text-secondary">Average QoQ</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
             <div style={{ color: '#0ea5e9', fontSize: '0.85rem' }}>MSFT: {metrics.capex.breakdown?.MSFT}%</div>
             <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>AMZN: {metrics.capex.breakdown?.AMZN}%</div>
             <div style={{ color: '#8b5cf6', fontSize: '0.85rem' }}>META: {metrics.capex.breakdown?.META}%</div>
             <div style={{ color: '#10b981', fontSize: '0.85rem' }}>GOOGL: {metrics.capex.breakdown?.GOOGL}%</div>
          </div>
          
          {metrics.capex.isLive ? (
            <MultiLineChart data={metrics.capex.history} />
          ) : (
            <MiniChart 
              data={metrics.capex.history} 
              dataKey="average"
              color={metrics.capex.trend === 'declining' ? 'var(--status-red)' : 'var(--accent-blue)'} 
            />
          )}
          
          <div className={`mt-2 p-2 ${metrics.capex.trend === 'declining' ? 'text-red' : 'text-green'}`} style={{ fontSize: '0.85rem' }}>
            {metrics.capex.message}
          </div>
        </div>

        {/* Options Skew */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-blue)' }}>
          <h3 className="text-secondary mb-1">Options Put/Call Skew (Live ^SKEW)</h3>
          <div className="flex-between mb-1">
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.optionsSkew.value}</span>
            <span className="text-secondary">Index</span>
          </div>
          <MiniChart 
             data={metrics.optionsSkew.history} 
             color={metrics.optionsSkew.trend === 'extreme_inversion' ? 'var(--status-yellow)' : 'var(--accent-blue)'} 
          />
          <div className={`mt-2 p-2 ${metrics.optionsSkew.trend === 'extreme_inversion' ? 'text-yellow' : 'text-green'}`} style={{ fontSize: '0.85rem' }}>
            {metrics.optionsSkew.message}
          </div>
        </div>

      </div>
      <StockAnalysisSection />
    </main>
  );
}
