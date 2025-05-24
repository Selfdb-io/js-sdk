# SelfDB SDK Examples

This directory contains example code showing how to use the SelfDB JavaScript SDK in different environments.

## Basic Usage (`basic-usage.js`)

A comprehensive example showing all major SDK features:
- Authentication (login/logout)
- Database operations (CRUD, raw SQL)
- Storage operations (buckets, file uploads)
- Realtime subscriptions
- Cloud function invocation

**To run:**
```bash
# Replace the configuration values with your actual SelfDB instance
node basic-usage.js
```

## React Integration (`react-integration.tsx.example`)

A complete React component example demonstrating:
- Authentication state management
- User management with real-time updates
- File upload functionality
- Error handling and loading states

**To use this example:**

1. **Copy the file to your React project:**
   ```bash
   cp react-integration.tsx.example YourReactApp/src/components/SelfDBExample.tsx
   ```

2. **Install required dependencies:**
   ```bash
   npm install react @types/react @selfdb/js-sdk
   ```

3. **Set up environment variables in your React app:**
   ```bash
   # .env.local (for Next.js) or .env (for Create React App)
   REACT_APP_SELFDB_URL=http://localhost:8000
   REACT_APP_SELFDB_STORAGE_URL=http://localhost:8001
   REACT_APP_SELFDB_ANON_KEY=your-anonymous-key-here
   ```

4. **Import and use in your app:**
   ```tsx
   import SelfDBExample from './components/SelfDBExample'
   
   function App() {
     return (
       <div>
         <SelfDBExample />
       </div>
     )
   }
   ```

## Environment Setup

Before running any examples, ensure you have:

1. **A running SelfDB instance** (see main SelfDB documentation)
2. **Your anonymous key** from the SelfDB `.env` file
3. **Proper CORS settings** if running from a browser

## Common Configuration

All examples expect these environment variables or configuration:

- `baseUrl`: Your SelfDB API URL (default: `http://localhost:8000`)
- `storageUrl`: Your SelfDB Storage Service URL (default: `http://localhost:8001`)  
- `anonKey`: Your SelfDB anonymous API key (required)

## Framework-Specific Notes

### React/Next.js
- Use environment variables with `REACT_APP_` or `NEXT_PUBLIC_` prefix
- Consider using React Query for better data management
- Implement proper error boundaries for production use

### Vue.js
- Use `VITE_` prefix for environment variables in Vite projects
- Consider using Pinia for state management
- Implement proper error handling with try/catch blocks

### Node.js
- Use `process.env` for environment variables
- Consider using dotenv for local development
- Implement proper logging and error handling

## Getting Help

If you encounter issues with these examples:
1. Check that your SelfDB instance is running
2. Verify your environment variables are set correctly
3. Ensure your anonymous key is valid
4. Check the browser console for any CORS or network errors