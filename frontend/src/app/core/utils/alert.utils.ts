/**
 * Utility functions for alert-related operations
 */

import { ALERT_SEVERITY, ALERT_STATUS } from './constants';

type AlertSeverityType = typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];
type SeveritySeverity = 'success' | 'info' | 'warn' | 'error';

/**
 * Maps alert severity to PrimeNG severity
 */
export function getAlertSeveritySeverity(severity: string): SeveritySeverity {
  const severityMap: Record<AlertSeverityType, SeveritySeverity> = {
    [ALERT_SEVERITY.LOW]: 'info',
    [ALERT_SEVERITY.MEDIUM]: 'warn',
    [ALERT_SEVERITY.HIGH]: 'error',
    [ALERT_SEVERITY.CRITICAL]: 'error'
  };
  return severityMap[severity as AlertSeverityType] || 'info';
}

/**
 * Maps alert severity to human-readable label
 */
export function getAlertSeverityLabel(severity: string): string {
  const labelMap: Record<AlertSeverityType, string> = {
    [ALERT_SEVERITY.LOW]: 'Baixa',
    [ALERT_SEVERITY.MEDIUM]: 'Média',
    [ALERT_SEVERITY.HIGH]: 'Alta',
    [ALERT_SEVERITY.CRITICAL]: 'Crítica'
  };
  return labelMap[severity as AlertSeverityType] || severity;
}

/**
 * Gets icon for alert severity
 */
export function getAlertSeverityIcon(severity: string): string {
  const iconMap: Record<AlertSeverityType, string> = {
    [ALERT_SEVERITY.LOW]: 'pi-info-circle',
    [ALERT_SEVERITY.MEDIUM]: 'pi-exclamation-triangle',
    [ALERT_SEVERITY.HIGH]: 'pi-exclamation-circle',
    [ALERT_SEVERITY.CRITICAL]: 'pi-times-circle'
  };
  return iconMap[severity as AlertSeverityType] || 'pi-info-circle';
}

