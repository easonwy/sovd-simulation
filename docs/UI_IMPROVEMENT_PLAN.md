# Console UI Improvement Plan

Based on the visual review against the reference design, the following improvements will be implemented for the SOVD Explorer Console:

## 1. Top Navigation Bar
- **Add Navigation Controls**: Implement Home, Back, and Forward buttons left of the URL bar (visual only for now, or linked to history).
- **Styling**: Align height and spacing of the URL bar and Method selector.

## 2. Request Parameters & Headers
- **Grid Layout**: Transform the input list into a tight, spreadsheet-like grid.
    - Remove spacing between rows.
    - Use full-width/height inputs within cells.
    - Remove rounded borders on individual inputs.
- **UX**: Simpler "Enter key" / "Enter value" placeholders.

## 3. Response Area
- **Status Bar**: Update format to match specific text: `Response Status: <code/text> Duration: <ms> Content size: <bytes>`.
- **Formatting**:
    - Improve JSON viewer legibility (font, spacing).
    - Add a **Copy to Clipboard** button.
- **Tabs**: Style "Body" and "Headers" tabs to match the specific "tabbed folder" look if possible, or clean minimal tabs.

## 4. General Polish
- **Typos**: Fix "inclu-de-schema" typo saw in screenshot if it persists.
- **Colors**: Ensure header colors and button colors match standard vector green/blue palette.
