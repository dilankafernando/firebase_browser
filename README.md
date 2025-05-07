# Firebase Browser

A lightweight browser and management tool for Firebase Firestore databases. This application allows you to connect to multiple Firebase projects, browse collections, and perform CRUD operations on Firestore documents.

## Features

- 🔐 Connect to multiple Firebase projects
- 📂 Browse and search Firestore collections
- 🔍 Filter data with custom queries
- ✏️ Add, edit, and delete documents
- 📊 Table and JSON views for document data
- 📄 Pagination for large collections
- 🌐 Client-side only - no backend required

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/FirebaseBrowser.git
   cd FirebaseBrowser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

This will create a `dist` directory with the compiled application.

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Firebase Configuration

To use Firebase Browser, you'll need to add your Firebase project configuration(s). After signing in, you can add multiple Firebase connections through the Settings page.

You'll need:
- Firebase API Key
- Project ID
- Auth Domain
- (Optional) Storage Bucket
- (Optional) Messaging Sender ID
- (Optional) App ID

## Security

Firebase Browser encrypts your Firebase configurations using AES encryption before storing them in browser local storage. However, you should ensure:

1. Use HTTPS when hosting the application
2. Be cautious when using on shared computers
3. Use appropriate Firebase security rules for your Firestore database

## Technologies Used

- React
- TypeScript
- Material UI
- Firebase/Firestore
- Zustand for state management
- React Query for data fetching
- Vite for building and development

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 