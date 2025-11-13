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
  }
];

export function getExample(id) {
  return examples.find(ex => ex.id === id);
}

export function getAllExamples() {
  return examples;
}
