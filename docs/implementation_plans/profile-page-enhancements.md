# Profile Page Enhancements Implementation Plan

## Overview
Enhance the `/profile` page with profile picture upload, editable profile fields, and remove hardcoded text.

## Features to Implement

### 1. Profile Picture Upload Integration
- **Location**: `SocialProfileHeader.tsx`
- **Changes**: Integrate existing `ProfilePictureUpload` component
- **Requirements**: 
  - Add edit overlay on hover
  - Maintain current design aesthetic
  - Update profile picture URL in real-time

### 2. Editable Profile Fields
- **Location**: `AgeStatsCard.tsx`
- **Fields**: Age, Height, Weight
- **Requirements**:
  - Inline editing with save/cancel functionality
  - Respect weight unit preferences (kg/lbs)
  - Height display in feet/inches for imperial, cm for metric
  - Proper validation (age 13-120, realistic height/weight ranges)

### 3. Remove Hardcoded Text
- **ExperienceCard.tsx**: Remove "5+ Years" for Advanced level
- **AgeStatsCard.tsx**: Remove "Prime Age" badge completely

### 4. Server Actions
- **New File**: Extend `profileActions.ts`
- **Functions**:
  - `updateProfileBasicInfo(age, height_cm, weight_kg)`
  - `updateProfilePicture(picture_url)`

## Implementation Steps

1. Create server actions for profile updates
2. Update ExperienceCard to remove hardcoded text
3. Update AgeStatsCard to remove "Prime Age" and add editing
4. Modify SocialProfileHeader to include profile picture editing
5. Test all functionality and error handling

## Database Schema
- Uses existing `profiles` table
- Fields: `age`, `height_cm`, `weight_kg`, `profile_picture_url`
- No migrations needed

## Confidence Score: 95% 