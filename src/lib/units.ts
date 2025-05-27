/**
 * Unit Conversion Utilities
 *
 * This file contains utility functions for converting between metric and imperial units
 * for the fitness tracker application.
 *
 * For consistency with the ADR: imperial-units-support.md decision, all display values use imperial
 * units while data storage uses metric units.
 */

// Conversion factors
export const CONVERSION_FACTORS = {
  // Distance
  METERS_TO_MILES: 1 / 1609.344,
  MILES_TO_METERS: 1609.344,
  METERS_TO_FEET: 3.28084,
  FEET_TO_METERS: 1 / 3.28084,
  KILOMETERS_TO_MILES: 0.621371,
  MILES_TO_KILOMETERS: 1.60934,

  // Weight
  KG_TO_LBS: 2.20462,
  LBS_TO_KG: 0.453592,
}

/**
 * Converts meters to miles
 * @param meters Distance in meters
 * @returns Distance in miles
 */
export function metersToMiles(meters: number): number {
  return meters * CONVERSION_FACTORS.METERS_TO_MILES
}

/**
 * Converts miles to meters
 * @param miles Distance in miles
 * @returns Distance in meters
 */
export function milesToMeters(miles: number): number {
  return miles * CONVERSION_FACTORS.MILES_TO_METERS
}

/**
 * Converts kilometers to miles
 * @param kilometers Distance in kilometers
 * @returns Distance in miles
 */
export function kilometersToMiles(kilometers: number): number {
  return kilometers * CONVERSION_FACTORS.KILOMETERS_TO_MILES
}

/**
 * Converts miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export function milesToKilometers(miles: number): number {
  return miles * CONVERSION_FACTORS.MILES_TO_KILOMETERS
}

/**
 * Converts meters to feet
 * @param meters Distance in meters
 * @returns Distance in feet
 */
export function metersToFeet(meters: number): number {
  return meters * CONVERSION_FACTORS.METERS_TO_FEET
}

/**
 * Converts kilograms to pounds
 * @param kg Weight in kilograms
 * @returns Weight in pounds
 */
export function kgToLbs(kg: number): number {
  return kg * CONVERSION_FACTORS.KG_TO_LBS
}

/**
 * Converts pounds to kilograms
 * @param lbs Weight in pounds
 * @returns Weight in kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs * CONVERSION_FACTORS.LBS_TO_KG
}

/**
 * Formats a distance value in meters to a string with miles and the appropriate unit
 * @param meters Distance in meters
 * @param decimals Number of decimal places to display (default: 2)
 * @returns Formatted string with distance in miles (e.g., "3.14 mi")
 */
export function formatDistanceMiles(meters: number, decimals: number = 2): string {
  const miles = metersToMiles(meters)
  return `${miles.toFixed(decimals)} mi`
}

/**
 * Formats elevation in meters to feet with appropriate unit
 * @param meters Elevation in meters
 * @returns Formatted string with elevation in feet (e.g., "150 ft")
 */
export function formatElevation(meters: number): string {
  const feet = metersToFeet(meters)
  return `${Math.round(feet)} ft`
}

/**
 * Calculates and formats pace (minutes per mile) from distance in meters and time in seconds
 * @param meters Distance in meters
 * @param seconds Duration in seconds
 * @returns Formatted pace string (e.g., "8:30 /mi")
 */
export function calculatePace(meters: number, seconds: number): string {
  if (meters === 0) return '-'

  const miles = metersToMiles(meters)
  const pacePerMile = seconds / 60 / miles
  const paceMinutes = Math.floor(pacePerMile)
  const paceSeconds = Math.floor((pacePerMile - paceMinutes) * 60)

  return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} /mi`
}
