# Authentication Troubleshooting Guide

This guide provides solutions for common authentication issues in the FitnessTracker application.

## Common Issues and Solutions

### 1. "Failed to persist your session" Error or "Authentication failed" Error

**Symptoms:** 
- When trying to log in, you see the error: "Failed to persist your session. Please clear cookies and try again."
- Or you might see: "Authentication failed. Please try again."

**Causes:**
- Cookies are blocked or limited in your browser
- Previous corrupted cookies are interfering with authentication
- Third-party cookie restrictions in your browser
- Privacy features blocking storage access
- Browser storage (localStorage) limitations or permissions

**Solutions:**

1. **Clear ALL Browser Data for the Site**
   - Go to your browser settings → Privacy & Security → Site Settings
   - Find the site in your list of permissions
   - Click "Clear data" or equivalent for that site
   - Ensure you clear both cookies AND local storage
   - Restart the browser completely

2. **Try Incognito/Private Mode**
   - Open a new private/incognito window
   - Try logging in there, where cookies and storage are fresh

3. **Check Browser Privacy Settings**
   - Ensure "Prevent cross-site tracking" is disabled temporarily
   - Allow cookies and JavaScript for the site
   - Disable any content/ad blockers for the site

4. **Ensure Local Storage is Enabled**
   - Some browsers allow you to disable localStorage
   - Check that it's enabled in your browser settings

5. **Use a Different Browser**
   - If all else fails, try a modern browser like Chrome, Firefox or Edge

### 2. Unable to Access Protected Routes

**Symptom:** You're repeatedly redirected to the login page even though you've signed in.

**Solutions:**

1. **Verify Your Session**
   - Access `/api/test-auth` endpoint to check your authentication status
   - If it returns authenticated: false, your session isn't being recognized

2. **Check For Cookies**
   - In browser Developer Tools, look for cookies prefixed with `sb-`
   - These are Supabase authentication cookies and should be present

3. **Force Re-authentication**
   - Use `/login?bypass=true` to force a logout
   - Sign in again with your credentials

### 3. Middleware Authentication Issues

**Symptom:** You see authentication errors in the server console, but your credentials are correct.

**Solutions:**

1. **Restart the Development Server**
   - Sometimes the development server can cache authentication states
   - Stop and restart the server with `npm run dev`

2. **Check Environment Variables**
   - Ensure Supabase URL and anon key are correctly set in `.env.local`

3. **Clear All Application Storage**
   - In browser Developer Tools, go to Application → Storage
   - Clear cookies, local storage, and session storage

### 4. Profile Creation Errors - Row-Level Security (RLS) Policy Violations

**Symptom:** Login works, but you see console errors with the message "new row violates row-level security policy for table \"profiles\"".

**Cause:**
Supabase uses PostgreSQL Row-Level Security (RLS) policies to control access to tables. By default, tables with RLS enabled block all operations unless specific policies grant permission.

**Solutions:**

1. **Configure RLS Policies in Supabase Dashboard**

   To allow users to create and manage their own profiles:
   
   a. Login to your [Supabase Dashboard](https://app.supabase.io/)
   
   b. Select your project
   
   c. Go to SQL Editor → New Query, and run the following SQL for authenticated users to manage their own profiles:

   ```sql
   -- Allow users to insert their own profile with matching user ID
   CREATE POLICY "Users can create their own profile" ON profiles
   FOR INSERT WITH CHECK (auth.uid() = id);
   
   -- Allow users to update their own profile
   CREATE POLICY "Users can update their own profile" ON profiles
   FOR UPDATE USING (auth.uid() = id);
   
   -- Allow users to read their own profile
   CREATE POLICY "Users can read their own profile" ON profiles
   FOR SELECT USING (auth.uid() = id);
   ```

2. **Enable Row-Level Security and Verify Policies**
   
   a. In Supabase Dashboard, go to Database → Tables → profiles
   
   b. Ensure "Enable Row Level Security (RLS)" is turned ON
   
   c. Go to "Policies" tab to verify your policies are in place
   
   d. Test the policies by signing in and checking if profile creation works

3. **Using the Server-Side Profile Creation API**

   This application includes a server-side API endpoint that can create profiles even when RLS policies are restrictive:
   
   a. Get your Supabase service role key from the Supabase Dashboard:
      - Go to Project Settings → API → service_role key
   
   b. Update your `.env.local` file with the service role key:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   
   c. Restart your development server for the changes to take effect
   
   d. The login process will automatically try to use this API when direct profile creation fails

   > **SECURITY WARNING**: Never expose your service role key to the client or commit it to public repositories!

4. **Using Service Role for Critical Operations (Server-side only)**

   For admin operations or initial setup, you can use a server-side API route with the Supabase service role client:
   
   ```typescript
   // IMPORTANT: Only use this approach in secure server environments, never in client-side code
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   )
   
   // The service role bypasses RLS, so use carefully
   const { data, error } = await supabaseAdmin
     .from('profiles')
     .upsert({ id: userId, ... })
   ```

## Advanced Troubleshooting

If you continue to experience issues:

1. **Enable Debug Logging**
   - Set `debug: true` in the Supabase client configuration

2. **Check for CORS Issues**
   - Look for CORS errors in the console that might indicate API access problems

3. **Verify Supabase Project Settings**
   - Ensure your Supabase project has proper URL configuration
   - Check that your site URL is on the allowed list

4. **Last Resort: Reset Authentication**
   - Access `/login?bypass=true` to get to the login page
   - Use the "Sign Out & Use Different Account" option
   - Clear browser cache and cookies
   - Restart the browser
   - Try logging in again

## Still Having Issues?

If none of these solutions work, it might indicate a deeper issue with:
- Supabase configuration
- Network connectivity
- Browser compatibility

Please file an issue with detailed steps to reproduce, browser information, and any console errors.

## Manual Testing Process

To verify that the authentication flow is working correctly after applying fixes, follow these steps:

### Testing the Login Flow

1. **Access the Login Page**
   - Navigate to `http://localhost:3002/login` in your browser
   - If you're already logged in, you'll be redirected to the dashboard
   - To force access to the login page when already authenticated, use `http://localhost:3002/login?bypass=true`

2. **Sign Out (if needed)**
   - If you're already logged in, use the "Sign Out" button in the dashboard
   - Or click "Sign Out & Use Different Account" if that option is available on the login page

3. **Enter Valid Credentials**
   - Use a valid email and password
   - If you don't have an account, use the "Create an account" option

4. **Observe the Login Process**
   - Watch for any error messages during the login process
   - The application should redirect you to the dashboard upon successful authentication

5. **Check the Network Tab (Advanced)**
   - Open Developer Tools (F12 or Right-click → Inspect)
   - Go to the Network tab
   - Filter for "XHR" or "Fetch" requests
   - Look for requests to Supabase endpoints
   - Check for any failed requests related to authentication or profile creation

6. **Verify Profile Creation**
   - If you're testing the RLS fixes for profile creation
   - After successful login, check if your profile data appears in the dashboard
   - If profile data is missing, check the console for errors related to the profiles table

7. **Test with Various Browsers**
   - Chrome, Firefox, Safari, and Edge may handle cookies and authentication differently
   - If an issue appears in one browser but not others, it may indicate a browser-specific compatibility issue

This manual testing process helps identify where exactly in the authentication flow any issues might be occurring. 