# ADR: Imperial Units for Run Metrics

## Status

Accepted

## Date

2025-04-05

## Context

The application includes Strava integration for tracking running activities, which by default uses the metric system (kilometers, meters) for distance measurements. However, many users in the United States and other regions prefer to view and record their running metrics in imperial units (miles, feet). 

Strava API returns all distances in meters and elevations in meters, regardless of the user's preferences. While Strava's user interface handles unit conversion based on account settings, our application needed to make an explicit decision about which unit system to use for displaying and inputting run data.

## Decision

We have decided to standardize on imperial units (miles, feet) for all run-related metrics in the application interface:

1. Display all run distances in miles instead of kilometers
2. Show pace in minutes per mile instead of minutes per kilometer
3. Display elevation gain in feet instead of meters
4. Allow users to input run distances in miles when manually logging activities

We will automatically handle the conversion between the metrics used by Strava's API (meters) and our display units (miles, feet).

## Consequences

### Positive

- Better alignment with user expectations in regions where imperial units are standard for running (US, UK)
- Consistent user experience across the application
- No need for user preferences or settings to toggle between metric and imperial units, simplifying the UI

### Negative

- Potential confusion for users in regions where metric units are standard
- Additional conversion logic required in the codebase
- Fixed choice rather than respecting user preferences

### Technical Implementation

1. Central Units Utility:
   - Created `src/lib/units.ts` with standardized conversion functions
   - All unit conversions are centralized to ensure consistency and maintainability
   - Added utility functions for displaying distances, elevation, and pace calculations

2. RunList component: 
   - Updated to use centralized unit conversion functions
   - Displays distances in miles, pace in min/mile, elevation in feet

3. ManualRunLogger component: 
   - Updated to use centralized unit conversion functions
   - Input labels indicate miles
   - User inputs are converted to metric before sending to Strava API

4. README documentation: 
   - Updated to reflect imperial unit support

### Future Considerations

In the future, we may consider:
1. Adding user preferences to toggle between metric and imperial units
2. Detecting user region automatically to default to the appropriate unit system
3. Respecting the unit preferences from the user's Strava account

## References

- [Strava API Documentation](https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities)
- [Unit Conversion Factors](https://en.wikipedia.org/wiki/Conversion_of_units)
  - 1 mile = 1609.344 meters
  - 1 foot = 0.3048 meters 