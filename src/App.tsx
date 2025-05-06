import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import './App.css'
import FirebaseConfigForm from './components/FirebaseConfigForm'
import QueryBuilder from './components/QueryBuilder'
import ResultViewer from './components/ResultViewer'
import Header from './components/Header'
import { useFirebaseStore } from './store/firebaseStore'
import { useQueryStore } from './store/queryStore'

function App() {
  const [activeView, setActiveView] = useState<'table' | 'json'>('table')
  const isConnected = useFirebaseStore(state => state.isConnected)
  const queryResults = useQueryStore(state => state.results)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster position="top-right" />
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Firebase Firestore Browser
        </h1>
        
        {!isConnected ? (
          <FirebaseConfigForm />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <QueryBuilder />
            </div>
            
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Results</h2>
                  
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded-md ${activeView === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                      onClick={() => setActiveView('table')}
                    >
                      Table
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md ${activeView === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                      onClick={() => setActiveView('json')}
                    >
                      JSON
                    </button>
                  </div>
                </div>
                
                {queryResults.length > 0 ? (
                  <ResultViewer activeView={activeView} data={queryResults} />
                ) : (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No results to display. Run a query to see data.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
