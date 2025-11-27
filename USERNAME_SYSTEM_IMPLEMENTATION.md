# Username System Implementation for Collaboration Requests

## Overview
Implemented a unique username system (similar to Instagram's @handle) for collaboration requests. Each user must have a unique username, and collaboration requests must specify the receiver by their username.

## Backend Changes

### 1. User Model (`server/models/User.js`)
- **Added `username` field** with validation:
  - Required, unique, lowercase
  - Min length: 3 characters, Max length: 30 characters
  - Pattern: Only lowercase letters, numbers, underscores, and dots (`/^[a-z0-9_.]+$/`)
  - Indexed for fast lookups

- **Added static methods**:
  - `User.findByUsername(username)` - Find user by username
  - `User.usernameExists(username)` - Check if username exists

### 2. Authentication Controller (`server/controllers/authController.js`)
- **Updated `register`** function to require username
- **Added `checkUsername`** endpoint: `GET /api/auth/check-username/:username`
  - Returns whether username exists and is available
- **Added `getUserByUsername`** endpoint: `GET /api/auth/user/:username`
  - Returns user profile by username

### 3. Authentication Routes (`server/routes/authRoutes.js`)
- Added username validation to registration:
  - Must be 3-30 characters
  - Must match pattern: `/^[a-z0-9_.]+$/`
- Added routes for username checking and user lookup

### 4. Collaboration Controller (`server/controllers/collaborationController.js`)
- **Updated `sendCollaborationRequest`** function:
  - Now requires `receiverUsername` parameter (mandatory)
  - Validates username exists before creating request
  - Prevents sending request to yourself
  - Shows clear error message if username not found: `User with username '@username' not found`

## Frontend Changes

### 1. Send Collaboration Request Page (`client/src/pages/SendCollaborationRequest.js`)

**New State Variables:**
- `receiverUsername` - The username input value
- `usernameValidation` - Validation state object containing:
  - `checking` - Whether validation is in progress
  - `valid` - Whether username is valid and exists
  - `error` - Error message if validation failed
  - `user` - User object if found

**New Functions:**
- `validateUsername(username)` - Validates username via API call
  - Removes @ symbol if user includes it
  - Calls `/api/auth/user/:username` endpoint
  - Checks if user is trying to collaborate with themselves
  - Sets validation state

**Username Input Field:**
- Real-time validation with debounce (500ms delay)
- Visual feedback:
  - Green border + success message when valid
  - Red border + error message when invalid
  - Loading spinner while checking
- Shows user info when found (name and institution)
- Auto-adds @ symbol in the UI

**Form Validation:**
- Username must be at least 3 characters
- Username must exist in system
- User cannot send request to themselves

## Migration Script

Created `server/scripts/addUsernameToUsers.js` to add usernames to existing users:
- Generates usernames from email addresses (part before @)
- Ensures uniqueness by appending numbers if needed
- Successfully migrated all existing users

## API Endpoints

### New Endpoints:
1. **Check Username Availability**
   ```
   GET /api/auth/check-username/:username
   Response: { exists: boolean, available: boolean }
   ```

2. **Get User by Username**
   ```
   GET /api/auth/user/:username
   Response: { user: { _id, firstName, lastName, username, institution, ... } }
   ```

### Modified Endpoints:
1. **Send Collaboration Request**
   ```
   POST /api/collaborations
   Body: {
     receiverId: string (optional, for backwards compatibility),
     receiverUsername: string (REQUIRED),
     projectId: string,
     message: string,
     proposedRole: string
   }
   ```

2. **Register User**
   ```
   POST /api/auth/register
   Body: {
     ...existing fields,
     username: string (REQUIRED)
   }
   ```

## User Experience Flow

1. User navigates to Send Collaboration Request page
2. User selects their project
3. User enters collaborator's username (e.g., `john_doe` or `@john_doe`)
4. System validates username in real-time:
   - Shows loading spinner while checking
   - Displays success message with user details if found
   - Shows error message if not found or invalid
5. User fills in other details (role, message)
6. User submits form
7. Backend validates username again and creates collaboration request

## Validation Rules

### Username Format:
- ✅ Lowercase letters (a-z)
- ✅ Numbers (0-9)
- ✅ Underscores (_)
- ✅ Dots (.)
- ❌ Uppercase letters
- ❌ Special characters (@, #, -, etc.)
- ❌ Spaces

### Examples:
- Valid: `john_doe`, `alice123`, `bob.smith`, `researcher_1`
- Invalid: `John_Doe`, `alice@123`, `bob smith`, `user#1`

## Error Messages

- "Receiver username is required" - No username provided
- "User with username '@username' not found" - Username doesn't exist
- "Cannot send collaboration request to yourself" - Username is current user
- "Username already taken" - During registration
- "Username must be at least 3 characters" - Too short
- "Username can only contain lowercase letters, numbers, underscores and dots" - Invalid format

## Database Changes

### User Collection:
- Added `username` field (unique, indexed)
- All existing users migrated with usernames

### Collaboration Collection:
- No schema changes
- Request creation now validates username

## Testing Checklist

✅ Username validation works in real-time
✅ Error messages display correctly
✅ Success messages show user details
✅ Form submission validates username
✅ Backend rejects invalid usernames
✅ Backend rejects non-existent usernames
✅ Backend prevents self-collaboration
✅ Migration script added usernames to existing users
✅ Registration requires username
✅ Username uniqueness enforced

## Current Usernames (After Migration)

- @alice - alice@university.edu
- @emma - emma@university.edu
- @bob - bob@university.edu
- @vinod - vinod@gmail.com
- @sanjeev - sanjeev@gmail.com
- @sanjeev1 - sanjeev1@gmail.com

## Next Steps (Optional Enhancements)

1. Add username to user profile page for editing
2. Add @mention functionality in comments/messages
3. Add username search/autocomplete
4. Add username to collaboration display
5. Add username validation on profile update
6. Show username in user cards throughout the app
