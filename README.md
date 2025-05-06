# Firebase Browser

A simple React application to browse your Firestore database collections and display them in a table.

## Features

- Browse Firestore collections
- View collection data in a responsive table
- Built with React, TypeScript, and Material UI
- Uses React Query for data fetching
- State management with Zustand

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- A Firebase project with Firestore database

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure Firebase:
   - Open `src/firebase.ts`
   - Replace the placeholder values in `firebaseConfig` with your own Firebase project configuration
   - You can find these values in your Firebase project settings

### Running the Application

1. Start the development server:
   ```
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:5173`

## Using the Application

1. Select a collection from the dropdown menu
2. The application will fetch and display the data in a table
3. All document fields will be automatically detected and displayed

## Project Structure

```
src/
├── components/           # React components
│   ├── CollectionSelector.tsx
│   ├── DataTable.tsx
│   └── Layout.tsx
├── hooks/                # Custom React hooks
│   └── useFirestore.ts
├── services/             # API services
│   └── firestoreService.ts
├── App.tsx               # Main application component
├── firebase.ts           # Firebase configuration
├── index.css             # Global styles
├── main.tsx              # Application entry point
└── store.ts              # Zustand store for state management
```

## Customization

- To add or modify collections, update the `getCollections` function in `src/services/firestoreService.ts`
- To customize the UI, modify the Material UI theme in `src/main.tsx`

## Notes

- This application is for demonstration purposes
- In a production environment, you should implement proper authentication and security rules

## License

MIT 