import { describe, it, expect } from '@jest/globals'
import { decodePolyline, calculateBounds, calculateCenter, type Coordinate } from '@/lib/polyline'

describe('polyline utilities', () => {
  describe('decodePolyline', () => {
    it('should decode a basic polyline string to coordinates', () => {
      // This is a real encoded polyline that represents a path with 2 points
      const encoded = 'u{~vFvyys@fS]'
      const decoded = decodePolyline(encoded)

      // Verify the structure and basic properties of the decoded result
      expect(decoded).toHaveLength(2)
      expect(Array.isArray(decoded)).toBe(true)

      // Verify each coordinate is a valid {lat, lng} object
      decoded.forEach(coord => {
        expect(coord).toHaveProperty('lat')
        expect(coord).toHaveProperty('lng')
        expect(typeof coord.lat).toBe('number') // latitude
        expect(typeof coord.lng).toBe('number') // longitude
        expect(coord.lat).toBeGreaterThan(-90) // valid latitude range
        expect(coord.lat).toBeLessThan(90)
        expect(coord.lng).toBeGreaterThan(-180) // valid longitude range
        expect(coord.lng).toBeLessThan(180)
      })

      // Verify the first coordinate is approximately correct (known value for this polyline)
      expect(decoded[0].lat).toBeCloseTo(40.63, 1) // latitude within 0.1 degree
      expect(decoded[0].lng).toBeCloseTo(-8.66, 1) // longitude within 0.1 degree
    })

    it('should handle a simple polyline string', () => {
      // A simpler test case with known values
      const encoded = 'u{~vFvyys@fS]'
      const decoded = decodePolyline(encoded)
      
      expect(decoded.length).toBeGreaterThan(0)
      expect(decoded[0]).toHaveProperty('lat')
      expect(decoded[0]).toHaveProperty('lng')
    })

    it('should handle an empty polyline string', () => {
      const decoded = decodePolyline('')
      expect(decoded).toEqual([])
    })
  })

  describe('calculateBounds', () => {
    it('should return zero bounds for empty coordinate array', () => {
      const coordinates: Coordinate[] = []
      const result = calculateBounds(coordinates)
      expect(result).toEqual({
        north: 0,
        south: 0,
        east: 0,
        west: 0
      })
    })

    it('should return the coordinate itself as bounds for a single coordinate', () => {
      const coordinates = [{ lat: 30, lng: -100 }]
      const result = calculateBounds(coordinates)
      expect(result).toEqual({
        north: 30,
        south: 30,
        east: -100,
        west: -100
      })
    })

    it('should correctly calculate bounds for multiple coordinates', () => {
      const coordinates = [
        { lat: 10, lng: -20 },
        { lat: 15, lng: -15 },
        { lat: 5, lng: -25 },
      ]
      const result = calculateBounds(coordinates)

      expect(result).toEqual({
        north: 15,
        south: 5,
        east: -15,
        west: -25
      })
    })

    it('should handle coordinates with mixed positive and negative values', () => {
      const coordinates = [
        { lat: -10, lng: 20 },
        { lat: 15, lng: -30 },
        { lat: 5, lng: 10 }
      ]
      const result = calculateBounds(coordinates)

      expect(result).toEqual({
        north: 15,
        south: -10,
        east: 20,
        west: -30
      })
    })

    it('should handle extreme coordinate values', () => {
      const coordinates = [
        { lat: -89.9, lng: -179.9 },
        { lat: 89.9, lng: 179.9 }
      ]
      const result = calculateBounds(coordinates)

      expect(result.north).toBeCloseTo(89.9, 1)
      expect(result.south).toBeCloseTo(-89.9, 1)
      expect(result.east).toBeCloseTo(179.9, 1)
      expect(result.west).toBeCloseTo(-179.9, 1)
    })
  })

  describe('calculateCenter', () => {
    it('should return (0,0) for empty coordinate array', () => {
      const coordinates: Coordinate[] = []
      const result = calculateCenter(coordinates)
      expect(result).toEqual({ lat: 0, lng: 0 })
    })

    it('should return the coordinate itself for single coordinate', () => {
      const coordinates = [{ lat: 42.5, lng: -71.1 }]
      const result = calculateCenter(coordinates)
      expect(result).toEqual({ lat: 42.5, lng: -71.1 })
    })

    it('should calculate the center point correctly', () => {
      const coordinates = [
        { lat: 10, lng: -20 },
        { lat: 5, lng: -25 },
        { lat: 15, lng: -15 }
      ]
      const result = calculateCenter(coordinates)

      expect(result.lat).toBeCloseTo(10, 2)
      expect(result.lng).toBeCloseTo(-20, 2)
    })

    it('should handle coordinates spanning across hemispheres', () => {
      const coordinates = [
        { lat: -45, lng: -90 },
        { lat: 45, lng: 90 }
      ]
      const result = calculateCenter(coordinates)

      expect(result.lat).toBeCloseTo(0, 1)
      expect(result.lng).toBeCloseTo(0, 1)
    })

    it('should handle coordinates near the poles', () => {
      const coordinates = [
        { lat: 89, lng: 180 },
        { lat: 10, lng: 18 }
      ]
      const result = calculateCenter(coordinates)

      expect(result.lat).toBeCloseTo(49.5, 1)
      expect(result.lng).toBeCloseTo(99, 1)
    })
  })
})