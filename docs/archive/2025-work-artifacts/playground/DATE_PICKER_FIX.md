# Date Picker Example Fix

## Problem

The Date Selection example didn't work - clicking the input did nothing, and the calendar wouldn't open.

## Root Cause

Same issue as the file-upload component: **duplicate event listeners** caused by calling `setupEvents()` multiple times.

### The Bug

```javascript
// BAD - Sets up events twice
connectedCallback() {
  // ...
  this.render();        // This calls setupEvents() at the end
  this.setupTopics();
  this.setupEvents();   // Called AGAIN here ❌
}

render() {
  this.shadowRoot.innerHTML = `...`;

  // ...

  if (this.isConnected) {
    setTimeout(() => this.setupEvents(), 0);  // Called yet AGAIN ❌
  }
}
```

When `setupEvents()` is called multiple times without guards:
1. Multiple click listeners added to input
2. Multiple outside-click listeners added to document
3. Events fire multiple times or interfere with each other
4. Calendar may not open or behave erratically

## Solution

Applied the same fix pattern used for file-upload:

### 1. Add Guard Variable

```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this.pc = new PanClient(this);
  this.isOpen = false;
  this.currentMonth = new Date();
  this.selectedDate = null;
  this.eventsSetup = false; // Guard against duplicate event listeners ✅
}
```

### 2. Guard setupEvents()

```javascript
setupEvents() {
  // Skip if already set up to prevent duplicate listeners ✅
  if (this.eventsSetup) return;
  this.eventsSetup = true;

  const input = this.shadowRoot.querySelector('.date-input');
  // ... rest of setup
}
```

### 3. Remove Duplicate Call

```javascript
// GOOD - Only render (which calls setupEvents)
connectedCallback() {
  if (this.value) {
    this.selectedDate = new Date(this.value);
    this.currentMonth = new Date(this.selectedDate);
  }
  this.setupTopics();
  this.render();  // This will call setupEvents() once ✅
  // Removed: this.setupEvents(); ❌
}
```

### 4. Reset Guard on Re-render

```javascript
render() {
  // Reset events guard so setupEvents can run fresh after re-render ✅
  this.eventsSetup = false;

  const displayValue = this.selectedDate ? this.formatDate(this.selectedDate) : '';
  this.shadowRoot.innerHTML = `...`;

  // ... render calendar ...

  if (this.isConnected) {
    setTimeout(() => this.setupEvents(), 0);  // Now runs only once ✅
  }
}
```

## How It Works Now

### Event Flow
```
User clicks input
↓
1 click listener fires (not 2 or 3)
↓
toggleCalendar() called once
↓
Calendar opens ✅
↓
User clicks a date
↓
selectDate() called once
↓
PAN message published once
↓
Calendar closes ✅
```

## Component Features

The date picker now works with all its features:

### Main Features
- **Input field** - Click to open calendar
- **Calendar icon** - Visual indicator (📅)
- **Clear button** (✕) - Appears when date is selected
- **Month navigation** - Previous/next month buttons (‹ ›)
- **Today button** - Jump to current date
- **Date selection** - Click any day to select

### Visual States
- **Today** - Highlighted in purple
- **Selected** - Purple background
- **Hover** - Light gray background
- **Disabled** - Gray text (when min/max set)

### Format Support
The component supports custom date formats:
```javascript
'format': 'YYYY-MM-DD'  // 2025-12-02
'format': 'MM/DD/YYYY'  // 12/02/2025
'format': 'DD-MM-YYYY'  // 02-12-2025
```

### Date Constraints
You can set min/max dates:
```javascript
attributes: {
  'topic': 'date.selected',
  'min': '2025-01-01',
  'max': '2025-12-31',
  'placeholder': 'Select a date in 2025'
}
```

## Testing

### Before Fix
```
1. Load "Date Selection" example
2. Click date input
3. See: Nothing happens ❌
4. Calendar doesn't open ❌
```

### After Fix
```
1. Load "Date Selection" example
2. See: Input field with "Select a date" placeholder
3. Click input
4. See: Calendar opens with current month ✅
5. Click a date (e.g., today)
6. See: Input shows formatted date ✅
7. See: Clear button (✕) appears ✅
8. Open PAN Monitor
9. Click another date
10. See: date.selected.change message with date and formatted value ✅
11. Click clear button
12. See: Input clears, PAN message shows null date ✅
```

### Advanced Testing
```
1. Click input to open calendar
2. Click ‹ button to go to previous month ✅
3. Click › button to go to next month ✅
4. Click "Today" button - jumps to current date and selects it ✅
5. Select a date
6. Click outside calendar - closes ✅
7. Click input again - reopens at selected month ✅
```

## PAN Messages

The component publishes to `{topic}.change`:

### When selecting a date:
```javascript
Topic: date.selected.change
Data: {
  date: "2025-12-02",
  formatted: "2025-12-02"
}
```

### When clearing:
```javascript
Topic: date.selected.change
Data: {
  date: null,
  formatted: ""
}
```

### Subscribing to set date:
You can also control the date picker via PAN:
```javascript
pc.publish({
  topic: 'date.selected.setValue',
  data: { date: '2025-12-25' }
});
```

## Example Enhancements

### With Validation
The example includes `pan-validation` which can validate date selections:

```javascript
components: [
  {
    name: 'pan-date-picker',
    attributes: {
      'topic': 'date.selected',
      'min': '2025-01-01',
      'max': '2025-12-31',
      'format': 'YYYY-MM-DD',
      'placeholder': 'Select a date'
    }
  },
  {
    name: 'pan-validation',
    attributes: {
      'topic': 'date.selected',
      'rules': JSON.stringify({
        required: true,
        message: 'Please select a date'
      })
    }
  }
]
```

### Date Range Picker
You could create a date range by using two date pickers:

```javascript
components: [
  {
    name: 'pan-date-picker',
    attributes: {
      'topic': 'dateRange.start',
      'placeholder': 'Start date'
    }
  },
  {
    name: 'pan-date-picker',
    attributes: {
      'topic': 'dateRange.end',
      'placeholder': 'End date'
    }
  }
]
```

Then use computed-state to ensure end > start.

## Files Changed

### `/Users/cdr/Projects/larc-repos/ui/pan-date-picker.mjs`

**Lines Changed:**
- Line 28: Added `this.eventsSetup = false;` guard variable
- Lines 31-38: Removed duplicate `setupEvents()` call from `connectedCallback()`
- Lines 64-67: Added guard check at start of `setupEvents()`
- Lines 261-262: Reset guard in `render()`

## Pattern Applied

This is the third component we've fixed with this pattern:

1. **file-upload** - Had duplicate upload events
2. **pan-date-picker** - Calendar wouldn't open
3. Future candidates to check for same issue

### The Pattern

```javascript
class Component extends HTMLElement {
  constructor() {
    super();
    this.eventsSetup = false;  // 1. Add guard
  }

  connectedCallback() {
    this.render();  // 2. Only render (don't call setupEvents twice)
  }

  setupEvents() {
    if (this.eventsSetup) return;  // 3. Guard check
    this.eventsSetup = true;

    // ... add listeners ...
  }

  render() {
    this.eventsSetup = false;  // 4. Reset for re-render
    this.shadowRoot.innerHTML = `...`;
    this.setupEvents();  // 5. Set up once
  }
}
```

## Prevention

When creating new components:
- ✅ Call `setupEvents()` only from `render()`
- ✅ Add guard variable and check
- ✅ Reset guard before re-render
- ❌ Don't call `setupEvents()` from `connectedCallback()`

## Summary

The date picker was fixed by preventing duplicate event listener setup. The component now works correctly:
- Click input to open calendar ✅
- Navigate months with prev/next buttons ✅
- Click dates to select ✅
- Today button works ✅
- Clear button works ✅
- PAN messages publish correctly ✅
- Calendar closes on outside click ✅

The same duplicate event listener pattern affected both file-upload and pan-date-picker, and the fix was identical: guard the `setupEvents()` call and only invoke it once per render cycle.
