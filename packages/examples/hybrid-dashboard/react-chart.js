/**
 * React Chart Component
 * Demonstrates React + PAN messaging integration
 *
 * This component:
 * - Renders using React (for complex interactivity)
 * - Subscribes to PAN messages for data updates
 * - Publishes PAN messages when user interacts with chart
 */

import React from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';

// Simple line chart component (in a real app, you'd use Chart.js or similar)
function AnalyticsChart() {
  const [data, setData] = React.useState([
    { month: 'Jan', users: 2400, revenue: 4800 },
    { month: 'Feb', users: 1398, revenue: 3200 },
    { month: 'Mar', users: 9800, revenue: 8100 },
    { month: 'Apr', users: 3908, revenue: 5600 },
    { month: 'May', users: 4800, revenue: 7200 },
    { month: 'Jun', users: 3800, revenue: 6400 },
    { month: 'Jul', users: 4300, revenue: 7800 }
  ]);

  const [metric, setMetric] = React.useState('users');
  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    // Subscribe to PAN messages
    const handlePanMessage = (e) => {
      if (e.detail.topic === 'filters:changed') {
        console.log('📊 React Chart received filter change:', e.detail.payload);
        // In a real app, fetch new data based on filters
        if (e.detail.payload.metric) {
          setMetric(e.detail.payload.metric);
        }
      }

      if (e.detail.topic === 'theme:toggle') {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
      }
    };

    document.addEventListener('pan:message', handlePanMessage);

    return () => {
      document.removeEventListener('pan:message', handlePanMessage);
    };
  }, []);

  const handleDataPointClick = (point) => {
    // Publish PAN message when chart is clicked
    document.dispatchEvent(new CustomEvent('pan:publish', {
      detail: {
        topic: 'chart:datapoint:click',
        payload: point
      }
    }));
  };

  const maxValue = Math.max(...data.map(d => d[metric]));
  const chartHeight = 250;

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1f2937' : 'white';
  const textColor = isDark ? '#e5e7eb' : '#333';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const lineColor = '#667eea';

  return (
    <div style={{
      background: bgColor,
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: textColor, marginBottom: '0.25rem' }}>
            📈 User Analytics
          </h2>
          <p style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#666' }}>
            Powered by React • Coordinated via PAN
          </p>
        </div>
        <div>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              border: `1px solid ${gridColor}`,
              background: bgColor,
              color: textColor,
              cursor: 'pointer'
            }}
          >
            <option value="users">Users</option>
            <option value="revenue">Revenue ($)</option>
          </select>
        </div>
      </div>

      {/* Simple SVG Chart */}
      <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="0"
            y1={i * (chartHeight / 4)}
            x2="100%"
            y2={i * (chartHeight / 4)}
            stroke={gridColor}
            strokeWidth="1"
            strokeDasharray="4"
          />
        ))}

        {/* Data line */}
        <polyline
          points={data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = ((1 - (d[metric] / maxValue)) * chartHeight);
            return `${x}%,${y}`;
          }).join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = ((1 - (d[metric] / maxValue)) * chartHeight);
          return (
            <g key={i}>
              <circle
                cx={`${x}%`}
                cy={y}
                r="6"
                fill={lineColor}
                stroke={bgColor}
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleDataPointClick(d)}
              />
              <text
                x={`${x}%`}
                y={chartHeight + 20}
                textAnchor="middle"
                fill={textColor}
                fontSize="12"
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: isDark ? '#374151' : '#f3f4f6',
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        color: textColor
      }}>
        💡 <strong>Click any data point</strong> to publish a PAN message that other components can receive!
      </div>
    </div>
  );
}

// Mount React component
const root = ReactDOM.createRoot(document.getElementById('react-root'));
root.render(React.createElement(AnalyticsChart));

console.log('⚛️ React component mounted and listening to PAN bus');
