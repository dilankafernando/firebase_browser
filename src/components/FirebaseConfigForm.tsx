import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFirebaseStore } from '../store/firebaseStore';
import { FirebaseConfig } from '../types';

export default function FirebaseConfigForm() {
  const [configType, setConfigType] = useState<'client' | 'serviceAccount'>('client');
  const { register, handleSubmit, formState: { errors } } = useForm<FirebaseConfig>();
  const { setConfigType: storeSetConfigType, setFirebaseConfig, connect } = useFirebaseStore();
  
  const onSubmit = async (data: FirebaseConfig) => {
    storeSetConfigType(configType);
    setFirebaseConfig(data);
    await connect();
  };
  
  // Handle service account JSON import
  const handleServiceAccountImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Handle service account config
        console.log('Service account loaded:', json);
        // This would be implemented if we supported server-side authentication
      } catch (err) {
        console.error('Failed to parse JSON:', err);
      }
    };
    reader.readAsText(file);
  };
  
  // Demo configuration sample
  const fillDemoConfig = () => {
    // Note: This is just a placeholder, not a real Firebase config
    const demoConfig: FirebaseConfig = {
      apiKey: "AIzaSyDEMOKEY123456789",
      authDomain: "demo-project.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:abcdef123456"
    };
    
    setFirebaseConfig(demoConfig);
    // Pre-fill the form values manually
    Object.entries(demoConfig).forEach(([key, value]) => {
      const element = document.getElementById(key) as HTMLInputElement;
      if (element) element.value = value;
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        Connect to Firebase
      </h2>
      
      <div className="flex space-x-4 mb-6">
        <button
          type="button"
          className={`px-4 py-2 rounded-md ${
            configType === 'client' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setConfigType('client')}
        >
          Client SDK Config
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md ${
            configType === 'serviceAccount' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
          onClick={() => setConfigType('serviceAccount')}
        >
          Service Account (JSON)
        </button>
      </div>
      
      {configType === 'client' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                id="apiKey"
                type="text"
                className="input-field dark:bg-gray-700 dark:text-white"
                {...register('apiKey', { required: 'API Key is required' })}
              />
              {errors.apiKey && (
                <p className="text-red-500 text-xs mt-1">{errors.apiKey.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auth Domain
              </label>
              <input
                id="authDomain"
                type="text"
                className="input-field dark:bg-gray-700 dark:text-white"
                {...register('authDomain', { required: 'Auth Domain is required' })}
              />
              {errors.authDomain && (
                <p className="text-red-500 text-xs mt-1">{errors.authDomain.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project ID
              </label>
              <input
                id="projectId"
                type="text"
                className="input-field dark:bg-gray-700 dark:text-white"
                {...register('projectId', { required: 'Project ID is required' })}
              />
              {errors.projectId && (
                <p className="text-red-500 text-xs mt-1">{errors.projectId.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Storage Bucket
              </label>
              <input
                id="storageBucket"
                type="text"
                className="input-field dark:bg-gray-700 dark:text-white"
                {...register('storageBucket', { required: 'Storage Bucket is required' })}
              />
              {errors.storageBucket && (
                <p className="text-red-500 text-xs mt-1">{errors.storageBucket.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Messaging Sender ID
              </label>
              <input
                id="messagingSenderId"
                type="text"
                className="input-field dark:bg-gray-700 dark:text-white"
                {...register('messagingSenderId', { required: 'Messaging Sender ID is required' })}
              />
              {errors.messagingSenderId && (
                <p className="text-red-500 text-xs mt-1">{errors.messagingSenderId.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                App ID
              </label>
              <input
                id="appId"
                type="text"
                className="input-field dark:bg-gray-700 dark:text-white"
                {...register('appId', { required: 'App ID is required' })}
              />
              {errors.appId && (
                <p className="text-red-500 text-xs mt-1">{errors.appId.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={fillDemoConfig}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Fill with Demo Config
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Connect
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Drag and drop your service account JSON file here, or
            </p>
            <label className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md cursor-pointer hover:bg-blue-700">
              Browse Files
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleServiceAccountImport}
              />
            </label>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Note: Service account authentication requires server-side integration for security reasons.
              This feature is not fully implemented in this client-side application.
            </p>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              className="btn-primary opacity-50 cursor-not-allowed"
              disabled
            >
              Connect with Service Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 