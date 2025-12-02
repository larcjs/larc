# LARC Architecture Overview

## High-Level Architecture

```mermaid
graph TB
    subgraph "Browser"
        subgraph "LARC Application"
            HTML[HTML Document]
            IM[Import Map]

            subgraph "Components Layer"
                C1[Component 1]
                C2[Component 2]
                C3[Component 3]
                C4[Component N...]
            end

            subgraph "Communication Layer"
                PAN[PAN Bus<br/>Pub/Sub System]
            end

            subgraph "State Layer"
                LS[Local State]
                SS[Shared State]
                PS[Persistent State<br/>localStorage/IndexedDB]
            end

            subgraph "Router Layer"
                R[pan-router]
            end
        end

        subgraph "Browser APIs"
            CE[Custom Elements]
            SD[Shadow DOM]
            ESM[ES Modules]
            F[Fetch API]
            WS[WebSocket]
        end
    end

    subgraph "External"
        CDN[CDN<br/>jsDelivr/unpkg]
        API[REST API]
        WSS[WebSocket Server]
    end

    HTML --> IM
    IM --> C1 & C2 & C3 & C4
    C1 & C2 & C3 & C4 <--> PAN
    C1 & C2 & C3 & C4 --> LS
    PAN <--> SS
    SS <--> PS
    C1 & C2 & C3 & C4 --> CE & SD & ESM
    C1 & C2 & C3 & C4 --> R

    IM -.loads from.-> CDN
    C1 & C2 & C3 & C4 -.HTTP.-> API
    C1 & C2 & C3 & C4 -.WebSocket.-> WSS

    style HTML fill:#667eea,color:#fff
    style PAN fill:#764ba2,color:#fff
    style R fill:#667eea,color:#fff
    style SS fill:#48bb78,color:#fff
    style PS fill:#48bb78,color:#fff
```

## Component Communication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C1 as Component 1
    participant PAN as PAN Bus
    participant C2 as Component 2
    participant C3 as Component 3
    participant API as Backend API

    U->>C1: Click Button
    C1->>PAN: publish('user.action', data)

    PAN->>C2: notify subscriber
    PAN->>C3: notify subscriber

    C2->>C2: Update UI

    C3->>API: fetch('/api/data')
    API-->>C3: Response
    C3->>PAN: publish('data.loaded', result)

    PAN->>C1: notify subscriber
    PAN->>C2: notify subscriber

    C1->>C1: Update UI
    C2->>C2: Update UI
```

## No-Build Architecture

```mermaid
graph LR
    subgraph "Traditional Framework"
        S1[Source Code]
        T1[Transpile<br/>Babel]
        B1[Bundle<br/>Webpack]
        M1[Minify]
        O1[Output]

        S1 --> T1 --> B1 --> M1 --> O1
    end

    subgraph "LARC"
        S2[Source Code]
        BR[Browser]

        S2 -.directly loads.-> BR
    end

    style S2 fill:#667eea,color:#fff
    style BR fill:#48bb78,color:#fff
    style O1 fill:#f56565,color:#fff
```

## Module Loading with Import Maps

```mermaid
graph TB
    subgraph "index.html"
        IM["&lt;script type='importmap'&gt;<br/>{<br/>  '@larcjs/core': 'https://cdn...',<br/>  'app/': '/src/'<br/>}"]
        SM["&lt;script type='module'&gt;<br/>import '@larcjs/core'<br/>import 'app/components/...'"]
    end

    subgraph "Resolution"
        IM --> R1[Resolve @larcjs/core]
        IM --> R2[Resolve app/]

        R1 --> CDN[Load from CDN]
        R2 --> Local[Load from /src/]
    end

    subgraph "Browser"
        CDN --> Cache1[Browser Cache]
        Local --> Cache2[Browser Cache]

        Cache1 --> Exec[Execute Modules]
        Cache2 --> Exec
    end

    style IM fill:#667eea,color:#fff
    style SM fill:#667eea,color:#fff
    style Exec fill:#48bb78,color:#fff
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Dev[Developer]
        Code[Source Code]
        Git[Git Repository]

        Dev -->|writes| Code
        Code -->|commits| Git
    end

    subgraph "CI/CD"
        GH[GitHub Actions]
        Test[Run Tests]
        Build[Optional Build<br/>Minify]

        Git -->|triggers| GH
        GH --> Test
        Test --> Build
    end

    subgraph "Production"
        CDN[CDN<br/>CloudFlare/AWS]
        Static[Static Host<br/>Netlify/Vercel]

        Build -->|deploy assets| CDN
        Build -->|deploy app| Static
    end

    subgraph "Users"
        Browser[Browser]

        Static -->|HTML| Browser
        CDN -->|JS/CSS/Assets| Browser
    end

    style Code fill:#667eea,color:#fff
    style Static fill:#48bb78,color:#fff
    style CDN fill:#48bb78,color:#fff
    style Browser fill:#764ba2,color:#fff
```
