/**
 * Playground Examples
 *
 * Pre-made component configurations to demonstrate LARC capabilities
 */

export const examples = [
  {
    id: 'simple-store',
    name: 'Simple Store',
    description: 'Basic state management with pan-store',
    components: [
      {
        name: 'pan-store',
        attributes: {
          'store-id': 'app-state'
        }
      }
    ]
  },
  {
    id: 'router-navigation',
    name: 'Router with Navigation',
    description: 'Client-side routing with links',
    components: [
      {
        name: 'pan-router',
        attributes: {
          'base': '/playground'
        },
        innerHTML: `
          <div slot="home">
            <h2>🏠 Home Page</h2>
            <p>Welcome to the home page. Use the navigation links to explore different sections.</p>
          </div>
          <div slot="about">
            <h2>ℹ️ About Page</h2>
            <p>This is the about page. Learn more about our application here.</p>
          </div>
          <div slot="contact">
            <h2>📧 Contact Page</h2>
            <p>Get in touch with us through this contact page.</p>
          </div>
        `
      },
      {
        name: 'pan-card',
        attributes: {
          'header': 'Navigation Demo'
        },
        innerHTML: `
          <nav style="display: flex; gap: 1rem; padding: 1rem;">
            <pan-link to="/playground/home" style="padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">Home</pan-link>
            <pan-link to="/playground/about" style="padding: 0.5rem 1rem; background: #7c3aed; color: white; text-decoration: none; border-radius: 4px;">About</pan-link>
            <pan-link to="/playground/contact" style="padding: 0.5rem 1rem; background: #059669; color: white; text-decoration: none; border-radius: 4px;">Contact</pan-link>
          </nav>
        `
      }
    ]
  },
  {
    id: 'dashboard',
    name: 'Dashboard Layout',
    description: 'Card-based dashboard with table and chart',
    components: [
      {
        name: 'pan-card',
        attributes: {
          'header': 'User Statistics'
        }
      },
      {
        name: 'pan-table',
        attributes: {}
      },
      {
        name: 'pan-chart',
        attributes: {
          'type': 'bar',
          'data': JSON.stringify({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Monthly Sales',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: '#2563eb'
            }]
          }),
          'options': JSON.stringify({
            responsive: true,
            maintainAspectRatio: false
          })
        }
      }
    ]
  },
  {
    id: 'form-validation',
    name: 'Form with Validation',
    description: 'Form handling with validation',
    components: [
      {
        name: 'pan-form',
        attributes: {
          'resource': 'users',
          'fields': 'name,email,role'
        }
      },
      {
        name: 'pan-validation',
        attributes: {}
      }
    ]
  },
  {
    id: 'theme-switcher',
    name: 'Theme Switcher',
    description: 'Light/dark theme management',
    components: [
      {
        name: 'pan-theme-provider',
        attributes: {
          'theme': 'auto'
        }
      },
      {
        name: 'pan-theme-toggle',
        attributes: {}
      }
    ]
  },
  {
    id: 'data-flow',
    name: 'Data Flow',
    description: 'Fetch data and display in table',
    components: [
      {
        name: 'pan-data-connector',
        attributes: {
          'resource': 'users',
          'base-url': 'https://jsonplaceholder.typicode.com'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'resource': 'users',
          'columns': 'name,email,phone'
        }
      }
    ]
  },
  {
    id: 'markdown-editor',
    name: 'Markdown Editor & Preview',
    description: 'Live markdown editing with preview',
    components: [
      {
        name: 'pan-markdown-editor',
        attributes: {
          'topic': 'markdown.updated',
          'placeholder': 'Enter markdown here...'
        }
      },
      {
        name: 'pan-markdown-renderer',
        attributes: {
          'listen-topic': 'markdown.updated'
        }
      }
    ]
  },
  {
    id: 'search-filter',
    name: 'Search & Filter',
    description: 'Search bar with filtered data table',
    components: [
      {
        name: 'pan-search-bar',
        attributes: {
          'topic': 'search.query',
          'placeholder': 'Search...'
        }
      },
      {
        name: 'pan-data-connector',
        attributes: {
          'resource': 'posts',
          'base-url': 'https://jsonplaceholder.typicode.com'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'resource': 'posts',
          'columns': 'title,body'
        }
      }
    ]
  },
  {
    id: 'modal-dialog',
    name: 'Modal Dialog',
    description: 'Modal popup with content',
    components: [
      {
        name: 'pan-modal',
        attributes: {
          'modal-id': 'demo-modal',
          'title': 'Welcome'
        }
      },
      {
        name: 'pan-card',
        attributes: {
          'header': 'Modal Content',
          'variant': 'outlined'
        }
      }
    ]
  },
  {
    id: 'tabs-layout',
    name: 'Tabs Layout',
    description: 'Tabbed interface for organizing content',
    components: [
      {
        name: 'pan-tabs',
        attributes: {
          'tabs': JSON.stringify([
            { label: 'Overview', id: 'overview', icon: '📊' },
            { label: 'Profile', id: 'profile', icon: '👤' },
            { label: 'Settings', id: 'settings', icon: '⚙️' }
          ]),
          'active': 'overview',
          'topic': 'tabs'
        },
        innerHTML: `
          <div slot="tab-overview" data-label="Overview">
            <h3>📊 Overview</h3>
            <p>Welcome to the overview tab. Here you can see a summary of your dashboard.</p>
            <ul>
              <li>Total Users: 1,234</li>
              <li>Active Sessions: 567</li>
              <li>Revenue: $12,345</li>
            </ul>
          </div>
          <div slot="tab-profile" data-label="Profile">
            <h3>👤 User Profile</h3>
            <p>Manage your user profile information here.</p>
            <p><strong>Name:</strong> John Doe</p>
            <p><strong>Email:</strong> john@example.com</p>
            <p><strong>Role:</strong> Administrator</p>
          </div>
          <div slot="tab-settings" data-label="Settings">
            <h3>⚙️ Settings</h3>
            <p>Configure your application settings.</p>
            <label style="display: block; margin: 0.5rem 0;">
              <input type="checkbox" checked> Enable notifications
            </label>
            <label style="display: block; margin: 0.5rem 0;">
              <input type="checkbox"> Dark mode
            </label>
            <label style="display: block; margin: 0.5rem 0;">
              <input type="checkbox" checked> Auto-save
            </label>
          </div>
        `
      }
    ]
  },
  {
    id: 'authentication',
    name: 'Authentication System',
    description: 'JWT-based authentication flow',
    components: [
      {
        name: 'pan-auth',
        attributes: {
          'storage': 'localStorage',
          'token-key': 'demo_auth_token',
          'login-endpoint': '/api/auth/login'
        }
      },
      {
        name: 'pan-card',
        attributes: {
          'header': '🔐 Authentication Demo'
        },
        innerHTML: `
          <div style="padding: 1rem;">
            <p>This example demonstrates JWT-based authentication with the PAN bus.</p>
            <div style="margin: 1rem 0; padding: 1rem; background: #f3f4f6; border-radius: 4px;">
              <h4>Login Form</h4>
              <form id="auth-form" style="display: flex; flex-direction: column; gap: 0.5rem;">
                <input type="email" placeholder="Email" value="demo@example.com" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                <input type="password" placeholder="Password" value="password123" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                <button type="submit" style="padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Sign In</button>
              </form>
            </div>
            <div id="auth-status" style="margin-top: 1rem; padding: 0.5rem; border-radius: 4px;">
              <p>Status: Not authenticated</p>
              <p style="font-size: 0.875rem; color: #6b7280;">Note: This is a demo with localStorage-based auth. In production, connect to a real API endpoint.</p>
            </div>
          </div>
        `
      }
    ]
  },
  {
    id: 'file-manager',
    name: 'File Upload Manager',
    description: 'File upload with preview and management',
    components: [
      {
        name: 'file-upload',
        attributes: {
          'topic': 'files.uploaded',
          'preview': 'true',
          'drag-drop': 'true',
          'multiple': 'true'
        }
      },
      {
        name: 'pan-files',
        attributes: {
          'listen-topic': 'files.uploaded'
        }
      }
    ]
  },
  {
    id: 'idb-storage',
    name: 'IndexedDB Storage',
    description: 'Offline data storage with IndexedDB',
    components: [
      {
        name: 'pan-idb',
        attributes: {
          'database': 'app-db',
          'store': 'items',
          'version': '1',
          'key-path': 'id'
        }
      },
      {
        name: 'pan-store',
        attributes: {
          'store-id': 'local-data'
        }
      }
    ]
  },
  {
    id: 'pagination',
    name: 'Paginated Data Table',
    description: 'Pagination controls (data connector loads all items)',
    components: [
      {
        name: 'pan-data-connector',
        attributes: {
          'resource': 'posts',
          'base-url': 'https://jsonplaceholder.typicode.com'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'resource': 'posts',
          'columns': 'id,title,body'
        }
      },
      {
        name: 'pan-pagination',
        attributes: {
          'total-items': '100',
          'page-size': '10',
          'current-page': '1',
          'topic': 'pagination',
          'show-info': 'true'
        }
      }
    ]
  },
  {
    id: 'websocket-updates',
    name: 'WebSocket Real-time',
    description: 'Real-time updates via WebSocket',
    components: [
      {
        name: 'pan-websocket',
        attributes: {
          'url': 'wss://echo.websocket.org',
          'topic': 'ws.message'
        }
      },
      {
        name: 'pan-card',
        attributes: {
          'header': 'Live Updates'
        }
      }
    ]
  },
  {
    id: 'sse-stream',
    name: 'Server-Sent Events',
    description: 'Server-sent event stream (needs backend)',
    components: [
      {
        name: 'pan-card',
        attributes: {
          'header': 'SSE Demo'
        }
      }
    ]
  },
  {
    id: 'graphql-data',
    name: 'GraphQL Integration',
    description: 'Fetch data using GraphQL (requires backend setup)',
    components: [
      {
        name: 'pan-card',
        attributes: {
          'header': 'GraphQL Demo'
        }
      }
    ]
  },
  {
    id: 'schema-form',
    name: 'Schema-based Form',
    description: 'Dynamic form from JSON schema',
    components: [
      {
        name: 'pan-json-form',
        attributes: {
          'resource': 'user-registration',
          'schema': JSON.stringify({
            fields: [
              {
                name: 'fullName',
                type: 'text',
                label: 'Full Name',
                required: true,
                placeholder: 'John Doe'
              },
              {
                name: 'email',
                type: 'email',
                label: 'Email Address',
                required: true,
                placeholder: 'john@example.com'
              },
              {
                name: 'age',
                type: 'number',
                label: 'Age',
                required: false,
                placeholder: '25'
              },
              {
                name: 'bio',
                type: 'textarea',
                label: 'Biography',
                required: false,
                rows: 4,
                placeholder: 'Tell us about yourself...'
              },
              {
                name: 'newsletter',
                type: 'checkbox',
                label: 'Subscribe to newsletter',
                required: false
              }
            ]
          }),
          'layout': 'vertical',
          'auto-validate': 'true',
          'show-reset': 'true'
        }
      },
      {
        name: 'pan-card',
        attributes: {
          'header': 'Form Output',
          'variant': 'outlined'
        },
        innerHTML: `
          <div style="padding: 1rem;">
            <p style="color: #6b7280; font-size: 0.875rem;">Submit the form to see the output here via the PAN bus.</p>
            <pre id="form-output" style="margin-top: 0.5rem; padding: 0.5rem; background: #f9fafb; border-radius: 4px; font-size: 0.875rem; overflow-x: auto;">Waiting for form submission...</pre>
          </div>
        `
      }
    ]
  },
  {
    id: 'drag-drop',
    name: 'Drag & Drop List',
    description: 'Reorderable drag and drop list',
    components: [
      {
        name: 'drag-drop-list',
        attributes: {
          'topic': 'list',
          'items': JSON.stringify([
            { id: 1, content: '📝 Task 1: Review code' },
            { id: 2, content: '🎨 Task 2: Update designs' },
            { id: 3, content: '🚀 Task 3: Deploy to production' },
            { id: 4, content: '📊 Task 4: Analyze metrics' }
          ])
        }
      }
    ]
  },
  {
    id: 'date-picker',
    name: 'Date Selection',
    description: 'Date picker with validation',
    components: [
      {
        name: 'pan-date-picker',
        attributes: {
          'topic': 'date.selected',
          'format': 'YYYY-MM-DD',
          'placeholder': 'Select a date'
        }
      },
      {
        name: 'pan-validation',
        attributes: {}
      }
    ]
  },
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    description: 'Dropdown with menu items',
    components: [
      {
        name: 'pan-dropdown',
        attributes: {
          'label': 'Actions',
          'topic': 'action.selected',
          'items': JSON.stringify([
            { label: 'Edit', value: 'edit', icon: '✏️' },
            { label: 'Delete', value: 'delete', icon: '🗑️' },
            { label: 'Share', value: 'share', icon: '📤' }
          ])
        }
      }
    ]
  }
];

export function getExample(id) {
  return examples.find(ex => ex.id === id);
}

export function getAllExamples() {
  return examples;
}
