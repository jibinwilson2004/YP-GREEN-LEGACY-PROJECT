import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Tree } from '../../types/tree'
import { fetchTreesInViewport } from '../../services/api'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom SVG Leaflet icon for trees
const createTreeIcon = (color = '#109367') =>
  L.divIcon({
    className: 'custom-tree-pin',
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;">
        <svg style="width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24"><path d="M12 2L6 11h3l-3 6h4v4h4v-4h4l-3-6h3L12 2z"/></svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })

function MapController({ selectedTree }: { selectedTree: Tree | null }) {
  const map = useMap()
  useEffect(() => {
    if (selectedTree) {
      map.flyTo([selectedTree.latitude, selectedTree.longitude], 14, { duration: 1.2 })
    }
  }, [selectedTree, map])
  return null
}

function ClusterLayer({
  trees,
  onSelect,
}: {
  trees: Tree[]
  onSelect: (t: Tree) => void
}) {
  const map = useMap()
  const groupRef = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    if (groupRef.current) {
      map.removeLayer(groupRef.current)
      groupRef.current.clearLayers()
    }

    const group = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 16,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        return L.divIcon({
          html: `<div style="background: #0f382c; color: #a2f0cc; font-weight: bold; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 2px solid #a2f0cc; box-shadow: 0 4px 12px rgba(15,56,44,0.4); font-size: 13px;">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40],
        })
      },
    })

    trees.forEach((tree) => {
      const marker = L.marker([tree.latitude, tree.longitude], {
        icon: createTreeIcon(tree.verificationStatus === 'VERIFIED' ? '#109367' : '#2f7c5f'),
      })
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-size: 11px; font-weight: 600; color: #109367; text-transform: uppercase;">${tree.verificationStatus}</div>
          <div style="font-size: 14px; font-weight: bold; color: #002218; margin-top: 2px;">${tree.species}</div>
          <div style="font-size: 11px; color: #666; font-family: monospace;">#${tree.id}</div>
          <div style="font-size: 11px; color: #444; margin-top: 4px;">Acc: ${tree.accuracy}m · Conf: ${tree.locationConfidence}%</div>
        </div>
      `)
      marker.on('click', () => onSelect(tree))
      group.addLayer(marker)
    })

    map.addLayer(group)
    groupRef.current = group

    return () => {
      if (groupRef.current) {
        map.removeLayer(groupRef.current)
        groupRef.current.clearLayers()
      }
    }
  }, [map, trees, onSelect])

  return null
}

function ViewportLoader({
  onTrees,
  search,
}: {
  onTrees: (trees: Tree[]) => void
  search: string
}) {
  const map = useMapEvents({
    moveend: () => load(),
    zoomend: () => load(),
  })

  const load = useCallback(() => {
    const b = map.getBounds()
    const zoom = map.getZoom()
    void fetchTreesInViewport({
      minLat: b.getSouth(),
      maxLat: b.getNorth(),
      minLng: b.getWest(),
      maxLng: b.getEast(),
      zoom,
      search,
    }).then(onTrees)
  }, [map, search, onTrees])

  useEffect(() => {
    load()
    const handleUpdate = () => load()
    window.addEventListener('trees-updated', handleUpdate)
    return () => window.removeEventListener('trees-updated', handleUpdate)
  }, [load])

  return null
}

export function TreeMap({
  search,
  selectedTree,
  onSelectTree,
  viewMode = 'clusters',
  className,
}: {
  search: string
  selectedTree?: Tree | null
  onSelectTree: (tree: Tree | null) => void
  viewMode?: 'clusters' | 'heatmap' | 'satellite'
  className?: string
}) {
  const [trees, setTrees] = useState<Tree[]>([])
  const center = useMemo(() => ({ lat: 10.2, lng: 76.4 }), [])

  const handleTrees = useCallback((newTrees: Tree[]) => {
    setTrees(newTrees)
  }, [])

  const tileUrl =
    viewMode === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const tileAttr =
    viewMode === 'satellite'
      ? '&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

  return (
    <div className={className ?? 'h-full w-full min-h-[400px] rounded-xl overflow-hidden relative'}>
      <MapContainer center={center} zoom={8} className="h-full w-full" scrollWheelZoom>
        <TileLayer key={viewMode} attribution={tileAttr} url={tileUrl} />
        <ViewportLoader search={search} onTrees={handleTrees} />
        <MapController selectedTree={selectedTree ?? null} />
        <ClusterLayer trees={trees} onSelect={(t) => onSelectTree(t)} />
      </MapContainer>
    </div>
  )
}
