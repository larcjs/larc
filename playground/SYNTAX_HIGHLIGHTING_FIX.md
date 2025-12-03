# Syntax Highlighting Fix

## Problem

In the "View Code" panel, every `<` character was being replaced with `class="tag">`, making the HTML output completely broken and unreadable.

Example of broken output:
```
class="tag">pan-data-connector resource="users" base-url="https://api.example.com">class="tag">/pan-data-connector>
```

## Root Cause

The syntax highlighting function had **overlapping regex replacements** that interfered with each other:

### Original Broken Code

```javascript
// Step 1: Highlight tags
code = code.replace(
  /(&lt;\/?)([\w-]+)/g,
  '$1<span class="tag">$2</span>'
);
// This adds: <span class="tag">

// Step 2: Highlight attributes (PROBLEM!)
code = code.replace(
  /([\w-]+)(=)(")(.*?)(")/g,
  '<span class="attr-name">$1</span>...'
);
// This matches ANY word with =, including "class" from the span we just added!
```

### The Issue

1. First regex adds: `<span class="tag">tagname</span>`
2. Second regex sees `class="tag"` and thinks it's an HTML attribute
3. It wraps `class` in another span, creating malformed HTML
4. The browser then fails to render the spans correctly
5. Text like `class="tag">` leaks into the visible output

## Solution

**Process tags and attributes together in a single replacement**, using a callback function to avoid conflicts:

```javascript
code = code.replace(
  /(&lt;\/?)([\w-]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*(\/?&gt;)/g,
  (match, openBracket, tagName, attrs, closeBracket) => {
    // Build result manually to avoid nested replacements
    let result = openBracket + '<span class="tag">' + tagName + '</span>';

    // Highlight attributes if present
    if (attrs) {
      result += attrs.replace(
        /([\w-]+)(=)(")(.*?)(")/g,
        ' <span class="attr-name">$1</span><span class="punctuation">$2$3</span><span class="attr-value">$4</span><span class="punctuation">$5</span>'
      );
    }

    result += '<span class="punctuation">' + closeBracket + '</span>';
    return result;
  }
);
```

## How It Works Now

### Single Pass Processing

The new regex captures the entire tag structure in one match:
- `(&lt;\/?)` - Opening bracket with optional `/`
- `([\w-]+)` - Tag name
- `((?:\s+[\w-]+(?:="[^"]*")?)*)` - All attributes (optional)
- `(\/?&gt;)` - Closing bracket with optional `/`

### Callback Function

Instead of string replacement, we use a callback that:
1. Receives all captured groups
2. Manually constructs the highlighted HTML
3. Only processes attributes within the captured attribute string
4. Returns the complete highlighted tag in one piece

This ensures **no interference** between tag highlighting and attribute highlighting.

## Results

### Before (Broken)
```
class="tag">pan-data-connector resource="users">class="tag">/pan-data-connector>
```

### After (Fixed)
```html
<span class="tag">pan-data-connector</span>
<span class="attr-name">resource</span><span class="punctuation">="</span><span class="attr-value">users</span><span class="punctuation">"</span>
<span class="punctuation">&gt;</span>
<span class="tag">/pan-data-connector</span>
<span class="punctuation">&gt;</span>
```

Which renders as:
```html
<pan-data-connector resource="users" base-url="https://api.example.com">
</pan-data-connector>
```

## Testing

1. **Start playground:**
   ```bash
   cd playground
   python3 -m http.server 8080
   open http://localhost:8080/
   ```

2. **Load "Data Flow" example**

3. **Click "View Code" button**

4. **Verify:**
   - HTML is properly displayed with syntax highlighting
   - No `class="tag">` appears in the output
   - Tag names are colored (green)
   - Attribute names are colored (blue)
   - Attribute values are colored (orange)
   - Code is readable and valid

## Why This Pattern?

### Anti-Pattern: Sequential Regex Replacements

```javascript
// ❌ BAD: Each replacement can break the previous one
code = replaceA(code);
code = replaceB(code); // Might match text added by replaceA
code = replaceC(code); // Might match text added by replaceB
```

### Better Pattern: Single-Pass with Callback

```javascript
// ✅ GOOD: Single replacement, manual construction
code = code.replace(regex, (match, ...groups) => {
  // Build result without creating intermediate text
  return constructResult(groups);
});
```

## Files Changed

- **`components/pg-exporter.mjs`**: Fixed `highlightHTML()` method (lines 266-305)

## Related Issues

This same pattern causes issues in many syntax highlighters. Other vulnerable scenarios:

1. **JSON highlighting** - `"key": "value"` can interfere with string highlighting
2. **CSS highlighting** - `class` selectors can interfere with HTML class attributes
3. **Markdown highlighting** - `[link](url)` can interfere with HTML tag highlighting

The solution is always: **process in a single pass with explicit boundaries**.

## Benefits

✅ **Correct rendering** - HTML displays properly
✅ **No text leakage** - Styling spans don't appear in output
✅ **Proper syntax colors** - Tags, attributes, values all highlighted
✅ **Copy/paste works** - Generated HTML is valid
✅ **Download works** - Exported files are correct
✅ **Performance** - Single regex pass is faster than multiple

The code panel is now fully functional! 🎉
