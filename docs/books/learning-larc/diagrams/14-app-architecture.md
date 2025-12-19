# Complete Application Architecture

## E-Commerce Application Example

```mermaid
graph TB
    subgraph Frontend["Frontend - LARC Application"]
        subgraph PagesSub["Pages"]
            Home[home-page]
            ProductsPage[products-page]
            Product[product-detail-page]
            CartPage[cart-page]
            Checkout[checkout-page]
            Profile[user-profile-page]
        end

        subgraph LayoutComp["Layout Components"]
            Header[app-header]
            Nav[main-nav]
            Footer[app-footer]
            Sidebar[user-sidebar]
        end

        subgraph FeatureComp["Feature Components"]
            ProductCard[product-card]
            CartWidget[cart-widget]
            SearchBox[search-box]
            FilterPanel[filter-panel]
            UserMenu[user-menu]
        end

        subgraph UIComp["UI Components"]
            Button[pan-button]
            Modal[pan-modal]
            Toast[toast-notification]
            Spinner[loading-spinner]
        end

        subgraph CommLayer["Communication Layer"]
            PAN[PAN Bus]
        end

        subgraph StateMgmt["State Management"]
            AuthStore[Authentication State]
            CartStoreSub[Shopping Cart State]
            UserPrefs[User Preferences]
        end

        subgraph DataLayer["Data Layer"]
            API[API Client]
            Cache["Cache Layer IndexedDB"]
            SyncQueue[Offline Sync Queue]
        end
    end

    subgraph BackendSvc["Backend Services"]
        subgraph APISrv["API Server"]
            REST["REST API Node.js/Express"]
            Auth["Auth Service JWT"]
            ProductsSvc[Product Service]
            Orders[Order Service]
            Payments[Payment Service]
        end

        subgraph Database["Database"]
            DB[(PostgreSQL)]
        end

        subgraph ExtSvc["External Services"]
            Stripe[Stripe API]
            Email[Email Service]
            Analytics[Analytics]
        end
    end

    PagesSub --> LayoutComp
    PagesSub --> FeatureComp
    FeatureComp --> UIComp

    PagesSub <--> PAN
    LayoutComp <--> PAN
    FeatureComp <--> PAN

    PAN <--> StateMgmt
    StateMgmt <--> DataLayer

    DataLayer <-.HTTP.-> REST
    DataLayer <-.Cache.-> Cache

    REST --> Auth & ProductsSvc & Orders & Payments
    Auth & ProductsSvc & Orders & Payments <--> DB

    Payments <-.API.-> Stripe
    Orders <-.API.-> Email
    PagesSub <-.Events.-> Analytics

    style PAN fill:#764ba2,color:#fff
    style REST fill:#667eea,color:#fff
    style DB fill:#48bb78,color:#fff
```

## Component Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant ProductCard
    participant PAN as PAN Bus
    participant CartStore
    participant CartWidget
    participant API
    participant Backend

    User->>ProductCard: Click "Add to Cart"

    ProductCard->>PAN: publish('cart.item.add', {product})

    PAN->>CartStore: Receive event
    CartStore->>CartStore: Update cart state
    CartStore->>CartStore: Save to IndexedDB

    CartStore->>PAN: publish('cart.updated', {cart})

    PAN->>CartWidget: Notify subscriber
    CartWidget->>CartWidget: Update badge count

    Note over CartStore,Backend: Background sync
    CartStore->>API: POST /api/cart
    API->>Backend: Sync cart to server
    Backend-->>API: Success
    API-->>CartStore: Confirm sync
```

## Application Startup Sequence

```mermaid
sequenceDiagram
    participant Browser
    participant HTML
    participant ImportMap
    participant Router
    participant Auth
    participant App

    Browser->>HTML: Load index.html

    HTML->>ImportMap: Parse import map
    ImportMap->>ImportMap: Resolve @larcjs/core

    HTML->>App: Load app.js module

    App->>Auth: Initialize auth service
    Auth->>Auth: Check localStorage for token

    alt Token exists
        Auth->>Auth: Validate token
        Auth->>PAN: publish('auth.login', {user})
    else No token
        Auth->>PAN: publish('auth.logout')
    end

    App->>Router: Initialize router
    Router->>Router: Parse current URL
    Router->>Router: Match route
    Router->>Page: Render initial page

    Page->>Page: connectedCallback()
    Page->>API: Fetch initial data
    API-->>Page: Data loaded
    Page->>Page: Render complete

    Note over Browser,Page: Application ready
```

## Authentication Flow

```mermaid
graph TB
    Start[User visits /dashboard]

    Start --> Router[Router checks route]
    Router --> Guard{Has auth<br/>guard?}

    Guard -->|Yes| Check{User<br/>authenticated?}
    Guard -->|No| Render[Render page]

    Check -->|Yes| Render
    Check -->|No| Redirect[Redirect to /login]

    Redirect --> Login[login-page]
    Login --> Form[User submits form]

    Form --> API[POST /api/auth/login]
    API --> Validate{Valid<br/>credentials?}

    Validate -->|Yes| Success["Return token, user"]
    Validate -->|No| Error[Return error]

    Success --> Store[Store token in localStorage]
    Store --> Publish["PAN: publish auth.login"]
    Publish --> NavToDash[Navigate to /dashboard]
    NavToDash --> Router

    Error --> ShowError[Show error message]
    ShowError --> Login

    style Check fill:#f59e42,color:#fff
    style Success fill:#48bb78,color:#fff
    style Error fill:#f56565,color:#fff
```

## Data Flow Architecture

```mermaid
graph TB
    subgraph "View Layer"
        Components[Components]
    end

    subgraph "State Layer"
        LocalState[Component State]
        SharedState[Shared State]
        PAN[PAN Bus]
    end

    subgraph "Data Layer"
        Memory[Memory Cache]
        IDB[IndexedDB]
        SyncQueue[Sync Queue]
    end

    subgraph "Network Layer"
        API[API Client]
        WS[WebSocket]
    end

    subgraph "Backend"
        Server[API Server]
        DB[(Database)]
    end

    Components <--> LocalState
    Components <--> PAN
    PAN <--> SharedState

    SharedState <--> Memory
    Memory <--> IDB
    IDB <--> SyncQueue

    Components --> API
    API <--> Server
    SyncQueue --> API

    Components <--> WS
    WS <--> Server

    Server <--> DB

    style PAN fill:#764ba2,color:#fff
    style SharedState fill:#667eea,color:#fff
    style IDB fill:#48bb78,color:#fff
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Dev[Developer]
        Git[Git Repo]

        Dev -->|Push| Git
    end

    subgraph "CI/CD - GitHub Actions"
        CI[CI Pipeline]
        Test[Run Tests]
        Build[Optional Build<br/>Minify assets]

        Git -->|Trigger| CI
        CI --> Test
        Test --> Build
    end

    subgraph "CDN - CloudFlare"
        CDN[Static Assets<br/>JS, CSS, Images]
        Cache[Edge Cache]

        Build -->|Deploy| CDN
        CDN --> Cache
    end

    subgraph "Hosting - Netlify"
        Host[Static Hosting<br/>HTML files]
        SSL[SSL/HTTPS]

        Build -->|Deploy| Host
        Host --> SSL
    end

    subgraph "Backend - AWS"
        API[API Server<br/>EC2/ECS]
        DB[(RDS Database)]
        S3[S3 Storage<br/>User uploads]

        API <--> DB
        API <--> S3
    end

    subgraph "Users"
        Browser[User Browser]

        SSL --> Browser
        Cache --> Browser
        Browser <--> API
    end

    subgraph "Monitoring"
        Errors[Error Tracking<br/>Sentry]
        Analytics[Analytics<br/>Plausible]
        Perf[Performance<br/>Web Vitals]

        Browser -.reports to.-> Errors
        Browser -.reports to.-> Analytics
        Browser -.reports to.-> Perf
    end

    style Git fill:#667eea,color:#fff
    style CDN fill:#48bb78,color:#fff
    style Host fill:#48bb78,color:#fff
    style API fill:#764ba2,color:#fff
```

## Offline-First Architecture

```mermaid
graph TB
    User[User Action]

    User --> UI[Update UI<br/>Optimistic]

    UI --> Local{Online?}

    Local -->|Yes| API[API Call]
    Local -->|No| Queue[Sync Queue]

    API --> Success{Success?}

    Success -->|Yes| Update[Update local state]
    Success -->|No| Retry[Add to retry queue]

    Queue --> Store[Store in IndexedDB]

    Store -.Wait for.-> Online[Go online]
    Online --> Process[Process queue]

    Process --> API

    Retry -.Exponential backoff.-> API

    Update --> Persist[Persist to IndexedDB]

    style UI fill:#48bb78,color:#fff
    style Queue fill:#f59e42,color:#fff
    style Store fill:#48bb78,color:#fff
```

## Real-Time Updates Flow

```mermaid
sequenceDiagram
    participant User1 as User 1 Browser
    participant WS1 as WebSocket Client 1
    participant Server as WebSocket Server
    participant WS2 as WebSocket Client 2
    participant User2 as User 2 Browser

    User1->>WS1: Add item to cart
    WS1->>Server: Send update
    Server->>Server: Update database
    Server->>WS2: Broadcast update
    WS2->>User2: Reflect change in UI

    User2->>WS2: Update quantity
    WS2->>Server: Send update
    Server->>Server: Update database
    Server->>WS1: Broadcast update
    WS1->>User1: Reflect change in UI

    Note over User1,User2: Both users see real-time updates
```

## Error Handling Strategy

```mermaid
graph TB
    Error[Error Occurs]

    Error --> Type{Error Type}

    Type -->|Network| Network[Network Error Handler]
    Type -->|Validation| Validation[Validation Error Handler]
    Type -->|Auth| Auth[Auth Error Handler]
    Type -->|Unknown| Unknown[Unknown Error Handler]

    Network --> Retry{Retry?}
    Retry -->|Yes| Queue[Add to sync queue]
    Retry -->|No| Show[Show error message]

    Validation --> Show
    Auth --> Redirect[Redirect to login]
    Unknown --> Log[Log to Sentry]

    Show --> Toast[Show toast notification]
    Queue --> Toast

    Log --> Toast

    Toast --> User[User sees friendly message]

    style Network fill:#f59e42,color:#fff
    style Validation fill:#f56565,color:#fff
    style Auth fill:#f56565,color:#fff
    style User fill:#48bb78,color:#fff
```

## Performance Optimization Strategy

```mermaid
graph TB
    Load[Initial Load]

    Load --> Critical{Critical<br/>resources?}

    Critical -->|Yes| Priority[Load immediately]
    Critical -->|No| Defer[Defer loading]

    Priority --> Parse[Parse HTML]
    Parse --> Render[First render]

    Defer --> Lazy{Lazy load?}

    Lazy -->|Viewport| Intersection[Intersection Observer]
    Lazy -->|Interaction| Event[Event listener]
    Lazy -->|Time| Timeout[setTimeout]

    Intersection --> LoadWhen[Load when visible]
    Event --> LoadWhen2[Load on click]
    Timeout --> LoadWhen3[Load after delay]

    Render --> Interactive[Time to Interactive]

    LoadWhen --> Hydrate[Hydrate component]
    LoadWhen2 --> Hydrate
    LoadWhen3 --> Hydrate

    style Priority fill:#48bb78,color:#fff
    style Defer fill:#667eea,color:#fff
    style Interactive fill:#48bb78,color:#fff
```
