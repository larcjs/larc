/**
 * Vue Filters Component
 * Demonstrates Vue + PAN messaging integration
 *
 * This component:
 * - Renders using Vue (for reactive data binding)
 * - Publishes PAN messages when filters change
 * - Subscribes to PAN messages for theme changes
 */

import { createApp, ref, watch } from 'https://esm.sh/vue@3.3.4/dist/vue.esm-browser.js';

const FilterPanel = {
  setup() {
    const dateRange = ref('7d');
    const metric = ref('users');
    const status = ref('all');
    const theme = ref('light');

    // Watch for filter changes and publish to PAN bus
    watch([dateRange, metric, status], ([newRange, newMetric, newStatus]) => {
      document.dispatchEvent(new CustomEvent('pan:publish', {
        detail: {
          topic: 'filters:changed',
          payload: {
            dateRange: newRange,
            metric: newMetric,
            status: newStatus
          }
        }
      }));
    });

    // Listen for theme changes from PAN bus
    const handlePanMessage = (e) => {
      if (e.detail.topic === 'theme:toggle') {
        theme.value = theme.value === 'light' ? 'dark' : 'light';
      }
    };

    document.addEventListener('pan:message', handlePanMessage);

    const isDark = () => theme.value === 'dark';

    return {
      dateRange,
      metric,
      status,
      theme,
      isDark
    };
  },
  template: `
    <div :style="{
      background: isDark() ? '#1f2937' : 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }">
      <div :style="{ marginBottom: '1rem' }">
        <h3 :style="{
          fontSize: '1.125rem',
          color: isDark() ? '#e5e7eb' : '#333',
          marginBottom: '0.25rem'
        }">
          🎛️ Dashboard Filters
        </h3>
        <p :style="{
          fontSize: '0.875rem',
          color: isDark() ? '#9ca3af' : '#666'
        }">
          Powered by Vue • Coordinated via PAN
        </p>
      </div>

      <div :style="{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }">
        <div>
          <label :style="{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: isDark() ? '#9ca3af' : '#666',
            fontWeight: '500'
          }">
            Date Range
          </label>
          <select v-model="dateRange" :style="{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: isDark() ? '1px solid #374151' : '1px solid #e5e7eb',
            background: isDark() ? '#374151' : 'white',
            color: isDark() ? '#e5e7eb' : '#333',
            cursor: 'pointer'
          }">
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>

        <div>
          <label :style="{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: isDark() ? '#9ca3af' : '#666',
            fontWeight: '500'
          }">
            Metric
          </label>
          <select v-model="metric" :style="{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: isDark() ? '1px solid #374151' : '1px solid #e5e7eb',
            background: isDark() ? '#374151' : 'white',
            color: isDark() ? '#e5e7eb' : '#333',
            cursor: 'pointer'
          }">
            <option value="users">Users</option>
            <option value="revenue">Revenue</option>
            <option value="sessions">Sessions</option>
            <option value="conversions">Conversions</option>
          </select>
        </div>

        <div>
          <label :style="{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: isDark() ? '#9ca3af' : '#666',
            fontWeight: '500'
          }">
            Status
          </label>
          <select v-model="status" :style="{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: isDark() ? '1px solid #374151' : '1px solid #e5e7eb',
            background: isDark() ? '#374151' : 'white',
            color: isDark() ? '#e5e7eb' : '#333',
            cursor: 'pointer'
          }">
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div :style="{
        marginTop: '1rem',
        padding: '1rem',
        background: isDark() ? '#374151' : '#f3f4f6',
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        color: isDark() ? '#e5e7eb' : '#333'
      }">
        💡 <strong>Change any filter</strong> to publish a PAN message. The React chart and LARC table both receive it!
      </div>
    </div>
  `
};

// Mount Vue component
const app = createApp(FilterPanel);
app.mount('#vue-root');

console.log('🟢 Vue component mounted and publishing to PAN bus');
