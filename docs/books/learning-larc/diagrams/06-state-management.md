# State Management Patterns

## State Hierarchy

```mermaid
graph TB
    subgraph "State Layers"
        subgraph "Component Local"
            CL1[Component 1<br/>_count, _visible]
            CL2[Component 2<br/>_expanded, _selected]
        end

        subgraph "Shared State"
            SS[Application State<br/>user, theme, cart]
        end

        subgraph "Persistent State"
            LS[localStorage<br/>Preferences, tokens]
            IDB[IndexedDB<br/>Large datasets, cache]
        end

        subgraph "Server State"
            API[REST API<br/>Database records]
            RT[Real-time<br/>WebSocket updates]
        end
    end

    CL1 -.reads from.-> SS
    CL2 -.reads from.-> SS

    SS <-.persists to.-> LS
    SS <-.persists to.-> IDB

    SS <-.syncs with.-> API
    SS <-.subscribes to.-> RT

    CL1 <-.fetches.-> API
    CL2 <-.fetches.-> API

    style SS fill:#764ba2,color:#fff
    style LS fill:#48bb78,color:#fff
    style IDB fill:#48bb78,color:#fff
```

## Component-Local State Flow

```mermaid
stateDiagram-v2
    [*] --> Initial: constructor()
    Initial --> Rendered: connectedCallback()

    Rendered --> UserAction: User interaction
    UserAction --> UpdateState: this.property = value
    UpdateState --> Render: render()
    Render --> Rendered

    Rendered --> ExternalUpdate: Attribute changed
    ExternalUpdate --> UpdateState

    Rendered --> [*]: disconnectedCallback()

    note right of UpdateState
        • Update instance property
        • No external storage
        • Private to component
    end note
```

## Reactive State with Proxy

```mermaid
sequenceDiagram
    participant Component as Component
    participant Proxy as Reactive Proxy
    participant Listeners as Listeners
    participant UI as UI

    Component->>Proxy: state.count = 42
    Proxy->>Proxy: Intercept set
    Proxy->>Listeners: Notify all listeners
    Listeners->>Component: Trigger callback
    Component->>UI: Re-render
```

## Shared State Pattern

```mermaid
graph TB
    subgraph "Store"
        State[Application State<br/>{user, theme, cart}]
        Listeners[Listeners Set]
    end

    subgraph "Components"
        C1[Component 1]
        C2[Component 2]
        C3[Component 3]
    end

    C1 -.subscribe.-> Listeners
    C2 -.subscribe.-> Listeners
    C3 -.subscribe.-> Listeners

    C1 -->|setState| State
    C2 -->|setState| State

    State -.notify.-> Listeners
    Listeners -.trigger.-> C1 & C2 & C3

    style State fill:#764ba2,color:#fff
    style Listeners fill:#667eea,color:#fff
```

## IndexedDB Cache-First Strategy

```mermaid
sequenceDiagram
    participant Component
    participant Memory as Memory Cache
    participant IDB as IndexedDB
    participant API as Backend API

    Component->>Memory: getData(id)
    alt In Memory Cache
        Memory-->>Component: Return cached data
    else Not in Memory
        Component->>IDB: getData(id)
        alt In IndexedDB
            IDB-->>Component: Return cached data
            Component->>Memory: Cache in memory
        else Not in IndexedDB
            Component->>API: fetch('/api/data/' + id)
            API-->>Component: Fresh data
            Component->>IDB: Store in IndexedDB
            Component->>Memory: Cache in memory
        end
    end

    Note over Component,API: Background: Refresh from API
    Component->>API: fetch (background)
    API-->>Component: Latest data
    Component->>IDB: Update IndexedDB
    Component->>Memory: Update memory cache
```

## Offline-First with Sync Queue

```mermaid
graph TB
    subgraph "Client"
        UI[UI Component]
        Local[Local State<br/>IndexedDB]
        Queue[Sync Queue<br/>localStorage]
    end

    subgraph "Network"
        Check{Online?}
    end

    subgraph "Server"
        API[Backend API]
    end

    UI -->|Create/Update/Delete| Local
    Local -.success.-> UI

    Local --> Check

    Check -->|Yes| API
    Check -->|No| Queue

    Queue -.wait for online.-> Check

    API -->|Success| Confirm[Confirm Sync]
    API -->|Error| Queue

    Confirm -.update UI.-> UI

    style Local fill:#48bb78,color:#fff
    style Queue fill:#f59e42,color:#fff
    style API fill:#667eea,color:#fff
```

## State Synchronization Patterns

```mermaid
graph LR
    subgraph "Optimistic Update"
        O1[User Action]
        O2[Update UI Immediately]
        O3[Send to Server]
        O4{Success?}
        O5[Keep Update]
        O6[Rollback]

        O1 --> O2 --> O3 --> O4
        O4 -->|Yes| O5
        O4 -->|No| O6
    end

    subgraph "Pessimistic Update"
        P1[User Action]
        P2[Show Loading]
        P3[Send to Server]
        P4{Success?}
        P5[Update UI]
        P6[Show Error]

        P1 --> P2 --> P3 --> P4
        P4 -->|Yes| P5
        P4 -->|No| P6
    end

    style O2 fill:#48bb78,color:#fff
    style O6 fill:#f56565,color:#fff
    style P5 fill:#48bb78,color:#fff
    style P6 fill:#f56565,color:#fff
```

## pan-store Component Architecture

```mermaid
graph TB
    subgraph "pan-store"
        State[State Object]
        Watchers[Path Watchers<br/>Map&lt;path, handlers&gt;]
        Persist[Persistence Layer]
        Computed[Computed Values]

        State --> Watchers
        State --> Persist
        State --> Computed
    end

    subgraph "Components"
        C1[Component 1]
        C2[Component 2]
        C3[Component 3]
    end

    subgraph "Storage"
        LS[localStorage]
        IDB[IndexedDB]
    end

    C1 -->|setState| State
    C2 -->|setState| State
    C3 -->|getState| State

    Watchers -.notify.-> C1 & C2 & C3

    Persist <-.sync.-> LS & IDB

    style State fill:#764ba2,color:#fff
    style Persist fill:#48bb78,color:#fff
```

## State Update Flow

```mermaid
sequenceDiagram
    participant Component
    participant Store
    participant Middleware
    participant Persistence
    participant PAN as PAN Bus
    participant Subscribers

    Component->>Store: setState({user: newUser})

    Store->>Store: Merge state
    Store->>Middleware: Run middleware
    Middleware->>Middleware: Log state change
    Middleware->>Persistence: Save to localStorage

    Store->>PAN: publish('store.changed')
    PAN->>Subscribers: Notify all subscribers

    Store->>Store: Check watchers
    Store->>Subscribers: Notify path watchers

    Subscribers->>Subscribers: Re-render
```

## Conflict Resolution

```mermaid
graph TB
    Local[Local Update<br/>timestamp: T1]
    Server[Server Update<br/>timestamp: T2]

    Conflict{Conflict?}

    Local --> Conflict
    Server --> Conflict

    Conflict -->|T1 > T2| UseLocal[Use Local<br/>Last Write Wins]
    Conflict -->|T2 > T1| UseServer[Use Server<br/>Last Write Wins]
    Conflict -->|T1 = T2| Merge[Attempt Merge<br/>or Manual Resolution]

    UseLocal --> Sync[Sync to Server]
    UseServer --> Update[Update Local]
    Merge --> Manual[Show Conflict UI]

    style Conflict fill:#f59e42,color:#fff
    style Merge fill:#f56565,color:#fff
    style Sync fill:#48bb78,color:#fff
```

## State Management Decision Tree

```mermaid
graph TB
    Start{Need State?}

    Start -->|Yes| Scope{Share across<br/>components?}

    Scope -->|No| Local[Component-Local State<br/>Instance properties]

    Scope -->|Yes| Persist{Need to<br/>persist?}

    Persist -->|No| Shared[Shared State<br/>Global object or store]

    Persist -->|Yes| Size{Large<br/>dataset?}

    Size -->|No| LS[localStorage<br/>Small data <10MB]
    Size -->|Yes| IDB[IndexedDB<br/>Large data, offline]

    IDB --> Offline{Offline<br/>support?}
    LS --> Offline

    Offline -->|Yes| Queue[Sync Queue<br/>Background sync]
    Offline -->|No| Done[Done]

    Queue --> Done
    Local --> Done
    Shared --> Done

    style Local fill:#667eea,color:#fff
    style Shared fill:#764ba2,color:#fff
    style IDB fill:#48bb78,color:#fff
    style Queue fill:#f59e42,color:#fff
```
