/**
 * Unit Tests for Polyline Utilities
 * ------------------------------------------------
 * Tests for polyline decoding, bounds calculation, and center calculation functions
 */

import { decodePolyline, calculateBounds, calculateCenter } from '@/lib/polyline'

describe('decodePolyline', () => {
  it('should return an empty array for an empty string', () => {
    const result = decodePolyline('')
    expect(result).toEqual([])
  })

  it('should correctly decode a valid polyline string', () => {
    // Test polyline string that should decode to specific coordinates
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`'
    const decoded = decodePolyline(encoded)

    // Verify the structure and basic properties of the decoded result
    expect(decoded).toHaveLength(3)
    expect(Array.isArray(decoded)).toBe(true)

    // Verify each coordinate is a valid [lat, lng] pair
    decoded.forEach(coord => {
      expect(coord).toHaveLength(2)
      expect(typeof coord[0]).toBe('number') // latitude
      expect(typeof coord[1]).toBe('number') // longitude
      expect(coord[0]).toBeGreaterThan(-90) // valid latitude range
      expect(coord[0]).toBeLessThan(90)
      expect(coord[1]).toBeGreaterThan(-180) // valid longitude range
      expect(coord[1]).toBeLessThan(180)
    })

    // Verify the first coordinate is approximately correct (known value for this polyline)
    expect(decoded[0][0]).toBeCloseTo(38.5, 0) // latitude within 1 degree
    expect(decoded[0][1]).toBeCloseTo(-120.2, 0) // longitude within 1 degree
  })

  it('should handle a simple polyline string', () => {
    // A simpler test case with known values
    const encoded = 'u{~vFvyys@fS]'
    const decoded = decodePolyline(encoded)

    expect(decoded.length).toBeGreaterThan(0)
    expect(Array.isArray(decoded)).toBe(true)
    expect(decoded[0]).toHaveLength(2) // Each coordinate should be [lat, lng]
  })
})

describe('calculateBounds', () => {
  it('should return zero bounds for an empty array', () => {
    const result = calculateBounds([])
    expect(result).toEqual([
      [0, 0],
      [0, 0],
    ])
  })

  it('should return the coordinate itself as bounds for a single coordinate array', () => {
    const coordinates: [number, number][] = [[30, -100]]
    const result = calculateBounds(coordinates)
    expect(result).toEqual([
      [30, -100],
      [30, -100],
    ])
  })

  it('should correctly calculate bounds for multiple coordinates', () => {
    const coordinates: [number, number][] = [
      [10, -20],
      [15, -15],
      [5, -25],
    ]
    const result = calculateBounds(coordinates)

    // Expected: [[south, west], [north, east]] = [[min_lat, min_lng], [max_lat, max_lng]]
    expect(result).toEqual([
      [5, -25],
      [15, -15],
    ])
  })

  it('should handle coordinates with mixed positive and negative values', () => {
    const coordinates: [number, number][] = [
      [-10, 20],
      [15, -30],
      [0, 0],
    ]
    const result = calculateBounds(coordinates)

    expect(result).toEqual([
      [-10, -30],
      [15, 20],
    ])
  })

  it('should handle coordinates with decimal values', () => {
    const coordinates: [number, number][] = [
      [10.5, -20.3],
      [15.7, -15.1],
      [5.2, -25.8],
    ]
    const result = calculateBounds(coordinates)

    expect(result[0][0]).toBeCloseTo(5.2, 1) // min lat
    expect(result[0][1]).toBeCloseTo(-25.8, 1) // min lng
    expect(result[1][0]).toBeCloseTo(15.7, 1) // max lat
    expect(result[1][1]).toBeCloseTo(-15.1, 1) // max lng
  })
})

describe('calculateCenter', () => {
  it('should return [0,0] for an empty array', () => {
    const result = calculateCenter([])
    expect(result).toEqual([0, 0])
  })

  it('should return the coordinate itself for a single coordinate array', () => {
    const coordinates: [number, number][] = [[30, -100]]
    const result = calculateCenter(coordinates)
    expect(result).toEqual([30, -100])
  })

  it('should correctly calculate the center for multiple coordinates', () => {
    const coordinates: [number, number][] = [
      [10, -10],
      [20, -20],
    ]
    const result = calculateCenter(coordinates)
    expect(result).toEqual([15, -15])
  })

  it('should calculate center for coordinates with decimal values', () => {
    const coordinates: [number, number][] = [
      [10.5, -20.5],
      [15.5, -15.5],
      [5.0, -25.0],
    ]
    const result = calculateCenter(coordinates)

    // Expected center: [(10.5 + 15.5 + 5.0) / 3, (-20.5 + -15.5 + -25.0) / 3]
    // = [31.0 / 3, -61.0 / 3] = [10.333..., -20.333...]
    expect(result[0]).toBeCloseTo(10.333, 2)
    expect(result[1]).toBeCloseTo(-20.333, 2)
  })

  it('should handle mixed positive and negative coordinates', () => {
    const coordinates: [number, number][] = [
      [-10, 20],
      [10, -20],
      [0, 0],
    ]
    const result = calculateCenter(coordinates)

    // Expected center: [(-10 + 10 + 0) / 3, (20 + -20 + 0) / 3] = [0, 0]
    expect(result).toEqual([0, 0])
  })

  it('should handle a large number of coordinates', () => {
    const coordinates: [number, number][] = []
    for (let i = 0; i < 100; i++) {
      coordinates.push([i, i * 2])
    }

    const result = calculateCenter(coordinates)

    // Expected center for 0-99: [49.5, 99]
    expect(result[0]).toBeCloseTo(49.5, 1)
    expect(result[1]).toBeCloseTo(99, 1)
  })
})
