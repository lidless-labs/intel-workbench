# Configuration

## Frontend Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_APP_PORT=5182
VITE_STORAGE_KEY=intel-workbench-projects
VITE_ENABLE_TOUR=true
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_PORT` | Frontend port | 5182 |
| `VITE_STORAGE_KEY` | localStorage key for projects | intel-workbench-projects |
| `VITE_ENABLE_TOUR` | Show guided tour on first visit | true |

## Interface and Routes

Intel Workbench uses the Analyst's Desk interface at every route:

- `http://localhost:5182/` - Projects
- `http://localhost:5182/ach` - ACH matrices
- `http://localhost:5182/bias` - Bias checklist
- `http://localhost:5182/ioc` - IOC extractor
- `http://localhost:5182/diamond` - Diamond Model
- `http://localhost:5182/export` - Import and export
- `http://localhost:5182/docs` - Documentation

## Running the Application

### Development

```bash
npm install
npm run dev
```

Starts on `http://localhost:5182`

Hot reload enabled. Changes to components, styles, and configuration are instant.

### Production Build

```bash
npm run build
npm run preview
```

Outputs to `dist/` directory. Serve with any static file server:

```bash
python3 -m http.server 8080 --directory dist
# or
npx serve dist
```

## Data Storage

### localStorage Keys

Intel Workbench stores all analysis data in browser localStorage:

| Key | Purpose | Typical Size |
|-----|---------|--------------|
| `intel-workbench-projects` | All projects, hypotheses, evidence, bias notes | 0.5-5MB |

Analysis data stays local. The initial page load may request Google Fonts.

### Maximum Storage

Most modern browsers provide 5-10MB per domain. Intel Workbench uses minimal overhead, allowing:
- 100-200 complete intelligence analysis projects
- 1,000+ individual evidence items
- Full audit trail of analysis work

For larger deployments, export old projects to JSON and clear localStorage.

## Project Backup and Restore

All backup, sharing, and restore workflows run on the **Export** page (`/export`). Select a project first, then use the sections below.

### Exporting a Project

1. Open the project you want to export
2. Navigate to **Export** (`/export`)
3. Choose a format:
   - **JSON:** Full project backup with all metadata (for backup or sharing with another analyst)
   - **Markdown:** Formatted report (for documentation or stakeholder review)
4. Copy or download the output:
   - **Copy to Clipboard:** Paste into email, chat, or a text file
   - **Download File:** Save as `.json` or `.md` on disk

### Importing a Project

1. Navigate to **Export** (`/export`)
2. Scroll to the **Import Project** section
3. Paste a previously exported JSON project into the text area
4. Click **Import**

If a project with the same ID already exists, it is replaced. To share with a colleague, send them the JSON (via copy/paste, email, or a downloaded file) and have them paste it into Import on their instance.

## Bias Checklist Configuration

The 12 biases are built-in and not configurable. To customize:

Edit `src/data/biasData.ts`:

```typescript
export const BIASES = [
  {
    id: 'anchoring',
    category: 'Cognitive',
    name: 'Anchoring Bias',
    description: 'Over-reliance on initial information...',
    questions: [
      'Are we anchored to an initial estimate?',
      'Would alternative data lead to different conclusion?',
    ],
  },
  // ...
];
```

## Scoring Configuration

To adjust ACH scoring weights, edit `src/utils/achScoring.ts`:

```typescript
export const CREDIBILITY_MULTIPLIERS = {
  'High': 1.5,
  'Medium': 1.0,
  'Low': 0.5,
};

export const RELEVANCE_MULTIPLIERS = {
  'High': 1.5,
  'Medium': 1.0,
  'Low': 0.5,
};

export const RATING_VALUES = {
  'C': -1,    // Consistent
  'I': 2,     // Inconsistent (penalized)
  'N': 0,     // Neutral
  'NA': 0,    // Not Applicable
};
```

Default weights follow Heuer's original ACH methodology. Adjust based on your organization's standards.

## Guided Tour Configuration

First-time users see an interactive tour powered by driver.js. To customize:

Edit `src/components/GuidedTour.tsx`:

```typescript
const tourSteps = [
  {
    element: '.project-list',
    popover: {
      title: 'Your Projects',
      description: 'Create and manage intelligence analysis projects here...',
    },
  },
  // Add or remove steps
];
```

To disable tour for all users:

```bash
VITE_ENABLE_TOUR=false npm run dev
```

Or programmatically:

```typescript
useProjectStore.setState({ tourCompleted: true });
```

## Browser Compatibility

Intel Workbench requires:
- Modern browser with ES2020 support
- localStorage enabled (required for offline operation)
- 5MB+ localStorage quota

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Performance Optimization

### For Large Projects

If you have 500+ evidence items:

1. **Split into sub-projects** - One project per major hypothesis or timeframe
2. **Archive old projects** - Export to JSON and delete from localStorage
3. **Use Markdown export** - Share results without localStorage overhead
4. **Clear browser data** - Periodically clean up localStorage

### Storage Quota

Monitor storage usage:

```javascript
// In browser console
navigator.storage.estimate().then(estimate => {
  console.log(`Usage: ${estimate.usage} bytes`);
  console.log(`Quota: ${estimate.quota} bytes`);
});
```

If nearing quota:
1. Export projects to JSON
2. Delete oldest projects from localStorage
3. Import as needed

### Batch Operations

For editing many items:

1. Export project to JSON
2. Edit JSON in text editor
3. Re-import

Faster than clicking through the UI for bulk updates.

## Keyboard Shortcuts

Enable in settings (coming soon). Current bindings:

| Key | Action |
|-----|--------|
| `Tab` | Move between cells in ACH matrix |
| `Shift+Tab` | Move backward between cells |
| `Enter` | Open rating menu for current cell |
| `Escape` | Close menus and dialogs |
| `Ctrl+S` / `Cmd+S` | Export current project (browser save dialog) |

## Multi-Device Sync

Intel Workbench stores data locally with no built-in sync. To use across devices:

1. **Export on Device A:** JSON copy or download from the Export page
2. **Transfer:** Email, cloud storage, USB drive, or paste into chat
3. **Import on Device B:** Paste the JSON into Import on the Export page

Or manually manage via cloud storage:
1. Export to OneDrive/Google Drive/Dropbox
2. Keep a master backup in the cloud
3. Import to any device as needed

For automatic sync, consider pairing with a custom backend (not included).

## Troubleshooting

### Data Not Saving

Verify localStorage is enabled and you haven't hit quota:

```javascript
// Check quota
navigator.storage.estimate().then(e => console.log(e));

// Clear and try again
localStorage.removeItem('intel-workbench-projects');
// Reload page and create a new project
```

### Projects Disappearing

Most likely cause: Browser cleared storage (automatic cleanup, incognito mode closure, or cache clear).

Prevention:
1. Regularly export projects to JSON
2. Keep backups in cloud storage
3. Use persistent browser (not incognito)

### Slow Scoring

With 500+ evidence items, scoring may take 100-500ms. This is expected.

Workarounds:
1. Split into multiple projects
2. Remove low-relevance evidence
3. Archive completed analysis

Contact support if scoring takes >1 second for normal projects.
