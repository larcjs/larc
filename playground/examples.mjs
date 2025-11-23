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
          'base-path': '/'
        }
      },
      {
        name: 'pan-link',
        attributes: {
          'to': '/home'
        }
      },
      {
        name: 'pan-link',
        attributes: {
          'to': '/about'
        }
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
          'type': 'bar'
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
          'form-id': 'user-form'
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
        name: 'pan-fetch',
        attributes: {
          'url': 'https://jsonplaceholder.typicode.com/users',
          'topic': 'users.loaded'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'listen-topic': 'users.loaded'
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
        name: 'pan-fetch',
        attributes: {
          'url': 'https://jsonplaceholder.typicode.com/posts',
          'topic': 'posts.loaded'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'listen-topic': 'posts.loaded'
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
          'tabs': '["Home", "Profile", "Settings"]',
          'active': '0'
        }
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
          'token-key': 'auth_token',
          'login-endpoint': '/api/login'
        }
      },
      {
        name: 'pan-jwt',
        attributes: {
          'verify': 'true'
        }
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
    description: 'Large dataset with pagination',
    components: [
      {
        name: 'pan-fetch',
        attributes: {
          'url': 'https://jsonplaceholder.typicode.com/posts',
          'topic': 'data.loaded'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'listen-topic': 'data.loaded'
        }
      },
      {
        name: 'pan-pagination',
        attributes: {
          'total': '100',
          'page-size': '10',
          'topic': 'page.changed'
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
    description: 'Server-sent event stream',
    components: [
      {
        name: 'pan-sse',
        attributes: {
          'url': '/api/events',
          'topic': 'sse.message'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'listen-topic': 'sse.message'
        }
      }
    ]
  },
  {
    id: 'graphql-data',
    name: 'GraphQL Integration',
    description: 'Fetch data using GraphQL',
    components: [
      {
        name: 'pan-graphql-connector',
        attributes: {
          'endpoint': 'https://api.example.com/graphql',
          'resource': 'users'
        }
      },
      {
        name: 'pan-data-table',
        attributes: {
          'resource': 'users'
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
        name: 'pan-schema',
        attributes: {
          'schema-id': 'user-schema'
        }
      },
      {
        name: 'pan-schema-form',
        attributes: {
          'schema-id': 'user-schema',
          'topic': 'form.submitted'
        }
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
          'topic': 'list.reordered',
          'items': '["Item 1", "Item 2", "Item 3"]'
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
          'items': '["Edit", "Delete", "Share"]'
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
