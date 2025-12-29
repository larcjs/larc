# Data Fetching and APIs

Quick reference for API integration and data fetching in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 11.

## Overview

Modern web applications fetch data from APIs using REST, GraphQL, or WebSockets. LARC provides components and patterns for handling async data loading, caching, error recovery, and real-time updates.

**Key Concepts**:
- REST APIs: Standard HTTP methods (GET, POST, PUT, DELETE)
- GraphQL: Query-based data fetching with precise field selection
- Error handling: Retry logic, fallbacks, user feedback
- Caching strategies: In-memory, localStorage, IndexedDB
- Loading states: Skeleton screens, spinners, optimistic updates

## Quick Example

```javascript
class ProductList extends LarcComponent {
  constructor() {
    super();
    this.products = [];
    this.loading = true;
    this.error = null;
  }

  async connectedCallback() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to load products');
      
      this.products = await response.json();
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
      this.render();
    }
  }

  template() {
    if (this.loading) return '<div class="spinner">Loading...</div>';
    if (this.error) return `<div class="error">${this.error}</div>`;

    return `
      <div class="product-list">
        ${this.products.map(p => `
          <div class="product-card">
            <h3>${p.name}</h3>
            <p>${p.price}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
}
```

## REST API Patterns

| HTTP Method | Purpose | Example |
|-------------|---------|---------|
| GET | Fetch data | `GET /api/products?category=electronics` |
| POST | Create resource | `POST /api/products` + body |
| PUT | Replace resource | `PUT /api/products/123` + body |
| PATCH | Update fields | `PATCH /api/products/123` + partial body |
| DELETE | Remove resource | `DELETE /api/products/123` |

### REST Example with Error Handling

```javascript
async createProduct(data) {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }

    return await response.json();
  } catch (err) {
    console.error('Create product failed:', err);
    throw err;
  }
}
```

## GraphQL Integration

### Basic Query

```javascript
async fetchUser(userId) {
  const query = `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
        posts {
          id
          title
        }
      }
    }
  `;

  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { id: userId }
    })
  });

  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  
  return result.data.user;
}
```

### Mutation Example

```javascript
async updateUser(userId, updates) {
  const mutation = `
    mutation UpdateUser($id: ID!, $input: UserInput!) {
      updateUser(id: $id, input: $input) {
        id
        name
        email
      }
    }
  `;

  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: { id: userId, input: updates }
    })
  });

  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  
  return result.data.updateUser;
}
```

## Caching Strategies

| Strategy | Implementation | Use Case |
|----------|---------------|----------|
| **In-memory** | Store in component property | Session-only data |
| **localStorage** | `localStorage.setItem()` | Small datasets, settings |
| **IndexedDB** | `pan-idb` component | Large datasets, offline support |
| **HTTP cache** | `Cache-Control` headers | Static assets, CDN content |
| **Stale-while-revalidate** | Show cached + fetch fresh | Balance speed + freshness |

### Stale-While-Revalidate Pattern

```javascript
async loadProducts() {
  // Show cached data immediately
  const cached = this.getCache('products');
  if (cached) {
    this.products = cached;
    this.render();
  }

  // Fetch fresh data in background
  try {
    const response = await fetch('/api/products');
    const fresh = await response.json();
    
    this.products = fresh;
    this.setCache('products', fresh, 5 * 60 * 1000); // 5 min TTL
    this.render();
  } catch (err) {
    // Keep showing cached data on error
    if (!cached) {
      this.error = err.message;
      this.render();
    }
  }
}

getCache(key) {
  const item = localStorage.getItem(`cache:${key}`);
  if (!item) return null;
  
  const { data, expires } = JSON.parse(item);
  if (Date.now() > expires) return null;
  
  return data;
}

setCache(key, data, ttl) {
  localStorage.setItem(`cache:${key}`, JSON.stringify({
    data,
    expires: Date.now() + ttl
  }));
}
```

## Error Recovery Patterns

### Retry with Exponential Backoff

```javascript
async fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      
      if (response.status >= 500 && i < maxRetries - 1) {
        // Retry on server errors
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Fallback Data

```javascript
async loadProducts() {
  try {
    const response = await fetch('/api/products');
    this.products = await response.json();
  } catch (err) {
    console.error('API failed, using fallback data:', err);
    this.products = this.getFallbackProducts();
  }
  
  this.render();
}

getFallbackProducts() {
  return [
    { id: 1, name: 'Product 1', price: 19.99 },
    { id: 2, name: 'Product 2', price: 29.99 }
  ];
}
```

## Loading States

### Skeleton Screens

```javascript
template() {
  if (this.loading) {
    return `
      <div class="product-list">
        ${Array(6).fill(0).map(() => `
          <div class="product-card skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-price"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  return this.renderProducts();
}
```

### Progressive Loading

```javascript
async connectedCallback() {
  // Load critical data first
  await this.loadSummary();
  this.render();

  // Load details in background
  await this.loadDetails();
  this.render();
}
```

## Component Reference

- **pan-data-connector**: REST API integration - See Chapter 20
- **pan-graphql-connector**: GraphQL integration - See Chapter 20
- **pan-websocket**: WebSocket connection management - See Chapter 20
- **pan-idb**: IndexedDB caching - See Chapter 18

## Complete Example: Product Search with Caching

```javascript
class ProductSearch extends LarcComponent {
  constructor() {
    super();
    this.products = [];
    this.loading = false;
    this.error = null;
    this.searchTerm = '';
    this.debounceTimer = null;
  }

  async connectedCallback() {
    // Load cached results
    const cached = this.getCache('products-all');
    if (cached) {
      this.products = cached;
      this.render();
    }

    // Fetch fresh data
    await this.loadProducts();
  }

  async loadProducts(search = '') {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const url = search
        ? `/api/products/search?q=${encodeURIComponent(search)}`
        : '/api/products';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');

      this.products = await response.json();
      
      // Cache full product list only
      if (!search) {
        this.setCache('products-all', this.products, 5 * 60 * 1000);
      }
    } catch (err) {
      this.error = err.message;
    } finally {
      this.loading = false;
      this.render();
    }
  }

  handleSearchInput(event) {
    this.searchTerm = event.target.value;
    
    // Debounce search
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.loadProducts(this.searchTerm);
    }, 300);
  }

  getCache(key) {
    const item = localStorage.getItem(`cache:${key}`);
    if (!item) return null;
    
    const { data, expires } = JSON.parse(item);
    return Date.now() < expires ? data : null;
  }

  setCache(key, data, ttl) {
    localStorage.setItem(`cache:${key}`, JSON.stringify({
      data,
      expires: Date.now() + ttl
    }));
  }

  template() {
    return `
      <div class="product-search">
        <input
          type="search"
          placeholder="Search products..."
          value="${this.searchTerm}"
          oninput="this.handleSearchInput(event)">

        ${this.loading ? '<div class="spinner">Searching...</div>' : ''}
        ${this.error ? `<div class="error">${this.error}</div>` : ''}

        <div class="product-grid">
          ${this.products.map(product => `
            <div class="product-card">
              <img src="${product.image}" alt="${product.name}">
              <h3>${product.name}</h3>
              <p class="price">$${product.price}</p>
              <button onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
          `).join('')}
        </div>

        ${this.products.length === 0 && !this.loading ? '
          <div class="no-results">No products found</div>
        ' : ''}
      </div>
    `;
  }
}

customElements.define('product-search', ProductSearch);
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 11 (Data Fetching and APIs)
- **Components**: Chapter 20 (pan-data-connector, pan-graphql-connector, pan-websocket)
- **Patterns**: Appendix E (API Integration Patterns)
- **Related**: Chapter 4 (State Management), Chapter 9 (Realtime Features)

## Common Issues

### Issue: CORS errors in development
**Problem**: `Access-Control-Allow-Origin` errors
**Solution**: Configure dev server proxy or add CORS headers to API

### Issue: Stale cache data
**Problem**: Users see outdated information
**Solution**: Implement cache invalidation with TTL, version keys, or manual clear

### Issue: Request waterfall
**Problem**: Sequential requests slow down page load
**Solution**: Batch requests, use GraphQL, or fetch data in parallel

### Issue: Memory leaks from pending requests
**Problem**: Component unmounts but fetch continues
**Solution**: Use AbortController to cancel requests in `disconnectedCallback()`

### Issue: Authentication tokens expired
**Problem**: 401 errors on API calls
**Solution**: Implement token refresh interceptor before retrying failed requests

See *Learning LARC* Chapter 11 for detailed API patterns, authentication flows, and advanced caching strategies.
