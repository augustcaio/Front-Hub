/**
 * Application constants
 */

export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  WS_URL: 'ws://localhost:8000',
  TOKEN_ENDPOINT: '/token/',
  TOKEN_VERIFY_ENDPOINT: '/token/verify/',
  TOKEN_REFRESH_ENDPOINT: '/token/refresh/',
  DEVICES_ENDPOINT: '/devices/',
  ALERTS_ENDPOINT: '/alerts'
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token'
} as const;

export const DEVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  ERROR: 'error'
} as const;

export type DeviceStatus = typeof DEVICE_STATUS[keyof typeof DEVICE_STATUS];

export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type AlertSeverity = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];

export const ALERT_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved'
} as const;

export type AlertStatus = typeof ALERT_STATUS[keyof typeof ALERT_STATUS];

export const WS_CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
} as const;

export type WsConnectionStatus = typeof WS_CONNECTION_STATUS[keyof typeof WS_CONNECTION_STATUS];

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const WS_CLOSE_CODE = {
  NORMAL: 1000
} as const;

export const CHART_CONFIG = {
  MAX_DATA_POINTS: 100,
  RECENT_MEASUREMENTS_LIMIT: 10,
  COLORS: {
    PRIMARY: '#3B82F6',
    PRIMARY_ALPHA: 'rgba(59, 130, 246, 0.1)'
  }
} as const;

