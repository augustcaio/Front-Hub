/**
 * Utility functions for device-related operations
 */

import { Device } from '../services/device.service';
import { DEVICE_STATUS } from './constants';

type StatusSeverity = 'success' | 'danger' | 'warning' | 'info';
type DeviceStatus = typeof DEVICE_STATUS[keyof typeof DEVICE_STATUS];

/**
 * Maps device status to PrimeNG severity
 */
export function getDeviceStatusSeverity(status: string): StatusSeverity {
  const severityMap: Record<DeviceStatus, StatusSeverity> = {
    [DEVICE_STATUS.ACTIVE]: 'success',
    [DEVICE_STATUS.INACTIVE]: 'info',
    [DEVICE_STATUS.MAINTENANCE]: 'warning',
    [DEVICE_STATUS.ERROR]: 'danger'
  };
  return severityMap[status as DeviceStatus] || 'info';
}

/**
 * Maps device status to human-readable label
 */
export function getDeviceStatusLabel(status: string): string {
  const labelMap: Record<DeviceStatus, string> = {
    [DEVICE_STATUS.ACTIVE]: 'Ativo',
    [DEVICE_STATUS.INACTIVE]: 'Inativo',
    [DEVICE_STATUS.MAINTENANCE]: 'Manutenção',
    [DEVICE_STATUS.ERROR]: 'Erro'
  };
  return labelMap[status as DeviceStatus] || status;
}

/**
 * Counts devices by status
 */
export interface DeviceStatusCount {
  active: number;
  inactive: number;
  maintenance: number;
  error: number;
  total: number;
}

export function countDevicesByStatus(devices: Device[]): DeviceStatusCount {
  const counts: DeviceStatusCount = {
    active: 0,
    inactive: 0,
    maintenance: 0,
    error: 0,
    total: devices.length
  };

  devices.forEach((device) => {
    const status = device.status;
    if (status === DEVICE_STATUS.ACTIVE || 
        status === DEVICE_STATUS.INACTIVE || 
        status === DEVICE_STATUS.MAINTENANCE || 
        status === DEVICE_STATUS.ERROR) {
      counts[status]++;
    }
  });

  return counts;
}

