// Default mapping presets for different tracking modes

import type { MappingConfig } from '../types/mapping';

/** Default mappings for flight data sonification */
export function flightDronePreset(): MappingConfig[] {
  return [
    {
      id: 'altitude-to-pitch',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'altitude' },
      target: { parameter: 'pitch' },
      transform: {
        inputRange: [0, 13716],      // 0 to ~45000 feet in meters
        outputRange: [80, 800],       // Hz — low drone to mid register
        curve: 'log',
        smoothing: 0.85,
        clamp: true,
        invert: false,
        quantize: {
          scale: 'pentatonic_minor',
          rootNote: 60,               // C4
          octaveLow: 1,
          octaveHigh: 5,
        },
      },
    },
    {
      id: 'velocity-to-filter',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'velocity' },
      target: { parameter: 'filterFreq' },
      transform: {
        inputRange: [0, 280],         // 0 to ~544 knots in m/s
        outputRange: [200, 8000],     // Hz — closed to open filter
        curve: 'linear',
        smoothing: 0.8,
        clamp: true,
        invert: false,
      },
    },
    {
      id: 'heading-to-pan',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'heading' },
      target: { parameter: 'pan' },
      transform: {
        inputRange: [0, 360],
        outputRange: [-1, 1],         // full stereo spread
        curve: 'linear',
        smoothing: 0.7,
        clamp: true,
        invert: false,
      },
    },
    {
      id: 'verticalrate-to-filterq',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'verticalRate' },
      target: { parameter: 'filterQ' },
      transform: {
        inputRange: [-15, 15],        // m/s climb/descent rate
        outputRange: [0.5, 8],        // low Q to resonant
        curve: 'exp',
        smoothing: 0.6,
        clamp: true,
        invert: false,
      },
    },
  ];
}

/** Darker, more atmospheric preset */
export function flightAmbientPreset(): MappingConfig[] {
  return [
    {
      id: 'altitude-to-pitch',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'altitude' },
      target: { parameter: 'pitch' },
      transform: {
        inputRange: [0, 13716],
        outputRange: [40, 400],       // lower range — deeper drones
        curve: 'log',
        smoothing: 0.95,              // very slow glide
        clamp: true,
        invert: false,
        quantize: {
          scale: 'natural_minor',
          rootNote: 57,               // A3
          octaveLow: 0,
          octaveHigh: 4,
        },
      },
    },
    {
      id: 'velocity-to-filter',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'velocity' },
      target: { parameter: 'filterFreq' },
      transform: {
        inputRange: [0, 280],
        outputRange: [100, 3000],     // more muted
        curve: 'log',
        smoothing: 0.9,
        clamp: true,
        invert: false,
      },
    },
    {
      id: 'longitude-to-pan',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'longitude' },
      target: { parameter: 'pan' },
      transform: {
        inputRange: [-180, 180],
        outputRange: [-0.8, 0.8],
        curve: 'linear',
        smoothing: 0.9,
        clamp: true,
        invert: false,
      },
    },
    {
      id: 'verticalrate-to-amplitude',
      enabled: true,
      source: { dataSourceType: 'flight', field: 'verticalRate' },
      target: { parameter: 'amplitude' },
      transform: {
        inputRange: [-15, 15],
        outputRange: [0.3, 0.8],
        curve: 'linear',
        smoothing: 0.7,
        clamp: true,
        invert: false,
      },
    },
  ];
}
