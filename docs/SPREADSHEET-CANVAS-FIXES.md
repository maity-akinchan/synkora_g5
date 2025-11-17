# Spreadsheet & Canvas Save Functionality + Dark Mode Fixes

## Summary

This document describes the improvements made to enable saving functionality for spreadsheets and canvas files, as well
as fixing dark mode support for canvas and markdown components.

## Changes Made

### 1. Spreadsheet Save Functionality ✅

**File**: `app/projects/[projectId]/sheet/page.tsx`

**Features Added**:

- **Auto-save**: Spreadsheet data is automatically saved 2 seconds after the last change
- **Load on mount**: Saved spreadsheet data is loaded when the page opens
- **Save status indicator**: Visual feedback showing "Saving...", "Saved", or "Save failed"
- **Multiple save triggers**:
    - Debounced auto-save after data changes
    - Save on window blur
    - Save on tab visibility change
    - Save on page unload/navigation away
- **Data persistence**: Both cell data and merged cells are saved to the database

**API Integration**:

- Uses existing `/api/projects/[id]/spreadsheet` endpoint (GET and POST)
- Saves complete spreadsheet state including:
    - Cell values
    - Merged cell information

**User Experience**:

- Loading spinner while fetching saved data
- Real-time save status indicator in the ribbon menu
- Seamless auto-save without user intervention

### 2. Canvas Save Functionality ✅

**File**: `components/canvas/collaborative-canvas.tsx`

**Status**: Already implemented and working!

The canvas already has comprehensive save functionality:

- Auto-save 3 seconds after last change
- Real-time collaboration support via WebSocket
- Save on window blur, visibility change, and page unload
- Visual save status indicator (Saving/Saved/Error)
- Loads saved state on mount with fallback to default "Synkora" text

### 3. Dark Mode for Markdown ✅

**Files Modified**:

- `components/markdown/markdown-editor.tsx`
- `components/markdown/markdown-preview.tsx`
- `components/markdown/markdown-file-list.tsx`
- `components/markdown/markdown-toolbar.tsx`
- `app/projects/[projectId]/markdown/page.tsx`

**Dark Mode Features**:

- Editor background: `dark:bg-gray-900`
- Editor text: `dark:text-gray-100`
- Preview background: `dark:bg-gray-900`
- Preview prose styling: `dark:prose-invert`
- File list background: `dark:bg-gray-950`
- Toolbar background: `dark:bg-gray-900`
- Border colors: `dark:border-gray-800`
- Hover states: `dark:hover:bg-gray-800`
- Text colors: `dark:text-slate-400`

### 4. Dark Mode for Canvas ✅

**File**: `components/canvas/collaborative-canvas.tsx`

**Status**: Already implemented and working!

The canvas has built-in dark mode detection:

- Automatically detects system dark mode preference
- Respects Tailwind's class-based dark mode (`<html class="dark">`)
- Applies appropriate background colors based on theme
- Watches for theme changes via MutationObserver
- Background: `bg-neutral-900` in dark mode, `bg-white` in light mode

### 5. Dark Mode for Spreadsheet ✅

**File**: `app/projects/[projectId]/sheet/page.tsx`

**Dark Mode Features**:

- Ribbon menu: Dark background and borders
- Buttons: Dark styling with proper hover states
- Spreadsheet cells: Dark background and text
- Headers: Dark theme support
- Context menu: Dark background and hover states
- Custom CSS variables for theming:
  ```css
  --ribbon-bg, --ribbon-border, --button-bg, --button-border,
  --button-text, --button-hover, --context-bg, --context-border,
  --context-hover, --text-color, --separator-bg, --spreadsheet-bg
  ```

## Technical Details

### Spreadsheet Save Implementation

```typescript
// Auto-save with debounce
useEffect(() => {
    if (isLoading) return;
    
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
        saveSpreadsheet();
    }, 2000);
    
    return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };
}, [data, mergedCells, saveSpreadsheet, isLoading]);
```

### Canvas Save Implementation

```typescript
// Already implemented - saves on change with debounce
const saveCanvasState = useCallback(async () => {
    // Creates snapshot from editor.store.allRecords()
    // Sends to /api/projects/[id]/canvas
    // Shows save status indicator
}, [editor, projectId]);
```

### Dark Mode Detection (Canvas)

```typescript
useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const getTheme = () => {
        if (document.documentElement.classList.contains('dark')) return 'dark';
        return media?.matches ? 'dark' : 'light';
    };
    
    setTldrawTheme(getTheme());
    
    const observer = new MutationObserver(() => setTldrawTheme(getTheme()));
    observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
    });
}, []);
```

## Testing Checklist

### Spreadsheet

- [x] Create new spreadsheet and add data
- [x] Verify auto-save triggers after 2 seconds
- [x] Navigate away and back - data should persist
- [x] Check save status indicator appears
- [x] Test in both light and dark mode
- [x] Test merged cells are saved and restored

### Canvas

- [x] Draw on canvas
- [x] Verify auto-save triggers after 3 seconds
- [x] Refresh page - drawing should persist
- [x] Test in both light and dark mode
- [x] Verify "Synkora" default text appears on empty canvas

### Markdown

- [x] Create markdown file
- [x] Verify save works (already implemented)
- [x] Test editor in dark mode
- [x] Test preview in dark mode
- [x] Test file list in dark mode
- [x] Test toolbar in dark mode

## API Endpoints Used

### Spreadsheet

- `GET /api/projects/[id]/spreadsheet` - Load spreadsheet data
- `POST /api/projects/[id]/spreadsheet` - Save spreadsheet data

### Canvas

- `GET /api/projects/[id]/canvas` - Load canvas state
- `POST /api/projects/[id]/canvas` - Save canvas state

### Markdown

- `GET /api/projects/[id]/markdown` - List markdown files
- `POST /api/projects/[id]/markdown` - Create markdown file
- `PATCH /api/markdown/[id]` - Update markdown file content

## Database Schema

The following Prisma models are used:

```prisma
model Spreadsheet {
  id        String   @id @default(cuid())
  projectId String   @unique
  data      Json     // Stores cell data and merged cells
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Canvas {
  id        String   @id @default(cuid())
  projectId String   @unique
  state     Json     // Stores canvas objects and state
  version   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model MarkdownFile {
  id        String   @id @default(cuid())
  projectId String
  title     String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

## User Experience Improvements

1. **No manual save needed**: All components auto-save automatically
2. **Visual feedback**: Save status indicators show what's happening
3. **Data safety**: Multiple save triggers ensure data isn't lost
4. **Seamless dark mode**: All components respect system/app theme
5. **Loading states**: Proper loading indicators while fetching data
6. **Error handling**: Clear error messages if save fails

## Future Enhancements

Potential improvements to consider:

1. **Version History**: Track changes over time
2. **Conflict Resolution**: Better handling of concurrent edits
3. **Export Options**: Download spreadsheet as Excel/CSV
4. **Canvas Export**: Export canvas as PNG/SVG
5. **Offline Support**: IndexedDB for offline editing
6. **Undo/Redo**: Enhanced history management

## Conclusion

All requested features have been successfully implemented:

- ✅ Spreadsheet saving enabled with auto-save
- ✅ Canvas saving already working (verified)
- ✅ Dark mode for markdown fully implemented
- ✅ Dark mode for canvas already working
- ✅ Dark mode for spreadsheet added

The application now provides a seamless editing experience with automatic persistence and full dark mode support across
all document types.
