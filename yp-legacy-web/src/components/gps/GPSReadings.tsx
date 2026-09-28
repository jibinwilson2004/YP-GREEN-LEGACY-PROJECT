import type { GeoReading } from '../../types/tree'
import { formatMeters } from '../../services/gps/gpsAccuracy'

export function GPSReadings({ readings }: { readings: GeoReading[] }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline-sm text-headline-sm text-primary">GPS Readings</h3>
        <span className="font-mono-metric text-label-sm text-on-surface-variant">{readings.length} samples</span>
      </div>
      <ul className="max-h-40 overflow-y-auto space-y-1.5">
        {readings.map((r, i) => (
          <li
            key={`${r.timestamp}-${i}`}
            className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-body-sm"
          >
            <span className="text-on-surface-variant">Reading {i + 1}</span>
            <span className="font-mono-metric text-primary">{formatMeters(r.accuracy)}</span>
          </li>
        ))}
        {readings.length === 0 && (
          <li className="text-body-sm text-outline py-4 text-center">Collecting readings…</li>
        )}
      </ul>
    </div>
  )
}
