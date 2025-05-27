# ADR: Profile Picture Upload

## Status

Accepted

## Date

2025-04-05

## Context

The application allows users to create profiles but lacks the ability for users to personalize their profiles with custom profile pictures. Currently, the application uses a generated initials-based avatar with random background colors for user identification.

Adding profile picture functionality would enhance the user experience by:

1. Allowing users to personalize their profiles
2. Improving user recognition across the application
3. Making the application feel more complete and modern

To implement this feature, we need to consider:

- Where and how to store the images
- How to handle upload and retrieval efficiently
- How to secure the images so that users can only access their own uploads
- How to handle image validation and processing
- Fallback mechanisms when images fail to load

## Decision

We have decided to implement profile picture functionality using Supabase Storage with the following approach:

1. **Storage Solution**: Use Supabase Storage to store user profile pictures

   - Create a dedicated `profile_pictures` bucket
   - Organize files in user-specific folders based on user IDs
   - Make the bucket public for easy access but with Row Level Security (RLS) policies

2. **Data Model Changes**:

   - Add a `profile_picture_url` column to the `profiles` table to store the public URL of the uploaded image
   - Implement RLS policies to ensure users can only update their own profile picture URL

3. **Upload Process**:

   - Create a dedicated `ProfilePictureUpload` component that handles file selection, validation, and upload
   - Support common image formats (JPEG, PNG, GIF, WebP)
   - Implement size validation (max 2MB)
   - Generate unique filenames based on user ID and timestamp

4. **User Interface**:

   - Provide an intuitive upload interface on the profile page
   - Show a preview of the selected image before confirmation
   - Display visual feedback during the upload process
   - Show appropriate error messages for validation failures

5. **Fallback Mechanism**:
   - Enhance the `UserAvatar` component to display profile pictures when available
   - Fall back to the existing initials-based avatar when no profile picture exists or if loading fails
   - Handle image loading errors gracefully

## Consequences

### Positive

- Enhanced user experience with personalized profiles
- Consistent avatar display throughout the application
- Modern feel with personalized user interfaces
- Secure storage with appropriate access controls
- Graceful degradation when images are unavailable

### Negative

- Additional storage requirements and potential costs
- Added complexity in the UI components
- Need for additional error handling
- Potential performance impact if images are large

### Technical Implementation

1. **Database Migration**:

   - Added `profile_picture_url` column to the `profiles` table
   - Created appropriate RLS policies

2. **Storage Configuration**:

   - Created `profile_pictures` bucket in Supabase Storage
   - Configured public access with RLS policies to restrict uploads to authenticated users
   - Implemented folder-based security using user IDs

3. **Component Implementation**:

   - Created `ProfilePictureUpload` component for handling uploads
   - Enhanced `UserAvatar` component to support both image and initials display
   - Updated profile page to include the image upload functionality
   - Added the profile picture display to the dashboard

4. **Documentation**:
   - Updated README with information about the new feature
   - Created SQL migration scripts for future deployments

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Image Upload Best Practices](https://web.dev/articles/image-optimization-basics)
- [RLS Policies for Storage](https://supabase.com/docs/guides/storage/security)
