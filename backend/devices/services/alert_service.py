"""
Alert service providing threshold checking for measurements.

This module is intentionally free of framework/UI concerns and focuses on
domain logic only, following Django best practices.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Tuple, Optional

from django.utils.translation import gettext_lazy as _

from devices.models import Measurement, MeasurementThreshold


def check_for_alert(measurement: Measurement) -> Tuple[bool, Optional[str]]:
    """
    Check whether a measurement violates an active threshold.

    Args:
        measurement: Persisted Measurement instance to evaluate.

    Returns:
        (violated, message):
            - violated: True if value is out of allowed range, False otherwise.
            - message: Localized human-readable message when violated; None otherwise.
    """
    # Find an active threshold for the device and metric (case-insensitive)
    threshold: Optional[MeasurementThreshold] = (
        MeasurementThreshold.objects
        .filter(
            device=measurement.device,
            metric_name__iexact=measurement.metric,
            is_active=True,
        )
        .order_by('-updated_at')
        .first()
    )

    if threshold is None:
        return False, None

    value: Decimal = Decimal(measurement.value)
    min_limit: Decimal = Decimal(threshold.min_limit)
    max_limit: Decimal = Decimal(threshold.max_limit)

    if value < min_limit:
        message = _(
            "{metric} below minimum: {value}{unit} < {min_limit}{unit}"
        ).format(
            metric=measurement.metric,
            value=str(value),
            unit=measurement.unit,
            min_limit=str(min_limit),
        )
        return True, message

    if value > max_limit:
        message = _(
            "{metric} above maximum: {value}{unit} > {max_limit}{unit}"
        ).format(
            metric=measurement.metric,
            value=str(value),
            unit=measurement.unit,
            max_limit=str(max_limit),
        )
        return True, message

    return False, None


