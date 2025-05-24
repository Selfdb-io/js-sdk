# 🚀 SelfDB JavaScript SDK - Super Simple Guide

**The easiest way to use SelfDB in your JavaScript/TypeScript apps!**

Perfect for: AI assistants, beginners, copy-paste coding, and rapid prototyping.

## 📋 Copy This Checklist for AI

```
[ ] Install: npm install @selfdb/js-sdk
[ ] Get ANON_KEY from SelfDB .env file
[ ] Create client with createClient()
[ ] Use db.from() for database queries (like Supabase)
[ ] Use storage.upload() for file uploads
[ ] Use auth.login() for authentication
[ ] All methods return promises - use await
```

## ⚡ 1-Minute Setup

### Step 1: Install
```bash
npm install @selfdb/js-sdk
```

### Step 2: Get Your Anonymous Key
Look in your SelfDB `.env` file for this line:
```bash
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Copy that long string after `ANON_KEY=`

### Step 3: Create Client
```typescript
import { createClient } from '@selfdb/js-sdk'

const selfdb = createClient({
  baseUrl: 'http://localhost:8000',        // Your SelfDB URL
  storageUrl: 'http://localhost:8001',     // Your storage URL
  anonKey: 'YOUR_ANON_KEY_HERE'            // Paste your key here
})
```

**✅ Done! You can now use SelfDB!**

## 🎯 Most Common Tasks (Copy & Paste Ready)

### 🔐 Login a User
```typescript
// Login existing user
const { user } = await selfdb.auth.login({
  email: 'user@example.com',
  password: 'their-password'
})
console.log('Logged in:', user.email)
```

### 👤 Register New User  
```typescript
// Create new user account
const user = await selfdb.auth.register({
  email: 'new@example.com',
  password: 'new-password'
})
console.log('Created user:', user.email)
```

### 📊 Get Data from Database (Like SELECT)
```typescript
// Get all users
const users = await selfdb.db.from('users').execute()

// Get users with filters
const activeUsers = await selfdb.db
  .from('users')
  .where('active', true)
  .order('created_at', 'desc')
  .limit(10)
  .execute()

// Get one user by ID
const user = await selfdb.db
  .from('users')
  .where('id', 123)
  .single()
```

### ➕ Add Data to Database (Like INSERT)
```typescript
// Add new record
const newUser = await selfdb.db.from('users').insert({
  email: 'new@example.com',
  name: 'John Doe',
  active: true
})
```

### 📝 Update Data in Database
```typescript
// Update records
const updatedUsers = await selfdb.db
  .from('users')
  .where('id', 123)
  .update({ name: 'New Name' })
```

### ❌ Delete Data from Database
```typescript
// Delete records (requires where clause for safety)
const deletedCount = await selfdb.db
  .from('users')
  .where('id', 123)
  .delete()
```

### 📁 Upload Files
```typescript
// Upload a file to storage
const file = document.getElementById('fileInput').files[0]
const result = await selfdb.storage.upload('my-bucket', file)
console.log('Uploaded file ID:', result.file.id)
```

### 📥 Download Files
```typescript
// Download a file
const blob = await selfdb.storage.download('my-bucket', fileId)
// Convert to URL for display
const url = URL.createObjectURL(blob)
```

## 🏗️ Complete Example App

Here's a complete working example you can copy and modify:

```typescript
import { createClient } from '@selfdb/js-sdk'

// 1. Setup client
const selfdb = createClient({
  baseUrl: 'http://localhost:8000',
  storageUrl: 'http://localhost:8001', 
  anonKey: 'your-anon-key-here'
})

// 2. User management functions
export async function loginUser(email: string, password: string) {
  try {
    const { user } = await selfdb.auth.login({ email, password })
    return { success: true, user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function registerUser(email: string, password: string) {
  try {
    const user = await selfdb.auth.register({ email, password })
    return { success: true, user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 3. Database functions
export async function getUsers() {
  return await selfdb.db.from('users').execute()
}

export async function createUser(userData: any) {
  return await selfdb.db.from('users').insert(userData)
}

export async function updateUser(id: number, updates: any) {
  return await selfdb.db.from('users').where('id', id).update(updates)
}

export async function deleteUser(id: number) {
  return await selfdb.db.from('users').where('id', id).delete()
}

// 4. File upload function
export async function uploadFile(bucketName: string, file: File) {
  try {
    const result = await selfdb.storage.upload(bucketName, file)
    return { success: true, file: result.file }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 5. Get file URL for display
export function getFileUrl(bucketName: string, fileId: number) {
  return selfdb.storage.getUrl(bucketName, fileId)
}
```

## 🔧 Environment Setup (.env file)

Create a `.env` file in your project:

```bash
# For Vite/React projects
VITE_SELFDB_URL=http://localhost:8000
VITE_SELFDB_STORAGE_URL=http://localhost:8001
VITE_SELFDB_ANON_KEY=your-anon-key-here

# For Next.js projects  
NEXT_PUBLIC_SELFDB_URL=http://localhost:8000
NEXT_PUBLIC_SELFDB_STORAGE_URL=http://localhost:8001
NEXT_PUBLIC_SELFDB_ANON_KEY=your-anon-key-here

# For Node.js projects
SELFDB_URL=http://localhost:8000
SELFDB_STORAGE_URL=http://localhost:8001
SELFDB_ANON_KEY=your-anon-key-here
```

Then use in your code:

```typescript
// For Vite/React
const selfdb = createClient({
  baseUrl: import.meta.env.VITE_SELFDB_URL,
  storageUrl: import.meta.env.VITE_SELFDB_STORAGE_URL,
  anonKey: import.meta.env.VITE_SELFDB_ANON_KEY
})

// For Next.js
const selfdb = createClient({
  baseUrl: process.env.NEXT_PUBLIC_SELFDB_URL,
  storageUrl: process.env.NEXT_PUBLIC_SELFDB_STORAGE_URL,
  anonKey: process.env.NEXT_PUBLIC_SELFDB_ANON_KEY
})

// For Node.js
const selfdb = createClient({
  baseUrl: process.env.SELFDB_URL,
  storageUrl: process.env.SELFDB_STORAGE_URL,
  anonKey: process.env.SELFDB_ANON_KEY
})
```

## 📱 React Component Example

```tsx
import React, { useState, useEffect } from 'react'
import { createClient } from '@selfdb/js-sdk'

const selfdb = createClient({
  baseUrl: import.meta.env.VITE_SELFDB_URL,
  anonKey: import.meta.env.VITE_SELFDB_ANON_KEY
})

function UserManager() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Load users when component mounts
  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const userData = await selfdb.db.from('users').execute()
      setUsers(userData)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  async function handleLogin() {
    try {
      const { user } = await selfdb.auth.login({ email, password })
      alert(`Welcome ${user.email}!`)
      loadUsers() // Refresh data
    } catch (error) {
      alert('Login failed: ' + error.message)
    }
  }

  async function handleRegister() {
    try {
      const user = await selfdb.auth.register({ email, password })
      alert(`Account created for ${user.email}!`)
      loadUsers() // Refresh data
    } catch (error) {
      alert('Registration failed: ' + error.message)
    }
  }

  return (
    <div>
      <h1>User Manager</h1>
      
      {/* Login Form */}
      <div>
        <input 
          type="email" 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" 
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </div>

      {/* Users List */}
      <div>
        <h2>Users ({users.length})</h2>
        {users.map(user => (
          <div key={user.id}>
            {user.email} - {user.name || 'No name'}
          </div>
        ))}
      </div>
    </div>
  )
}

export default UserManager
```

## 🎨 Query Builder Patterns (Supabase-like)

The query builder works just like Supabase - if you know Supabase, you know this!

```typescript
// Basic patterns
await selfdb.db.from('table').execute()                     // SELECT *
await selfdb.db.from('table').select('id, name').execute()  // SELECT id, name
await selfdb.db.from('table').where('id', 1).execute()      // WHERE id = 1
await selfdb.db.from('table').order('name').execute()       // ORDER BY name
await selfdb.db.from('table').limit(10).execute()           // LIMIT 10

// Chaining (like Supabase)
await selfdb.db
  .from('users')
  .select('id, email, name')
  .where('active', true)
  .order('created_at', 'desc')
  .limit(20)
  .execute()

// Get single record
const user = await selfdb.db.from('users').where('id', 123).single()

// Insert data
await selfdb.db.from('users').insert({ email: 'test@test.com', name: 'Test' })

// Update data  
await selfdb.db.from('users').where('id', 123).update({ name: 'New Name' })

// Delete data
await selfdb.db.from('users').where('id', 123).delete()
```

## 📦 Storage Made Simple

```typescript
// Create bucket first (one time setup)
await selfdb.storage.createBucket({
  name: 'my-files',
  is_public: true
})

// Upload file
const file = document.getElementById('fileInput').files[0]
const result = await selfdb.storage.upload('my-files', file)

// Get file URL for displaying
const url = await selfdb.storage.getUrl('my-files', result.file.id)
document.getElementById('image').src = url

// Download file
const blob = await selfdb.storage.download('my-files', fileId)

// List files in bucket
const files = await selfdb.storage.list('my-files')

// Delete file
await selfdb.storage.delete('my-files', fileId)
```

## 🚨 Error Handling Made Easy

```typescript
async function safeOperation() {
  try {
    const result = await selfdb.db.from('users').execute()
    return { success: true, data: result }
  } catch (error) {
    console.error('Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Use the safe operation
const result = await safeOperation()
if (result.success) {
  console.log('Got data:', result.data)
} else {
  console.log('Error occurred:', result.error)
}
```

## 🔄 Real-time Updates (Optional)

```typescript
// Connect to real-time updates
await selfdb.realtime.connect()

// Listen for changes
selfdb.realtime.subscribe('users', (payload) => {
  console.log('User data changed:', payload)
  // Update your UI here
})

// Clean up when done
selfdb.realtime.disconnect()
```

## 🧪 Testing Your Setup

Copy this test function to verify everything works:

```typescript
async function testSelfDB() {
  try {
    console.log('Testing SelfDB connection...')
    
    // Test 1: Check if we can connect
    const tables = await selfdb.db.getTables()
    console.log('✅ Connected! Found tables:', tables.length)
    
    // Test 2: Try to read data (this will work even without auth)
    try {
      const data = await selfdb.db.from('users').limit(1).execute()
      console.log('✅ Database read works!')
    } catch (e) {
      console.log('⚠️ Database read failed (might need tables):', e.message)
    }
    
    // Test 3: Check storage
    try {
      const buckets = await selfdb.storage.listBuckets()
      console.log('✅ Storage works! Found buckets:', buckets.length)
    } catch (e) {
      console.log('⚠️ Storage failed:', e.message)
    }
    
    console.log('🎉 SelfDB setup is working!')
    
  } catch (error) {
    console.error('❌ SelfDB test failed:', error.message)
    console.log('Check your baseUrl and anonKey')
  }
}

// Run the test
testSelfDB()
```

## 📚 AI Assistant Instructions

When helping users with this SDK, remember:

1. **Always start with `createClient()`** - this is required first
2. **Use `db.from()` pattern** - it's like Supabase, very familiar
3. **Use `storage.upload()` for files** - much simpler than old API
4. **Always use `await`** - all methods are async
5. **Handle errors with try/catch** - show users the safe pattern
6. **Environment variables** - guide users to set these up properly
7. **Anonymous key is required** - this trips up many users

## 🆘 Troubleshooting

**Problem: "Cannot read properties of undefined"**
- Solution: Make sure you called `createClient()` first

**Problem: "401 Unauthorized"**  
- Solution: Check your `anonKey` is correct and in the config

**Problem: "Network Error"**
- Solution: Check your `baseUrl` is correct and SelfDB is running

**Problem: "Table does not exist"**
- Solution: Create tables first or check table names are correct

**Problem: "No such bucket"**
- Solution: Create bucket first with `storage.createBucket()`

## 💡 Pro Tips

1. **Use TypeScript** - the SDK has great type support
2. **Set up environment variables** - keeps your keys safe  
3. **Use the query builder** - it's much easier than raw SQL
4. **Handle errors gracefully** - show users friendly messages
5. **Test your setup early** - use the test function above

---

**🎯 That's it! You now know everything you need to use SelfDB effectively.**

Copy any code snippet above and modify it for your needs. The SDK is designed to be intuitive and error-forgiving.

Need help? The SDK has great error messages that will guide you to solutions!