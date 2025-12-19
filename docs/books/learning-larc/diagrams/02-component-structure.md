# Web Component Structure

## Component Anatomy

```mermaid
graph TB
    subgraph "Web Component: &lt;user-card&gt;"
        Class[UserCard Class<br/>extends HTMLElement]

        subgraph InstanceProps["Instance Properties"]
            State[_user<br/>_loading<br/>_error]
        end

        subgraph LifecycleMethods["Lifecycle Methods"]
            Construct[constructor]
            Connect[connectedCallback]
            Disconnect[disconnectedCallback]
            AttrChange[attributeChangedCallback]
        end

        subgraph PublicAPI["Public API"]
            Props[Properties<br/>getters/setters]
            Methods[Public Methods<br/>loadUser, refresh]
            Events[Custom Events<br/>user-selected]
        end

        subgraph ShadowDOM["Shadow DOM"]
            SRoot[Shadow Root]
            Style[&lt;style&gt;]
            Template[HTML Template]
            Slots[&lt;slot&gt;]
        end

        Class --> State
        Class --> LifecycleMethods
        Class --> PublicAPI
        Class --> ShadowDOM
    end

    style Class fill:#667eea,color:#fff
    style ShadowDOM fill:#764ba2,color:#fff
    style PublicAPI fill:#48bb78,color:#fff
```

## Component Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Created: new UserCard()
    Created --> Created: constructor()

    Created --> Connected: Added to DOM
    Connected --> Connected: connectedCallback()

    Connected --> AttributeChanged: Attribute changes
    AttributeChanged --> AttributeChanged: attributeChangedCallback()
    AttributeChanged --> Connected

    Connected --> Disconnected: Removed from DOM
    Disconnected --> Disconnected: disconnectedCallback()
    Disconnected --> [*]

    Connected --> Moved: Moved to new document
    Moved --> Moved: adoptedCallback()
    Moved --> Connected

    note right of Created
        • Call super()
        • Initialize properties
        • Attach shadow DOM
        • DON'T access attributes
    end note

    note right of Connected
        • Render initial content
        • Add event listeners
        • Subscribe to events
        • Fetch initial data
    end note

    note right of Disconnected
        • Remove event listeners
        • Unsubscribe from events
        • Cancel pending operations
        • Clean up resources
    end note
```

## Shadow DOM Tree Structure

```mermaid
graph TB
    Document[Document]

    Document --> Body[body]

    Body --> Component["&lt;user-card&gt;<br/>(Light DOM)"]

    Component --> LightContent["Light DOM Content<br/>&lt;div slot='actions'&gt;..."]

    Component -.Shadow boundary.-> ShadowRoot[#shadow-root]

    ShadowRoot --> Style["&lt;style&gt;<br/>Scoped CSS"]
    ShadowRoot --> Container["&lt;div class='card'&gt;"]

    Container --> Header["&lt;div class='header'&gt;"]
    Container --> Body2["&lt;div class='body'&gt;"]
    Container --> Footer["&lt;div class='footer'&gt;"]

    Footer --> Slot["&lt;slot name='actions'&gt;"]

    Slot -.projects.-> LightContent

    style Component fill:#667eea,color:#fff
    style ShadowRoot fill:#764ba2,color:#fff
    style Style fill:#48bb78,color:#fff
    style Slot fill:#f59e42,color:#fff
```

## Component Communication Patterns

```mermaid
graph TB
    subgraph "Parent Component"
        P[Parent]
    end

    subgraph "Child Component"
        C[Child]
    end

    subgraph "Sibling Components"
        S1[Sibling 1]
        S2[Sibling 2]
    end

    subgraph "PAN Bus"
        PAN[Event Bus]
    end

    P -.Attributes.-> C
    P -.Properties.-> C
    C -.Custom Events.-> P

    S1 <-.PAN Messages.-> PAN
    S2 <-.PAN Messages.-> PAN
    C <-.PAN Messages.-> PAN

    style P fill:#667eea,color:#fff
    style C fill:#667eea,color:#fff
    style S1 fill:#667eea,color:#fff
    style S2 fill:#667eea,color:#fff
    style PAN fill:#764ba2,color:#fff
```

## Slots and Content Projection

```mermaid
graph LR
    subgraph "Usage (Light DOM)"
        Usage["&lt;card-component&gt;<br/>&nbsp;&nbsp;&lt;h2 slot='header'&gt;Title&lt;/h2&gt;<br/>&nbsp;&nbsp;&lt;p&gt;Default content&lt;/p&gt;<br/>&nbsp;&nbsp;&lt;button slot='footer'&gt;Save&lt;/button&gt;<br/>&lt;/card-component&gt;"]
    end

    subgraph "Shadow DOM Template"
        Template["&lt;div class='card'&gt;<br/>&nbsp;&nbsp;&lt;slot name='header'&gt;&lt;/slot&gt;<br/>&nbsp;&nbsp;&lt;slot&gt;&lt;/slot&gt;<br/>&nbsp;&nbsp;&lt;slot name='footer'&gt;&lt;/slot&gt;<br/>&lt;/div&gt;"]
    end

    subgraph "Rendered Result"
        Result["&lt;div class='card'&gt;<br/>&nbsp;&nbsp;&lt;h2&gt;Title&lt;/h2&gt;<br/>&nbsp;&nbsp;&lt;p&gt;Default content&lt;/p&gt;<br/>&nbsp;&nbsp;&lt;button&gt;Save&lt;/button&gt;<br/>&lt;/div&gt;"]
    end

    Usage -->|Projects into| Template
    Template -->|Renders as| Result

    style Usage fill:#667eea,color:#fff
    style Template fill:#764ba2,color:#fff
    style Result fill:#48bb78,color:#fff
```

## CSS Encapsulation

```mermaid
graph TB
    subgraph "Global CSS"
        Global["body { font-family: Arial; }<br/>button { background: red; }"]
    end

    subgraph "Component 1 Shadow DOM"
        C1Style["button { background: blue; }"]
        C1Button["&lt;button&gt;Click Me&lt;/button&gt;"]

        C1Style -.applies to.-> C1Button
    end

    subgraph "Component 2 Shadow DOM"
        C2Style["button { background: green; }"]
        C2Button["&lt;button&gt;Click Me&lt;/button&gt;"]

        C2Style -.applies to.-> C2Button
    end

    subgraph "Light DOM"
        LButton["&lt;button&gt;Click Me&lt;/button&gt;"]
    end

    Global -.applies to.-> LButton
    Global -.-x C1Button
    Global -.-x C2Button

    C1Style -.-x C2Button
    C1Style -.-x LButton

    C2Style -.-x C1Button
    C2Style -.-x LButton

    style C1Button fill:#5a67d8,color:#fff
    style C2Button fill:#48bb78,color:#fff
    style LButton fill:#f56565,color:#fff
```

## :host and :host-context

```mermaid
graph TB
    subgraph "Document"
        Body[body.dark-theme]
    end

    Body --> Component["&lt;my-component class='highlighted'&gt;"]

    Component -.shadow boundary.-> Shadow[#shadow-root]

    Shadow --> Styles["&lt;style&gt;<br/>:host { display: block; }<br/>:host(.highlighted) { border: 2px solid gold; }<br/>:host-context(.dark-theme) { background: #333; }<br/>&lt;/style&gt;"]

    Shadow --> Content["&lt;div&gt;Content&lt;/div&gt;"]

    Styles -.":host applies to".-> Component
    Styles -.":host(.highlighted) applies to".-> Component
    Styles -.":host-context(.dark-theme) applies to".-> Component

    style Component fill:#667eea,color:#fff
    style Shadow fill:#764ba2,color:#fff
    style Styles fill:#48bb78,color:#fff
```
