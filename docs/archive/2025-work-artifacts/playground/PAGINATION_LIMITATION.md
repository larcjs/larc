# Pagination Example Limitation

## Current Behavior

The "Paginated Data Table" example shows **pagination UI controls** but doesn't actually paginate the data in the table. All 100 posts are displayed at once.

## Why?

The example has three components:
1. **`pan-data-connector`** - Fetches all posts from JSONPlaceholder (100 items)
2. **`pan-data-table`** - Displays ALL items it receives
3. **`pan-pagination`** - Shows page controls and publishes pagination events

### The Gap

- ✅ Pagination controls work (click pages, see PAN messages)
- ✅ Data fetches correctly (all 100 posts)
- ❌ Table doesn't filter/slice data based on current page

The `pan-data-table` component doesn't have built-in pagination support - it renders whatever data it receives from `{resource}.list.state`.

## Solutions

### Option 1: Server-Side Pagination (Best)

The API should return paginated data:

```javascript
// pan-data-connector would need to:
// 1. Listen to pagination.changed events
// 2. Append page/limit params to API request
// 3. Fetch only one page at a time

GET /posts?_page=1&_limit=10  // Returns posts 1-10
GET /posts?_page=2&_limit=10  // Returns posts 11-20
```

**Status**: Requires `pan-data-connector` enhancement to support query params from PAN topics.

### Option 2: Client-Side Pagination with Computed State

Use `pan-computed-state` to slice the data:

```html
<!-- Fetch all data -->
<pan-data-connector
  resource="posts"
  base-url="https://jsonplaceholder.typicode.com">
</pan-data-connector>

<!-- Slice data based on current page -->
<pan-computed-state
  sources="posts.list.state,pagination.changed"
  output="posts.page.state">
  <script>
    (postsState, paginationEvent) => {
      const items = postsState?.items || [];
      const page = paginationEvent?.page || 1;
      const pageSize = paginationEvent?.pageSize || 10;

      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageItems = items.slice(start, end);

      return { items: pageItems };
    }
  </script>
</pan-computed-state>

<!-- Display paginated data -->
<pan-data-table
  resource="posts.page"
  columns="id,title,body">
</pan-data-table>

<!-- Pagination controls -->
<pan-pagination
  total-items="100"
  page-size="10"
  topic="pagination">
</pan-pagination>
```

**Status**: Requires playground support for adding `<script>` content to components (not currently supported).

### Option 3: Dedicated Paginated Table Component

Create a new `<pan-paginated-table>` component that combines table + pagination:

```javascript
class PanPaginatedTable extends HTMLElement {
  // Internal state: allItems, currentPage, pageSize
  // Renders only one page of items
  // Has built-in pagination controls
}
```

**Status**: Would require creating a new component.

### Option 4: Documentation-Only (Current)

Simply document that this example shows the pagination **UI controls** working and publishing PAN events, but doesn't actually filter the table data.

**Status**: ✅ **This is what we're doing now**

## Current Example Purpose

The "Paginated Data Table" example demonstrates:
- ✅ How to use `pan-pagination` component
- ✅ Pagination controls UI (first, prev, pages, next, last)
- ✅ PAN message flow when clicking pages
- ✅ Page info display ("Showing 1-10 of 100")
- ✅ How pagination integrates with PAN bus

It does NOT demonstrate:
- ❌ Actual data filtering/slicing
- ❌ Server-side pagination
- ❌ Client-side pagination logic

## Testing the Pagination Controls

Even though data isn't paginated, you can verify the controls work:

1. **Load the example**
2. **Open PAN Monitor** (click "PAN Monitor" button)
3. **Click pagination buttons**:
   - Click "Page 2" → See `pagination.changed` with `{page: 2, pageSize: 10}`
   - Click "Next" → See page increment
   - Click "Last" → Jump to page 10
4. **Page info updates**: "Showing 11-20 of 100" (even though table shows all)

## Future Enhancement

To make this a fully functional paginated table example, we'd need to:

1. **Add query param support to `pan-data-connector`**:
   ```javascript
   // Listen to pagination events and merge params
   this.pc.subscribe('pagination.changed', (msg) => {
     const { page, pageSize } = msg.data;
     this.fetchList({ _page: page, _limit: pageSize });
   });
   ```

2. **Or add `<script>` support to playground**:
   - Allow adding script content to `pan-computed-state`
   - Implement client-side slicing logic

3. **Or create dedicated component**:
   - `<pan-paginated-table>` with built-in pagination
   - Handles both server-side and client-side pagination

## Recommendation

For now, keep the example as-is with updated description:
```
"Pagination UI controls (demonstrates PAN integration)"
```

Users who need actual pagination should:
- Implement server-side pagination in their API
- Add a computed state component with slicing logic
- Use a dedicated paginated table component

The current example successfully demonstrates the pagination **controls** and how they integrate with the PAN bus, which is valuable on its own.
