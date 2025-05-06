# Firebase Firestore Browser

A modern web application for browsing, querying, and visualizing Firebase Firestore data.

## Features

- **Connect to Firebase Firestore** - Connect to any Firebase project using the Web SDK configuration 
- **Visual Query Builder** - Create queries with an intuitive UI for filtering, ordering, and limiting results
- **Dual View Mode**:
  - Table View - Sortable, searchable, and paginated table with automatic columns
  - JSON View - Expandable/collapsible tree view with syntax highlighting
- **Copy to Clipboard** - Export results as JSON or CSV with one click
- **Save Queries** - Save and reload your frequently-used queries
- **Dark/Light Theme** - Toggle between light and dark themes for better viewing comfort

## Tech Stack

- **React** - Built with React and TypeScript for a modern, maintainable frontend
- **Firebase** - Utilizes Firebase JS SDK (v9+) for Firestore operations
- **Zustand** - Lightweight state management
- **TanStack Table** - Powerful data grid for the Table View
- **react-json-view-lite** - JSON tree viewer for the JSON View
- **Tailwind CSS** - Utility-first CSS framework for styling

## Getting Started

### Prerequisites

- Node.js 14+ and npm/yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/firebase-browser.git
cd firebase-browser
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open your browser to `http://localhost:5173`

## Usage

1. **Connect to Firebase**:
   - Enter your Firebase Web SDK configuration details
   - Use the Demo Config option to try the app with a sample configuration

2. **Build a Query**:
   - Select a collection
   - Add filters (field, operator, value)
   - Set sorting options
   - Specify a document limit

3. **View Results**:
   - Toggle between Table and JSON views
   - Sort table columns
   - Search/filter results
   - Copy data to clipboard as JSON or CSV

4. **Save Queries**:
   - Save frequently used queries for later use
   - Reload saved queries with a single click

## Limitations

- Service Account authentication is not supported in this client-side only implementation
  (would require a backend server for secure handling of service account keys)
- Collection discovery is limited in the current implementation

## License

MIT

## Acknowledgements

- [Firebase](https://firebase.google.com/)
- [React](https://reactjs.org/)
- [TanStack Table](https://tanstack.com/table/v8)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [DaisyUI](https://daisyui.com/)
