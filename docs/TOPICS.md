# LARC Topic Dictionary

> Auto-generated on 2026-02-06T05:43:25.585Z

## Statistics

- **Total Topics:** 183
- **State Topics:** 9
- **Command Topics:** 22
- **Event Topics:** 26
- **Request Topics:** 14

## Topics by Namespace

### data:updated

| Topic | Type | Description |
|-------|------|-------------|
| `data:updated` | unknown | - |

### auth

| Topic | Type | Description |
|-------|------|-------------|
| `auth.check` | unknown | - |
| `auth.internal.state` | state | - |
| `auth.login` | unknown | - |
| `auth.login.error` | event | - |
| `auth.login.request` | request | - |
| `auth.login.success` | event | - |
| `auth.logout` | unknown | - |
| `auth.logout.request` | request | - |
| `auth.logout.success` | event | - |
| `auth.refresh` | unknown | - |
| `auth.refresh.error` | event | - |
| `auth.refresh.success` | event | - |
| `auth.setToken` | unknown | - |
| `auth.state` | state | - |
| `auth.state.get` | request | - |
| `auth.token.expired` | unknown | - |
| `auth.token.refresh` | unknown | - |
| `auth.token.refreshed` | unknown | - |

### users

| Topic | Type | Description |
|-------|------|-------------|
| `users.*` | unknown | - |
| `users.list.state` | state | - |
| `users.updated` | event | - |

### app

| Topic | Type | Description |
|-------|------|-------------|
| `app.started` | unknown | - |
| `app.state` | state | - |

### user

| Topic | Type | Description |
|-------|------|-------------|
| `user.*` | unknown | - |
| `user.login` | unknown | - |
| `user.updated` | event | - |

### events

| Topic | Type | Description |
|-------|------|-------------|
| `events.*` | unknown | - |

### file

| Topic | Type | Description |
|-------|------|-------------|
| `file.content-loaded` | unknown | - |
| `file.create` | unknown | - |
| `file.created` | event | - |
| `file.delete` | command | - |
| `file.deleted` | command | - |
| `file.load` | unknown | - |
| `file.renamed` | unknown | - |
| `file.save` | command | - |
| `file.selected` | unknown | - |

### *

| Topic | Type | Description |
|-------|------|-------------|
| `*` | unknown | - |
| `*.item.delete` | command | - |
| `*.item.get` | request | - |
| `*.item.save` | command | - |
| `*.item.select` | unknown | - |
| `*.list.state` | state | - |

### invoice

| Topic | Type | Description |
|-------|------|-------------|
| `invoice.browser.show` | unknown | - |
| `invoice.clear` | unknown | - |
| `invoice.created` | event | (event) Invoice created, may have due date (subscribed) |
| `invoice.current-changed` | unknown | - |
| `invoice.data.export` | unknown | - |
| `invoice.data.import` | unknown | - |
| `invoice.delete` | command | - |
| `invoice.error` | event | - |
| `invoice.export` | unknown | - |
| `invoice.export-all` | unknown | - |
| `invoice.export.pdf` | unknown | - |
| `invoice.header.changed` | unknown | (event) Invoice header field changed |
| `invoice.import` | unknown | - |
| `invoice.items.changed` | unknown | (event) Line items changed |
| `invoice.items.clear` | unknown | - |
| `invoice.items.load` | unknown | - |
| `invoice.list-updated` | request | - |
| `invoice.load` | unknown | (command) Load an invoice into the editor |
| `invoice.load-by-id` | unknown | (command) Load a specific invoice by ID |
| `invoice.load.latest` | unknown | (command) Load the most recent invoice |
| `invoice.new` | unknown | (command) Create a new blank invoice |
| `invoice.save` | command | (command) Save the current invoice |
| `invoice.saved` | command | (event) Invoice was saved successfully |
| `invoice.state` | state | (state) Current invoice data |
| `invoice.total.calculated` | unknown | - |
| `invoice.totals.changed` | unknown | - |
| `invoice.totals.updated` | event | (event) Invoice totals recalculated |

### contact

| Topic | Type | Description |
|-------|------|-------------|
| `contact.data` | unknown | - |
| `contact.data.get` | request | - |
| `contact.schema.set` | unknown | - |
| `contact.selected` | unknown | - |
| `contact.submit` | unknown | - |

### nav

| Topic | Type | Description |
|-------|------|-------------|
| `nav.back` | unknown | - |
| `nav.blocked` | unknown | - |
| `nav.forward` | unknown | - |
| `nav.goto` | unknown | - |
| `nav.replace` | unknown | - |
| `nav.state` | state | - |

### markdown

| Topic | Type | Description |
|-------|------|-------------|
| `markdown.changed` | unknown | - |
| `markdown.content-response` | unknown | - |
| `markdown.get-content` | request | - |
| `markdown.render` | unknown | - |
| `markdown.saved` | command | - |
| `markdown.set-content` | unknown | - |

### {storage}

| Topic | Type | Description |
|-------|------|-------------|
| `{storage}.network.offline` | unknown | Network went offline |
| `{storage}.network.online` | unknown | Network came online |
| `{storage}.queue.add` | command | Queued a mutation |
| `{storage}.queue.conflict` | unknown | Conflict detected |
| `{storage}.queue.error` | event | Sync error occurred |
| `{storage}.queue.success` | event | Mutation synced successfully |
| `{storage}.queue.sync` | unknown | Sync started |

### persist

| Topic | Type | Description |
|-------|------|-------------|
| `persist.error` | event | Persistence error occurred |
| `persist.hydrated` | unknown | All state has been hydrated |
| `persist.saved` | command | State was persisted |

### {topic}

| Topic | Type | Description |
|-------|------|-------------|
| `{topic}.clear` | unknown | (event) Search was cleared |
| `{topic}.invalid` | unknown | Message failed validation |
| `{topic}.search` | unknown | (event) Search query changed with {query, filter} |
| `{topic}.set` | unknown | (command) Set search query and/or filter programmatically |
| `{topic}.valid` | unknown | Message passed validation |

### {channel}

| Topic | Type | Description |
|-------|------|-------------|
| `{channel}.clear` | unknown | Clear history |
| `{channel}.redo` | unknown | Trigger redo |
| `{channel}.snapshot` | unknown | Take manual snapshot |
| `{channel}.state` | state | History state changes |
| `{channel}.sync.conflict` | unknown | Conflict detected, resolution needed |
| `{channel}.sync.leader-elected` | unknown | Notify when new leader elected |
| `{channel}.sync.message` | unknown | Broadcast state changes to other tabs |
| `{channel}.sync.request-state` | request | Request full state from leader |
| `{channel}.undo` | unknown | Trigger undo |

### theme

| Topic | Type | Description |
|-------|------|-------------|
| `theme.changed` | unknown | - |

### history

| Topic | Type | Description |
|-------|------|-------------|
| `history.clear` | unknown | - |
| `history.redo` | unknown | - |
| `history.undo` | unknown | - |

### ws

| Topic | Type | Description |
|-------|------|-------------|
| `ws.connected` | unknown | - |
| `ws.disconnected` | unknown | - |
| `ws.error` | event | - |
| `ws.message` | unknown | - |

### pan:sys

| Topic | Type | Description |
|-------|------|-------------|
| `pan:sys.error` | event | - |

### todos

| Topic | Type | Description |
|-------|------|-------------|
| `todos.change` | unknown | - |
| `todos.remove` | unknown | - |
| `todos.state` | state | - |
| `todos.toggle` | unknown | - |

### demo:click

| Topic | Type | Description |
|-------|------|-------------|
| `demo:click` | unknown | - |

### temp

| Topic | Type | Description |
|-------|------|-------------|
| `temp.*` | unknown | - |

### test

| Topic | Type | Description |
|-------|------|-------------|
| `test.message` | unknown | - |

### {store}

| Topic | Type | Description |
|-------|------|-------------|
| `{store}.idb.add` | command | (command) Add a new item |
| `{store}.idb.clear` | unknown | (command) Clear all items from store |
| `{store}.idb.delete` | command | (command) Delete an item by key |
| `{store}.idb.error` | event | (event) Operation failed with error |
| `{store}.idb.get` | request | (command) Get an item by key |
| `{store}.idb.list` | request | (command) List items with optional filters |
| `{store}.idb.put` | command | (command) Update or insert an item |
| `{store}.idb.query` | unknown | (command) Query items by index |
| `{store}.idb.ready` | event | (event) IndexedDB store is ready |
| `{store}.idb.result` | event | (event) Operation completed with result |

### topic

| Topic | Type | Description |
|-------|------|-------------|
| `topic.validation.error` | event | Topic validation failed |
| `topic.validation.loaded` | unknown | Dictionary loaded successfully |
| `topic.validation.warning` | unknown | Topic validation warning (unknown topic) |

### modal

| Topic | Type | Description |
|-------|------|-------------|
| `modal.demo.hide` | unknown | - |
| `modal.demo.show` | unknown | - |
| `modal.demo.toggle` | unknown | - |

### blog

| Topic | Type | Description |
|-------|------|-------------|
| `blog.draft.loaded` | unknown | - |
| `blog.meta.changed` | unknown | - |
| `blog.meta.set` | unknown | - |
| `blog.mode.changed` | unknown | - |
| `blog.mode.switch` | unknown | - |
| `blog.preview.toggle` | unknown | - |
| `blog.preview.update` | unknown | - |
| `blog.save.request` | request | - |
| `blog.source.changed` | unknown | - |
| `blog.source.setContent` | unknown | - |
| `blog.storage.load` | unknown | - |
| `blog.storage.save` | command | - |
| `blog.wysiwyg.changed` | unknown | - |
| `blog.wysiwyg.setContent` | unknown | - |

### features

| Topic | Type | Description |
|-------|------|-------------|
| `features.action` | unknown | - |
| `features.available` | unknown | - |
| `features.register` | unknown | - |
| `features.toggle` | unknown | - |

### calendar

| Topic | Type | Description |
|-------|------|-------------|
| `calendar.event.saved` | command | (event) Event was saved |
| `calendar.events.add` | command | (command) Add a new event |
| `calendar.events.delete` | command | (command) Delete an event |
| `calendar.events.list` | request | (command) Request list of all events |
| `calendar.events.put` | command | (command) Update an event |
| `calendar.events.ready` | event | (event) IndexedDB store is ready |
| `calendar.events.result` | event | (event) IndexedDB operation completed |

### contacts

| Topic | Type | Description |
|-------|------|-------------|
| `contacts.idb.add` | command | (command) Add a new contact |
| `contacts.idb.delete` | command | (command) Delete a contact |
| `contacts.idb.error` | event | (event) IndexedDB operation failed |
| `contacts.idb.list` | request | (command) Request list of all contacts |
| `contacts.idb.put` | command | (command) Update a contact |
| `contacts.idb.ready` | event | (event) IndexedDB store is ready |
| `contacts.idb.result` | event | (event) IndexedDB operation completed |
| `contacts.list` | request | (state) Receive contacts from Contact Manager (subscribed) |
| `contacts.manager.show` | unknown | (command) Show the contact manager modal |
| `contacts.picker.show` | unknown | (command) Show the contact picker (alias) |
| `contacts.search.search` | unknown | (event) Search query changed |
| `contacts.selected` | unknown | (event) User selected a contact |
| `contacts.updated` | event | (event) Contacts were modified (subscribed) |

### resource

| Topic | Type | Description |
|-------|------|-------------|
| `resource.select` | unknown | - |

### ui

| Topic | Type | Description |
|-------|------|-------------|
| `ui.toast.show` | unknown | (command) Show a toast notification |
