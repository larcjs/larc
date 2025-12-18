# Client-Side Routing

## Routing Architecture

```mermaid
graph TB
    subgraph "Browser"
        URL[URL Bar<br/>/users/123]
        History[History API]
        Links["&lt;a href='/users/123'&gt;"]
    end

    subgraph "pan-router"
        Router[Router Component]
        Routes[Route Registry<br/>{path, component, guard}]
        Matcher[Pattern Matcher]
        Outlet[Router Outlet<br/>&lt;div&gt;]
    end

    subgraph "Pages"
        Home[home-page]
        Users[user-page]
        NotFound[not-found-page]
    end

    URL --> Router
    Links -.intercept click.-> Router
    History <-.pushState.-> Router

    Router --> Routes
    Routes --> Matcher
    Matcher -->|match| Outlet

    Outlet -->|render| Home
    Outlet -->|render| Users
    Outlet -->|render| NotFound

    style Router fill:#764ba2,color:#fff
    style Outlet fill:#667eea,color:#fff
```

## Navigation Flow

```mermaid
sequenceDiagram
    participant User
    participant Link as &lt;a href="/users/123"&gt;
    participant Router as pan-router
    participant Guard as Route Guard
    participant Page as user-page
    participant Browser

    User->>Link: Click
    Link->>Router: preventDefault()<br/>navigate('/users/123')

    Router->>Router: Match route pattern
    Router->>Guard: Check guard('auth')

    alt Guard Passes
        Guard-->>Router: true

        Router->>Browser: pushState('/users/123')
        Router->>Router: Extract params {id: '123'}
        Router->>Page: Create component<br/>setAttribute('id', '123')
        Router->>Router: Replace outlet content

        Page->>Page: connectedCallback()
        Page->>Page: Load data
    else Guard Fails
        Guard-->>Router: false
        Router->>Router: Redirect to /login
    end
```

## Route Matching Algorithm

```mermaid
graph TB
    Start[URL: /users/123/posts/456]

    Start --> Parse[Parse URL<br/>['users', '123', 'posts', '456']]

    Parse --> Routes{Check Routes}

    Routes --> R1["/users/:id/posts/:postId"]
    Routes --> R2["/users/:id"]
    Routes --> R3["/posts/:id"]
    Routes --> R4["*"]

    R1 --> Match1{Match?}
    Match1 -->|Yes| Extract1[Extract params<br/>{id: '123', postId: '456'}]
    Match1 -->|No| R2

    R2 --> Match2{Match?}
    Match2 -->|No| R3

    R3 --> Match3{Match?}
    Match3 -->|No| R4

    R4 --> Fallback[404 Not Found]

    Extract1 --> Render[Render Component<br/>with params]

    style Extract1 fill:#48bb78,color:#fff
    style Fallback fill:#f56565,color:#fff
```

## Nested Routes

```mermaid
graph TB
    subgraph "Route Tree"
        Root["/"]

        Root --> Dashboard["/dashboard"]
        Root --> Settings["/settings"]

        Settings --> Profile["/settings/profile"]
        Settings --> Security["/settings/security"]
        Settings --> Billing["/settings/billing"]
    end

    subgraph "Component Tree"
        DashComp["&lt;dashboard-page&gt;"]

        SettingsComp["&lt;settings-layout&gt;"]

        SettingsComp --> ProfileComp["&lt;profile-settings&gt;"]
        SettingsComp --> SecurityComp["&lt;security-settings&gt;"]
        SettingsComp --> BillingComp["&lt;billing-settings&gt;"]
    end

    Dashboard -.renders.-> DashComp
    Settings -.renders.-> SettingsComp
    Profile -.renders.-> ProfileComp
    Security -.renders.-> SecurityComp
    Billing -.renders.-> BillingComp

    style SettingsComp fill:#764ba2,color:#fff
    style ProfileComp fill:#667eea,color:#fff
    style SecurityComp fill:#667eea,color:#fff
    style BillingComp fill:#667eea,color:#fff
```

## Route Guards

```mermaid
sequenceDiagram
    participant User
    participant Router
    participant AuthGuard
    participant RoleGuard
    participant Page

    User->>Router: Navigate to /admin
    Router->>AuthGuard: Check 'auth' guard

    alt Not Authenticated
        AuthGuard-->>Router: false
        Router->>Router: Redirect to /login
    else Authenticated
        AuthGuard-->>Router: true
        Router->>RoleGuard: Check 'admin' guard

        alt Not Admin
            RoleGuard-->>Router: false
            Router->>Router: Redirect to /unauthorized
        else Is Admin
            RoleGuard-->>Router: true
            Router->>Page: Render admin-page
        end
    end
```

## History Management

```mermaid
graph LR
    subgraph "Browser History Stack"
        H1["/"]
        H2["/products"]
        H3["/products/123"]
        H4["/cart"]

        H1 --> H2 --> H3 --> H4
    end

    subgraph "Navigation Actions"
        Push[pushState<br/>Add to history]
        Replace[replaceState<br/>Replace current]
        Back[back<br/>Go backward]
        Forward[forward<br/>Go forward]
    end

    Push -.adds.-> H4
    Replace -.replaces.-> H4
    Back -.navigates to.-> H3
    Forward -.navigates to.-> H4

    style H4 fill:#667eea,color:#fff
    style Push fill:#48bb78,color:#fff
    style Replace fill:#f59e42,color:#fff
```

## URL Structure and Query Params

```mermaid
graph TB
    URL["https://app.com/products/123?sort=price&filter=sale#reviews"]

    URL --> Protocol[Protocol<br/>https://]
    URL --> Domain[Domain<br/>app.com]
    URL --> Path[Path<br/>/products/123]
    URL --> Query[Query Params<br/>?sort=price&filter=sale]
    URL --> Hash[Hash<br/>#reviews]

    Path --> Routing[Used for Routing]
    Query --> State[Used for State<br/>filters, pagination]
    Hash --> Scroll[Used for Scroll<br/>or client-side routing]

    style Path fill:#764ba2,color:#fff
    style Query fill:#667eea,color:#fff
    style Hash fill:#48bb78,color:#fff
```

## Router Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Initialized: router created

    Initialized --> Listening: Start listening

    Listening --> NavigationTriggered: URL changes

    NavigationTriggered --> MatchingRoute: Find matching route

    MatchingRoute --> RunningGuards: Execute guards

    RunningGuards --> GuardCheck: Guards pass?

    GuardCheck --> LoadingComponent: Yes
    GuardCheck --> Redirecting: No

    LoadingComponent --> RenderingComponent: Component ready

    RenderingComponent --> Listening: Complete

    Redirecting --> NavigationTriggered: New URL

    Listening --> [*]: router destroyed
```

## Programmatic Navigation

```mermaid
graph TB
    subgraph "Navigation Methods"
        M1["pan.publish('router.navigate', {path})"]
        M2["pan.publish('router.back')"]
        M3["pan.publish('router.forward')"]
        M4["pan.publish('router.replace', {path})"]
    end

    subgraph "Router"
        Router[Router Component]
        History[History API]
    end

    subgraph "Results"
        R1[New Entry in History]
        R2[Go Back]
        R3[Go Forward]
        R4[Replace Current Entry]
    end

    M1 --> Router --> R1
    M2 --> Router --> R2
    M3 --> Router --> R3
    M4 --> Router --> R4

    Router <--> History

    style Router fill:#764ba2,color:#fff
```

## Link Interception

```mermaid
sequenceDiagram
    participant User
    participant Link as &lt;a href="/page"&gt;
    participant Document
    participant Router
    participant Browser

    User->>Link: Click

    Link->>Document: click event bubbles

    Document->>Router: Event listener catches

    Router->>Router: Check if internal link

    alt Internal Link (/page)
        Router->>Link: preventDefault()
        Router->>Router: Handle navigation
        Router->>Browser: pushState('/page')
        Router->>Router: Render component
    else External Link (https://external.com)
        Router->>Browser: Allow default behavior
        Browser->>Browser: Full page navigation
    end
```

## 404 Not Found Handling

```mermaid
graph TB
    Request[User navigates to URL]

    Request --> Router[Router]

    Router --> Match{Match<br/>route?}

    Match -->|Yes| Render[Render Component]
    Match -->|No| Wildcard{Has wildcard<br/>route '*'?}

    Wildcard -->|Yes| Render404[Render not-found-page]
    Wildcard -->|No| Default[Default 404 handling]

    Render404 --> Log[Log 404 event]
    Default --> Log

    Log --> Analytics[Send to Analytics]

    style Render fill:#48bb78,color:#fff
    style Render404 fill:#f59e42,color:#fff
    style Default fill:#f56565,color:#fff
```

## Scroll Restoration

```mermaid
sequenceDiagram
    participant User
    participant Page
    participant Router
    participant Browser

    Note over User,Browser: User scrolls down page

    User->>Page: Scroll to position 500px
    Page->>Router: Store scroll position

    User->>Router: Navigate to different page

    Router->>Router: Save {url: '/page1', scroll: 500}
    Router->>Browser: pushState('/page2')
    Router->>Page: Render new page
    Browser->>Browser: Scroll to top

    User->>Router: Press back button

    Router->>Router: Get stored position for /page1
    Router->>Browser: popState
    Router->>Page: Render previous page
    Router->>Browser: scrollTo(0, 500)

    Note over User,Browser: Restored to previous scroll position
```
