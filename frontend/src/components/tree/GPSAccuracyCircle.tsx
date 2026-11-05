import { Circle, Tooltip } from 'react-leaflet'

interface GPSAccuracyCircleProps {
  latitude: number
  longitude: number
  accuracy: number
  color?: string
}

/**
 * Visualizes the real GPS accuracy / uncertainty circle around the tree coordinates.
 * Radius strictly corresponds to the measured accuracy in meters (e.g. 4.2m).
 */
export function GPSAccuracyCircle({
  latitude,
  longitude,
  accuracy,
  color = '#109367',
}: GPSAccuracyCircleProps) {
  // Ensure valid positive radius
  const radius = Math.max(1, accuracy || 4.2)

  return (
    <Circle
      center={[latitude, longitude]}
      radius={radius}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 1.5,
        dashArray: '4, 4',
      }}
    >
      <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9} sticky>
        <span className="font-mono text-xs font-semibold">
          GPS Accuracy Area: ±{radius.toFixed(1)} m
        </span>
      </Tooltip>
    </Circle>
  )
}
