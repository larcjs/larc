# PAN Bus Communication Patterns

## Pub/Sub Architecture

```mermaid
graph TB
    subgraph "Publishers"
        P1[Login Button]
        P2[Cart Component]
        P3[API Service]
    end

    subgraph "PAN Bus"
        PAN[Topic Router]

        subgraph "Topics"
            T1[user.login]
            T2[cart.item.added]
            T3[data.loaded]
        end
    end

    subgraph "Subscribers"
        S1[User Menu]
        S2[Sidebar]
        S3[Notification]
        S4[Analytics]
    end

    P1 -->|publish| T1
    P2 -->|publish| T2
    P3 -->|publish| T3

    T1 --> PAN
    T2 --> PAN
    T3 --> PAN

    PAN -->|notify| S1
    PAN -->|notify| S2
    PAN -->|notify| S3
    PAN -->|notify| S4

    style PAN fill:#764ba2,color:#fff
    style P1 fill:#667eea,color:#fff
    style P2 fill:#667eea,color:#fff
    style P3 fill:#667eea,color:#fff
```

## Message Flow Sequence

```mermaid
sequenceDiagram
    participant LoginBtn as Login Button
    participant PAN as PAN Bus
    participant UserMenu as User Menu
    participant Sidebar as Sidebar
    participant Analytics as Analytics
    participant API as Backend

    Note over LoginBtn,Analytics: User clicks login button

    LoginBtn->>PAN: publish('user.login.started')
    PAN->>UserMenu: notify
    PAN->>Sidebar: notify
    UserMenu->>UserMenu: Show loading state

    LoginBtn->>API: POST /api/login
    API-->>LoginBtn: {token, user}

    LoginBtn->>PAN: publish('user.login.success', {user})

    PAN->>UserMenu: notify
    PAN->>Sidebar: notify
    PAN->>Analytics: notify

    UserMenu->>UserMenu: Update with user data
    Sidebar->>Sidebar: Show user panel
    Analytics->>API: Track event
```

## Topic Namespace Structure

```mermaid
graph TB
    Root[*<br/>All Events]

    Root --> User[user.*]
    Root --> Cart[cart.*]
    Root --> App[app.*]

    User --> UserAuth[user.auth.*]
    User --> UserProfile[user.profile.*]

    UserAuth --> Login[user.auth.login]
    UserAuth --> Logout[user.auth.logout]
    UserAuth --> Refresh[user.auth.refresh]

    UserProfile --> ProfileUpdate[user.profile.update]
    UserProfile --> ProfileFetch[user.profile.fetch]

    Cart --> CartItem[cart.item.*]
    Cart --> CartCheckout[cart.checkout]

    CartItem --> ItemAdd[cart.item.add]
    CartItem --> ItemRemove[cart.item.remove]
    CartItem --> ItemUpdate[cart.item.update]

    App --> AppTheme[app.theme.change]
    App --> AppRoute[app.route.change]
    App --> AppError[app.error]

    style Root fill:#764ba2,color:#fff
    style User fill:#667eea,color:#fff
    style Cart fill:#667eea,color:#fff
    style App fill:#667eea,color:#fff
```

## Wildcard Subscription Matching

```mermaid
graph LR
    subgraph "Published Events"
        E1[user.login]
        E2[user.logout]
        E3[user.profile.update]
        E4[cart.item.add]
    end

    subgraph "Subscriptions"
        S1["subscribe('user.login')"]
        S2["subscribe('user.*')"]
        S3["subscribe('*.update')"]
        S4["subscribe('*')"]
    end

    E1 -.matches.-> S1
    E1 -.matches.-> S2
    E1 -.matches.-> S4

    E2 -.matches.-> S2
    E2 -.matches.-> S4

    E3 -.matches.-> S2
    E3 -.matches.-> S3
    E3 -.matches.-> S4

    E4 -.matches.-> S4

    style E1 fill:#667eea,color:#fff
    style E2 fill:#667eea,color:#fff
    style E3 fill:#667eea,color:#fff
    style E4 fill:#667eea,color:#fff
    style S4 fill:#f56565,color:#fff
```

## Request/Response Pattern

```mermaid
sequenceDiagram
    participant Requester as Component A
    participant PAN as PAN Bus
    participant Responder as Auth Service

    Note over Responder: Registers responder
    Responder->>PAN: respond('auth.token.get', handler)

    Note over Requester: Needs auth token
    Requester->>PAN: request('auth.token.get')

    PAN->>PAN: Generate response ID
    PAN->>Responder: Trigger handler

    Responder->>Responder: Get token from storage
    Responder->>PAN: publish response

    PAN->>Requester: Return token

    Note over Requester: Uses token for API call
    Requester->>API: GET /api/data<br/>Authorization: Bearer {token}
```

## Event Patterns Comparison

```mermaid
graph TB
    subgraph "Fire and Forget"
        FF1[Publisher]
        FF2[PAN Bus]
        FF3[Subscribers]

        FF1 -->|publish| FF2
        FF2 -->|notify all| FF3
        FF1 -.-x|no wait| FF3
    end

    subgraph "Request/Response"
        RR1[Requester]
        RR2[PAN Bus]
        RR3[Responder]

        RR1 -->|request| RR2
        RR2 -->|invoke| RR3
        RR3 -->|respond| RR2
        RR2 -->|return| RR1
    end

    subgraph "Command"
        C1[Commander]
        C2[PAN Bus]
        C3[Handler]

        C1 -->|command| C2
        C2 -->|execute| C3
        C3 -->|acknowledge| C2
        C2 -.optional.-> C1
    end

    style FF2 fill:#667eea,color:#fff
    style RR2 fill:#764ba2,color:#fff
    style C2 fill:#48bb78,color:#fff
```

## PAN Bus Internal Architecture

```mermaid
graph TB
    subgraph "PAN Bus Core"
        Router[Topic Router]

        subgraph "Subscription Registry"
            Exact[Exact Matches<br/>Map&lt;topic, Set&lt;handler&gt;&gt;]
            Wildcard[Wildcard Patterns<br/>Array&lt;{pattern, handlers}&gt;]
        end

        subgraph "Message Queue"
            Queue[Event Queue]
            Batch[Batch Processor]
        end

        Router --> Exact
        Router --> Wildcard
        Router --> Queue
        Queue --> Batch
    end

    subgraph "API Methods"
        Publish[publish]
        Subscribe[subscribe]
        Request[request]
        Respond[respond]
    end

    Publish --> Router
    Subscribe --> Exact & Wildcard
    Request --> Router
    Respond --> Router

    style Router fill:#764ba2,color:#fff
    style Queue fill:#667eea,color:#fff
```

## Debugging with Event Inspector

```mermaid
graph TB
    subgraph "Application"
        C1[Component 1]
        C2[Component 2]
        C3[Component 3]
    end

    subgraph "PAN Bus"
        PAN[Message Router]
    end

    subgraph "Inspector"
        Monitor["subscribe('*')"]
        Log[Event Log]
        Filter[Filter Panel]
        Viz[Visualization]
    end

    C1 -->|publish| PAN
    C2 -->|publish| PAN
    C3 -->|publish| PAN

    PAN -->|notify| C1
    PAN -->|notify| C2
    PAN -->|notify| C3

    PAN -.all events.-> Monitor
    Monitor --> Log
    Log --> Filter
    Log --> Viz

    style PAN fill:#764ba2,color:#fff
    style Monitor fill:#f59e42,color:#fff
    style Viz fill:#48bb78,color:#fff
```

## Event Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Published: publish(topic, data)
    Published --> Routing: Route to subscribers
    Routing --> MatchExact: Check exact matches
    Routing --> MatchWildcard: Check wildcards

    MatchExact --> Notify: Found subscribers
    MatchWildcard --> Notify: Found subscribers

    MatchExact --> Complete: No matches
    MatchWildcard --> Complete: No matches

    Notify --> HandleAsync: Async handlers
    Notify --> HandleSync: Sync handlers

    HandleAsync --> Complete
    HandleSync --> Complete

    Complete --> [*]

    note right of Routing
        • Look up topic in registry
        • Match wildcards
        • Collect all handlers
    end note

    note right of Notify
        • Call each handler
        • Pass message data
        • Handle errors
    end note
```

## Error Handling in PAN Bus

```mermaid
graph TB
    Publisher[Publisher]
    PAN[PAN Bus]

    Publisher -->|publish| PAN

    PAN --> S1[Subscriber 1]
    PAN --> S2[Subscriber 2]
    PAN --> S3[Subscriber 3]

    S1 -->|success| End1[✓]
    S2 -->|throws error| Error[Error Handler]
    S3 -->|success| End3[✓]

    Error -->|log error| Console[Console]
    Error -->|publish| ErrorTopic[app.error]

    ErrorTopic --> ErrorHandler[Error Component]

    Error -.doesn't stop.-> S3

    style Error fill:#f56565,color:#fff
    style PAN fill:#764ba2,color:#fff
    style End1 fill:#48bb78,color:#fff
    style End3 fill:#48bb78,color:#fff
```
