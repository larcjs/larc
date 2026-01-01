# Business Logic Patterns

In the previous chapters, we've learned how to build components, communicate via the PAN bus, and manage state. But when building real-world applications, you'll inevitably need to inject your own custom business logic: validation rules, pricing calculations, access control, analytics tracking, and countless other domain-specific concerns.

A common question developers ask when adopting LARC is: *"Where do I put my business logic?"* This chapter explores the architectural patterns for integrating business logic into LARC applications, helping you make informed decisions about code organization and separation of concerns.

## The Philosophy: Separation of Concerns

LARC's architecture naturally encourages a clean separation between:

- **Components**: UI and interaction concerns
- **PAN Bus**: Communication layer
- **Business Logic**: Domain rules and workflows

This separation isn't just academic—it makes your code:

- **Testable**: Logic can be tested independently of UI
- **Maintainable**: Changes to business rules don't require touching components
- **Reusable**: Logic can be shared across multiple components
- **Flexible**: Easy to modify workflows without refactoring components

Let's explore the patterns that make this possible.

## Pattern 1: PAN Bus Listeners (Recommended)

The most common and recommended approach is to create separate modules that listen to PAN bus events and implement your business logic. This pattern treats business logic as a **first-class concern**, separate from both UI components and state management.

### When to Use

Use PAN bus listeners when you need to:

- Coordinate behavior across multiple components
- Implement cross-cutting concerns (analytics, logging, validation)
- Add business rules that aren't tied to a specific component
- Keep components generic and reusable

### Basic Implementation

Let's build an e-commerce application where we need to enforce business rules around cart operations:

```javascript
// business-logic/cart-rules.js
import { pan } from '@larcjs/core';

class CartBusinessRules {
  constructor() {
    this.maxItemsPerOrder = 50;
    this.maxQuantityPerItem = 10;
  }

  init() {
    // Subscribe to cart events
    pan.subscribe('cart.item.add', this.handleItemAdd.bind(this));
    pan.subscribe('cart.item.update', this.handleItemUpdate.bind(this));
    pan.subscribe('cart.checkout.start', this.handleCheckout.bind(this));
  }

  async handleItemAdd(data) {
    console.log('Business rule: Validating item add', data);

    // Check current cart state
    const currentCart = await pan.request('cart.get');

    // Business Rule 1: Maximum items per order
    if (currentCart.items.length >= this.maxItemsPerOrder) {
      pan.publish('cart.error', {
        code: 'MAX_ITEMS_EXCEEDED',
        message: `Cannot add more than ${this.maxItemsPerOrder} items to cart`
      });
      return;
    }

    // Business Rule 2: Check inventory
    const available = await this.checkInventory(data.product.id);
    if (!available || available < data.quantity) {
      pan.publish('cart.error', {
        code: 'INSUFFICIENT_INVENTORY',
        message: 'This item is currently out of stock',
        product: data.product
      });
      return;
    }

    // Business Rule 3: Apply pricing
    const pricing = await this.calculatePrice(data.product, data.quantity);

    // All validations passed - allow the add and publish enriched data
    pan.publish('cart.item.validated', {
      ...data,
      pricing,
      timestamp: Date.now()
    });
  }

  async handleItemUpdate(data) {
    // Business Rule: Quantity limits
    if (data.quantity > this.maxQuantityPerItem) {
      pan.publish('cart.error', {
        code: 'MAX_QUANTITY_EXCEEDED',
        message: `Maximum ${this.maxQuantityPerItem} per item`
      });
      return;
    }

    // Check inventory for new quantity
    const available = await this.checkInventory(data.productId);
    if (available < data.quantity) {
      pan.publish('cart.error', {
        code: 'INSUFFICIENT_INVENTORY',
        message: `Only ${available} available`,
        available
      });
      return;
    }

    pan.publish('cart.item.update.validated', data);
  }

  async handleCheckout(data) {
    // Business Rule: Minimum order value
    const cart = await pan.request('cart.get');
    const total = cart.items.reduce((sum, item) => sum + item.total, 0);

    if (total < 10) {
      pan.publish('checkout.error', {
        code: 'MINIMUM_ORDER_NOT_MET',
        message: 'Minimum order value is $10',
        current: total,
        required: 10
      });
      return;
    }

    // Business Rule: User must be logged in
    const user = await pan.request('auth.user.get');
    if (!user) {
      pan.publish('checkout.error', {
        code: 'AUTH_REQUIRED',
        message: 'Please log in to continue'
      });
      return;
    }

    pan.publish('checkout.validated', { cart, user });
  }

  async checkInventory(productId) {
    // In real app, this would call your backend
    const response = await fetch(`/api/inventory/${productId}`);
    const data = await response.json();
    return data.available;
  }

  async calculatePrice(product, quantity) {
    // Apply business logic: bulk discounts, promotions, etc.
    let unitPrice = product.price;

    // Bulk discount: 10% off for 5+ items
    if (quantity >= 5) {
      unitPrice = unitPrice * 0.9;
    }

    // TODO: Check for active promotions
    // TODO: Apply user-specific pricing

    return {
      unitPrice,
      quantity,
      subtotal: unitPrice * quantity,
      discount: quantity >= 5 ? (product.price - unitPrice) * quantity : 0
    };
  }
}

// Initialize and export
const cartRules = new CartBusinessRules();
export default cartRules;
```

Now in your main application file:

```javascript
// app.js
import { pan } from '@larcjs/core';
import cartRules from './business-logic/cart-rules.js';

// Initialize business logic
cartRules.init();

// Your components just publish events - the business logic handles the rest
// No business logic in components themselves!
```

Your components remain simple and focused on UI:

```javascript
// components/product-card.js
class ProductCard extends HTMLElement {
  // ... component setup ...

  handleAddToCart() {
    // Just publish the event - business logic will validate
    pan.publish('cart.item.add', {
      product: this.product,
      quantity: this.quantity
    });

    // Show optimistic UI
    this.showAddingState();
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen for validation results
    this.unsubscribers = [
      pan.subscribe('cart.item.validated', (data) => {
        if (data.product.id === this.product.id) {
          this.showSuccess();
        }
      }),

      pan.subscribe('cart.error', (error) => {
        this.showError(error.message);
      })
    ];
  }
}
```

### Advantages

This pattern provides several key benefits:

1. **Separation of Concerns**: Components handle UI, business logic modules handle rules
2. **Easy Testing**: Test business logic without rendering components
3. **Centralized Rules**: All cart rules in one place, easy to modify
4. **Reusable**: Multiple components can trigger the same logic
5. **Flexible**: Easy to add, remove, or modify rules

### Advanced: Composable Business Logic

For larger applications, you can compose multiple business logic modules:

```javascript
// business-logic/index.js
import { pan } from '@larcjs/core';
import cartRules from './cart-rules.js';
import pricingRules from './pricing-rules.js';
import inventoryRules from './inventory-rules.js';
import analyticsRules from './analytics-rules.js';

export function initBusinessLogic() {
  console.log('Initializing business logic...');

  // Initialize all business logic modules
  cartRules.init();
  pricingRules.init();
  inventoryRules.init();
  analyticsRules.init();

  console.log('Business logic ready');
}
```

```javascript
// app.js
import { initBusinessLogic } from './business-logic/index.js';

// Single call to initialize all business logic
initBusinessLogic();
```

## Pattern 2: Extending Components

Sometimes you need to add business logic directly to a component, especially when:

- The logic is specific to one component type
- You need to override component behavior
- You're creating specialized versions of generic components

### When to Use

Use component extension when:

- Logic is tightly coupled to component rendering
- You need access to component internals (Shadow DOM, private methods)
- Creating specialized variants of base components
- Logic doesn't need to be shared across different component types

### Implementation

Let's extend a generic product card with business-specific behavior:

```javascript
// components/base/product-card.js
export class ProductCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Base styles */
      </style>
      <div class="card">
        <img src="${this.product.image}" alt="${this.product.name}">
        <h3>${this.product.name}</h3>
        <p class="price">${this.formatPrice(this.product.price)}</p>
        <button class="add-to-cart">Add to Cart</button>
      </div>
    `;

    this.shadowRoot.querySelector('.add-to-cart')
      .addEventListener('click', () => this.handleAddToCart());
  }

  handleAddToCart() {
    pan.publish('cart.item.add', {
      product: this.product,
      quantity: 1
    });
  }

  formatPrice(price) {
    return `$${price.toFixed(2)}`;
  }

  get product() {
    return JSON.parse(this.getAttribute('product'));
  }
}

customElements.define('product-card', ProductCard);
```

Now extend it with business-specific logic:

```javascript
// components/premium-product-card.js
import { ProductCard } from './base/product-card.js';

export class PremiumProductCard extends ProductCard {
  connectedCallback() {
    super.connectedCallback();

    // Add business-specific subscriptions
    this._unsubscribers = [
      pan.subscribe('pricing.update', this.handlePriceUpdate.bind(this)),
      pan.subscribe('user.tier.changed', this.handleTierChange.bind(this))
    ];

    // Initialize premium features
    this.loadMemberPricing();
  }

  async loadMemberPricing() {
    const user = await pan.request('auth.user.get');
    if (user?.tier === 'premium') {
      this.applyPremiumDiscount();
    }
  }

  applyPremiumDiscount() {
    // Business Rule: 15% discount for premium members
    const discount = 0.15;
    const originalPrice = this.product.price;
    const discountedPrice = originalPrice * (1 - discount);

    this.product.price = discountedPrice;
    this.product.originalPrice = originalPrice;

    this.render(); // Re-render with new price
  }

  render() {
    // Call parent render
    super.render();

    // Add premium badge if applicable
    if (this.product.originalPrice) {
      this.addPremiumBadge();
    }
  }

  addPremiumBadge() {
    const badge = document.createElement('div');
    badge.className = 'premium-badge';
    badge.innerHTML = `
      <style>
        .premium-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: gold;
          color: black;
          padding: 5px 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        .original-price {
          text-decoration: line-through;
          color: #999;
          font-size: 0.9em;
        }
      </style>
      <span>Premium Member</span>
      <div class="original-price">
        ${this.formatPrice(this.product.originalPrice)}
      </div>
    `;

    this.shadowRoot.querySelector('.card').prepend(badge);
  }

  async handleAddToCart() {
    // Business validation before adding
    const canAddPremiumItem = await this.validatePremiumAccess();

    if (!canAddPremiumItem) {
      pan.publish('app.error', {
        message: 'Premium membership required for this product'
      });
      return;
    }

    // Track premium conversions
    this.trackPremiumConversion();

    // Call parent behavior
    super.handleAddToCart();
  }

  async validatePremiumAccess() {
    if (!this.product.premiumOnly) return true;

    const user = await pan.request('auth.user.get');
    return user?.tier === 'premium';
  }

  trackPremiumConversion() {
    pan.publish('analytics.track', {
      event: 'premium_product_add_to_cart',
      product: this.product.id,
      price: this.product.price,
      discount: this.product.originalPrice - this.product.price
    });
  }

  handlePriceUpdate(data) {
    if (data.productId === this.product.id) {
      this.product.price = data.newPrice;
      this.render();
    }
  }

  handleTierChange(data) {
    // User tier changed - recalculate pricing
    this.loadMemberPricing();
  }

  disconnectedCallback() {
    // Clean up subscriptions
    this._unsubscribers.forEach(unsub => unsub());
    super.disconnectedCallback?.();
  }
}

customElements.define('premium-product-card', PremiumProductCard);
```

### When This Makes Sense

Component extension works well when:

1. **The logic changes how the component renders or behaves**
2. **You need multiple variants of a base component** (premium, free, guest, etc.)
3. **Business logic is closely tied to component lifecycle**

However, be cautious: overuse of extension can lead to:

- Tight coupling between business logic and UI
- Harder to test business rules independently
- Duplication if multiple components need the same logic

## Pattern 3: Wrapper Components

Wrapper components let you add behavior around existing components without modifying them. This is useful when you want to:

- Add behavior to third-party components
- Keep base components pristine
- Compose behaviors dynamically

### Implementation

```javascript
// components/business-wrapper.js
class BusinessWrapper extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    // Intercept events from slotted content
    this.addEventListener('add-to-cart', this.handleBusinessLogic.bind(this));

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .validation-message {
          color: red;
          padding: 10px;
          background: #fee;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .validation-message.hidden {
          display: none;
        }
      </style>
      <div class="validation-message hidden"></div>
      <slot></slot>
    `;
  }

  async handleBusinessLogic(e) {
    // Stop the event from propagating immediately
    e.stopPropagation();

    // Apply business validation
    const validation = await this.validateBusinessRules(e.detail);

    if (!validation.valid) {
      this.showError(validation.message);
      return;
    }

    // Validation passed - let the event continue
    pan.publish('cart.item.add', e.detail);
  }

  async validateBusinessRules(data) {
    // Check user eligibility
    const user = await pan.request('auth.user.get');
    if (!user) {
      return {
        valid: false,
        message: 'Please log in to add items to cart'
      };
    }

    // Check age restriction
    if (data.product.ageRestricted && user.age < 21) {
      return {
        valid: false,
        message: 'This product requires age verification (21+)'
      };
    }

    // Check geographic restriction
    if (data.product.geoRestricted && !this.isAllowedRegion(user.region)) {
      return {
        valid: false,
        message: 'This product is not available in your region'
      };
    }

    return { valid: true };
  }

  isAllowedRegion(region) {
    // Business logic for regional restrictions
    const allowedRegions = ['US', 'CA', 'UK'];
    return allowedRegions.includes(region);
  }

  showError(message) {
    const errorEl = this.shadowRoot.querySelector('.validation-message');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');

    setTimeout(() => {
      errorEl.classList.add('hidden');
    }, 5000);
  }
}

customElements.define('business-wrapper', BusinessWrapper);
```

Usage:

```html
<!-- Wrap any component with business logic -->
<business-wrapper>
  <product-card product-id="123"></product-card>
</business-wrapper>

<business-wrapper>
  <quick-buy-button product-id="456"></quick-buy-button>
</business-wrapper>
```

The wrapper intercepts events and applies business logic **without modifying** the wrapped components.

## Pattern 4: Behavior Mixins

Mixins let you share behavior across multiple component types. This is useful for cross-cutting concerns like analytics, logging, or validation.

### Implementation

```javascript
// mixins/analytics-mixin.js
export const AnalyticsMixin = (BaseClass) => class extends BaseClass {
  track(event, data = {}) {
    pan.publish('analytics.track', {
      event,
      data,
      component: this.tagName.toLowerCase(),
      timestamp: Date.now(),
      ...this.getAnalyticsContext()
    });
  }

  trackInteraction(element, action) {
    this.track(`${element}.${action}`, {
      element,
      action
    });
  }

  getAnalyticsContext() {
    // Add common context to all analytics events
    return {
      page: window.location.pathname,
      referrer: document.referrer
    };
  }

  connectedCallback() {
    super.connectedCallback?.();
    this.track('component.mounted', { id: this.id });
  }

  disconnectedCallback() {
    this.track('component.unmounted', { id: this.id });
    super.disconnectedCallback?.();
  }
};
```

```javascript
// mixins/validation-mixin.js
export const ValidationMixin = (BaseClass) => class extends BaseClass {
  async validate(data, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      if (rule.required && !value) {
        errors.push(`${field} is required`);
      }

      if (rule.min && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }

      if (rule.max && value > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} is invalid`);
      }

      if (rule.custom) {
        const customError = await rule.custom(value, data);
        if (customError) errors.push(customError);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  showValidationErrors(errors) {
    pan.publish('validation.errors', {
      component: this.tagName.toLowerCase(),
      errors
    });
  }
};
```

Use mixins to compose behavior:

```javascript
import { AnalyticsMixin } from './mixins/analytics-mixin.js';
import { ValidationMixin } from './mixins/validation-mixin.js';

class CheckoutForm extends ValidationMixin(AnalyticsMixin(HTMLElement)) {
  async handleSubmit() {
    // Use validation from mixin
    const validation = await this.validate(this.formData, {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      cardNumber: {
        required: true,
        custom: async (value) => {
          const valid = await this.validateCard(value);
          return valid ? null : 'Invalid card number';
        }
      }
    });

    if (!validation.valid) {
      this.showValidationErrors(validation.errors);
      return;
    }

    // Use analytics from mixin
    this.track('checkout.submit', {
      amount: this.total,
      items: this.items.length
    });

    // Process checkout
    this.processOrder();
  }
}
```

## Pattern 5: Service Layer

For complex business logic, create a dedicated service layer that components and PAN listeners can both use:

```javascript
// services/pricing-service.js
class PricingService {
  async calculatePrice(product, quantity, user) {
    let price = product.basePrice;

    // Business Rule: Volume discounts
    if (quantity >= 10) price *= 0.85;
    else if (quantity >= 5) price *= 0.90;

    // Business Rule: Member discounts
    if (user?.tier === 'premium') {
      price *= 0.85;
    } else if (user?.tier === 'gold') {
      price *= 0.90;
    }

    // Business Rule: Active promotions
    const promotions = await this.getActivePromotions(product.id);
    for (const promo of promotions) {
      price = this.applyPromotion(price, promo);
    }

    return {
      unitPrice: price,
      quantity,
      subtotal: price * quantity,
      savings: (product.basePrice - price) * quantity
    };
  }

  async getActivePromotions(productId) {
    const response = await fetch(`/api/promotions?product=${productId}`);
    return response.json();
  }

  applyPromotion(price, promotion) {
    if (promotion.type === 'percentage') {
      return price * (1 - promotion.value / 100);
    } else if (promotion.type === 'fixed') {
      return Math.max(0, price - promotion.value);
    }
    return price;
  }

  async getTax(subtotal, region) {
    const taxRates = {
      'CA': 0.0725,
      'NY': 0.08,
      'TX': 0.0625
    };

    return subtotal * (taxRates[region] || 0);
  }
}

export default new PricingService();
```

Use the service from both components and PAN listeners:

```javascript
// In a component
import pricingService from './services/pricing-service.js';

class ProductCard extends HTMLElement {
  async updatePrice() {
    const user = await pan.request('auth.user.get');
    const pricing = await pricingService.calculatePrice(
      this.product,
      this.quantity,
      user
    );

    this.displayPrice(pricing);
  }
}
```

```javascript
// In business logic
import pricingService from './services/pricing-service.js';

class CartBusinessLogic {
  init() {
    pan.subscribe('cart.item.add', async (data) => {
      const user = await pan.request('auth.user.get');
      const pricing = await pricingService.calculatePrice(
        data.product,
        data.quantity,
        user
      );

      pan.publish('cart.item.priced', { ...data, pricing });
    });
  }
}
```

## Decision Matrix

Here's how to choose the right pattern:

| Scenario | Recommended Pattern | Why |
|----------|-------------------|-----|
| Cross-component coordination | PAN Bus Listeners | Decoupled, flexible |
| Analytics/logging | Mixins | Reusable across all components |
| Validation before actions | PAN Bus Listeners | Centralized rules |
| Component-specific UI logic | Extend Component | Access to internals |
| Add behavior to third-party components | Wrapper | Non-invasive |
| Complex business calculations | Service Layer | Testable, reusable |
| Component variants (premium, free) | Extend Component | Clear inheritance |
| Feature flags / A-B testing | Wrapper or PAN Listeners | Easy to toggle |

## Real-World Example: E-Commerce Checkout

Let's see how these patterns work together in a complete checkout flow:

```javascript
// services/checkout-service.js
class CheckoutService {
  async processOrder(cart, paymentInfo, shippingInfo) {
    // Complex business logic
    const pricing = await this.calculateFinalPricing(cart);
    const shipping = await this.calculateShipping(cart, shippingInfo);
    const tax = await this.calculateTax(pricing.subtotal, shippingInfo.state);

    return {
      items: cart.items,
      pricing,
      shipping,
      tax,
      total: pricing.subtotal + shipping.cost + tax
    };
  }

  async calculateFinalPricing(cart) {
    // Apply all discounts, coupons, etc.
    let subtotal = 0;
    let savings = 0;

    for (const item of cart.items) {
      const itemPricing = await pricingService.calculatePrice(
        item.product,
        item.quantity,
        cart.user
      );
      subtotal += itemPricing.subtotal;
      savings += itemPricing.savings;
    }

    return { subtotal, savings };
  }

  async calculateShipping(cart, shippingInfo) {
    // Shipping business rules
    if (cart.total >= 50) {
      return { method: 'standard', cost: 0, freeShipping: true };
    }

    const weight = cart.items.reduce((sum, item) => sum + item.weight, 0);
    const zone = this.getShippingZone(shippingInfo.state);

    return {
      method: 'standard',
      cost: this.calculateShippingCost(weight, zone),
      freeShipping: false
    };
  }

  calculateShippingCost(weight, zone) {
    const baseRate = { 1: 5, 2: 7, 3: 10 };
    return baseRate[zone] + (weight > 5 ? (weight - 5) * 0.5 : 0);
  }

  getShippingZone(state) {
    const zones = {
      1: ['CA', 'OR', 'WA'],
      2: ['NV', 'AZ', 'UT', 'ID'],
      3: [] // All other states
    };

    for (const [zone, states] of Object.entries(zones)) {
      if (states.includes(state)) return parseInt(zone);
    }
    return 3;
  }

  async calculateTax(subtotal, state) {
    return pricingService.getTax(subtotal, state);
  }
}

export default new CheckoutService();
```

```javascript
// business-logic/checkout-rules.js
import checkoutService from '../services/checkout-service.js';

class CheckoutBusinessRules {
  init() {
    pan.subscribe('checkout.start', this.handleCheckoutStart.bind(this));
    pan.subscribe('checkout.submit', this.handleCheckoutSubmit.bind(this));
  }

  async handleCheckoutStart(data) {
    // Business validations
    const cart = await pan.request('cart.get');
    const user = await pan.request('auth.user.get');

    // Validation 1: Cart not empty
    if (!cart.items.length) {
      pan.publish('checkout.error', {
        code: 'EMPTY_CART',
        message: 'Your cart is empty'
      });
      return;
    }

    // Validation 2: User logged in
    if (!user) {
      pan.publish('checkout.error', {
        code: 'AUTH_REQUIRED',
        message: 'Please log in to continue'
      });
      return;
    }

    // Validation 3: Inventory check
    for (const item of cart.items) {
      const available = await this.checkInventory(item.product.id);
      if (available < item.quantity) {
        pan.publish('checkout.error', {
          code: 'INSUFFICIENT_INVENTORY',
          message: `Only ${available} of "${item.product.name}" available`,
          item
        });
        return;
      }
    }

    // All validations passed
    pan.publish('checkout.validated', { cart, user });
  }

  async handleCheckoutSubmit(data) {
    try {
      // Process order through service
      const order = await checkoutService.processOrder(
        data.cart,
        data.paymentInfo,
        data.shippingInfo
      );

      // Submit to backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error('Order submission failed');
      }

      const result = await response.json();

      // Success
      pan.publish('checkout.success', {
        orderId: result.orderId,
        order: result
      });

      // Clear cart
      pan.publish('cart.clear');

    } catch (error) {
      pan.publish('checkout.error', {
        code: 'SUBMISSION_FAILED',
        message: 'Unable to process order. Please try again.',
        error
      });
    }
  }

  async checkInventory(productId) {
    const response = await fetch(`/api/inventory/${productId}`);
    const data = await response.json();
    return data.available;
  }
}

export default new CheckoutBusinessRules();
```

The checkout component stays simple:

```javascript
// components/checkout-form.js
class CheckoutForm extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.render();
    this.attachEventListeners();
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this._unsubscribers = [
      pan.subscribe('checkout.validated', () => {
        this.showCheckoutForm();
      }),

      pan.subscribe('checkout.error', (error) => {
        this.showError(error.message);
      }),

      pan.subscribe('checkout.success', (data) => {
        this.showSuccess(data.orderId);
      })
    ];
  }

  handleSubmit(e) {
    e.preventDefault();

    // Just collect data and publish - business logic handles the rest
    pan.publish('checkout.submit', {
      cart: this.cart,
      paymentInfo: this.getPaymentInfo(),
      shippingInfo: this.getShippingInfo()
    });

    this.showProcessing();
  }

  // UI methods only - no business logic
  showCheckoutForm() { /* ... */ }
  showError(message) { /* ... */ }
  showSuccess(orderId) { /* ... */ }
  showProcessing() { /* ... */ }
}
```

## Testing Business Logic

One of the biggest advantages of separating business logic is testability. Here's how to test each pattern:

### Testing PAN Bus Listeners

```javascript
// __tests__/cart-rules.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pan } from '@larcjs/core';
import cartRules from '../business-logic/cart-rules.js';

describe('Cart Business Rules', () => {
  beforeEach(() => {
    // Reset PAN bus between tests
    pan.clear();
    cartRules.init();
  });

  it('should reject adding more than max items', async () => {
    // Mock cart with max items
    pan.respond('cart.get', () => ({
      items: new Array(50).fill({})
    }));

    const errorHandler = vi.fn();
    pan.subscribe('cart.error', errorHandler);

    // Try to add another item
    await pan.publish('cart.item.add', {
      product: { id: 1, name: 'Test' },
      quantity: 1
    });

    expect(errorHandler).toHaveBeenCalledWith({
      code: 'MAX_ITEMS_EXCEEDED',
      message: expect.stringContaining('50 items')
    });
  });

  it('should apply bulk discount for 5+ items', async () => {
    const validated = vi.fn();
    pan.subscribe('cart.item.validated', validated);

    await pan.publish('cart.item.add', {
      product: { id: 1, name: 'Test', price: 100 },
      quantity: 5
    });

    expect(validated).toHaveBeenCalledWith(
      expect.objectContaining({
        pricing: expect.objectContaining({
          unitPrice: 90, // 10% discount
          discount: 50
        })
      })
    );
  });
});
```

### Testing Services

```javascript
// __tests__/pricing-service.test.js
import { describe, it, expect } from 'vitest';
import pricingService from '../services/pricing-service.js';

describe('Pricing Service', () => {
  it('should apply volume discount', async () => {
    const product = { basePrice: 100 };
    const pricing = await pricingService.calculatePrice(product, 10, null);

    expect(pricing.unitPrice).toBe(85); // 15% off for 10+
    expect(pricing.subtotal).toBe(850);
  });

  it('should stack member and volume discounts', async () => {
    const product = { basePrice: 100 };
    const user = { tier: 'premium' };

    const pricing = await pricingService.calculatePrice(product, 10, user);

    // 15% volume + 15% premium = 72.25
    expect(pricing.unitPrice).toBe(72.25);
  });
});
```

## Best Practices

### 1. Keep Components Dumb

Components should focus on UI and user interaction. They publish events but don't implement business rules.

**Good:**
```javascript
handleAddToCart() {
  pan.publish('cart.item.add', { product: this.product });
}
```

**Bad:**
```javascript
async handleAddToCart() {
  // Business logic in component - hard to test and reuse
  const inventory = await fetch('/api/inventory');
  if (inventory < this.quantity) {
    alert('Out of stock');
    return;
  }

  const user = await fetch('/api/user');
  if (user.age < 21 && this.product.ageRestricted) {
    alert('Age restricted');
    return;
  }

  // ... more business logic
}
```

### 2. Use Services for Complex Logic

If business logic involves multiple steps, calculations, or external APIs, put it in a service:

```javascript
// Good: Service handles complexity
const pricing = await pricingService.calculatePrice(product, quantity, user);

// Bad: Business logic scattered across components and PAN listeners
const basePrice = product.price;
const volumeDiscount = quantity >= 10 ? 0.15 : 0;
const memberDiscount = user?.tier === 'premium' ? 0.15 : 0;
// ... etc
```

### 3. Make Business Logic Observable

Use PAN bus to make business logic transparent:

```javascript
class OrderProcessor {
  async processOrder(order) {
    pan.publish('order.processing.start', { orderId: order.id });

    try {
      await this.validateOrder(order);
      pan.publish('order.validated', { orderId: order.id });

      await this.chargePayment(order);
      pan.publish('order.charged', { orderId: order.id });

      await this.createShipment(order);
      pan.publish('order.shipped', { orderId: order.id });

      pan.publish('order.complete', { orderId: order.id });
    } catch (error) {
      pan.publish('order.failed', { orderId: order.id, error });
    }
  }
}
```

Now other parts of your app can react to these events (analytics, notifications, UI updates, etc.).

### 4. Document Business Rules

Make business rules explicit and documented:

```javascript
/**
 * Shopping Cart Business Rules
 *
 * 1. Maximum 50 items per order
 * 2. Maximum 10 quantity per item
 * 3. Free shipping over $50
 * 4. Volume discounts:
 *    - 5-9 items: 10% off
 *    - 10+ items: 15% off
 * 5. Member discounts:
 *    - Premium: 15% off
 *    - Gold: 10% off
 * 6. Minimum order value: $10
 */
class CartBusinessRules {
  // Implementation
}
```

### 5. Use Feature Flags

Make business logic toggleable:

```javascript
class CheckoutRules {
  constructor() {
    this.features = {
      guestCheckout: true,
      expressCheckout: false,
      digitalWallet: true
    };
  }

  async handleCheckout(data) {
    if (!this.features.guestCheckout && !data.user) {
      pan.publish('checkout.error', {
        message: 'Account required for checkout'
      });
      return;
    }

    // ... rest of logic
  }
}
```

## Summary

When integrating business logic into LARC applications:

1. **Default to PAN Bus listeners** for most business logic - it's decoupled, testable, and flexible
2. **Use services** for complex calculations and workflows
3. **Extend components** only when logic is tightly coupled to UI
4. **Use mixins** for cross-cutting concerns like analytics
5. **Wrap components** when adding behavior to third-party code
6. **Keep components dumb** - they publish events, business logic handles the rest

This separation of concerns makes your application:

- **Easier to test** - business logic without rendering components
- **More maintainable** - business rules in one place
- **More flexible** - easy to change rules without touching UI
- **More reusable** - logic can be shared across components

In the next chapter, we'll explore routing and navigation, building on these patterns to create complete single-page applications.

---

## Further Reading

**For business logic and architecture patterns:**
- *Building with LARC* Chapter 15: Advanced Patterns - Architecture patterns and middleware
- *Building with LARC* Chapter 4: State Management - State management strategies
- *Building with LARC* Appendix E: Recipes and Patterns - Design patterns and anti-patterns
