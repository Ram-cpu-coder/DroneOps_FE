import { useEffect, useMemo, useRef, useState } from "react";
import { Home, MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { activeFlightPath, droneMapPoints, geofenceZones, mapCenter } from "../../data/geospatialData";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const GeospatialMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const deckLayers = useMemo(() => {
    return [
      new PolygonLayer({
        id: "geofence-zones",
        data: geofenceZones,
        getPolygon: (zone) => zone.polygon,
        getFillColor: (zone) => zone.type === "RESTRICTED" ? [198, 23, 50, 34] : [245, 183, 0, 34],
        getLineColor: (zone) => zone.type === "RESTRICTED" ? [198, 23, 50, 210] : [245, 183, 0, 210],
        getLineWidth: 3,
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        pickable: true
      }),
      new PathLayer({
        id: "active-flight-path",
        data: [{ path: activeFlightPath }],
        getPath: (item) => item.path,
        getColor: [29, 111, 234, 230],
        getWidth: 4,
        widthMinPixels: 3,
        rounded: true
      }),
      new ScatterplotLayer({
        id: "drone-positions",
        data: droneMapPoints,
        getPosition: (drone) => drone.coordinates,
        getFillColor: [22, 179, 100, 235],
        getLineColor: [255, 255, 255, 255],
        getRadius: 95,
        radiusMinPixels: 8,
        radiusMaxPixels: 18,
        lineWidthMinPixels: 2,
        pickable: true
      }),
      new TextLayer({
        id: "drone-labels",
        data: droneMapPoints,
        getPosition: (drone) => drone.coordinates,
        getText: (drone) => drone.id,
        getSize: 13,
        getColor: [17, 24, 39, 255],
        getPixelOffset: [0, -24],
        getTextAnchor: "middle",
        getAlignmentBaseline: "center"
      })
    ];
  }, []);

  useEffect(() => {
    if (!mapboxToken || mapRef.current || !mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [mapCenter.longitude, mapCenter.latitude],
      zoom: 12.4,
      pitch: 54,
      bearing: -18,
      attributionControl: false
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    overlayRef.current = new MapboxOverlay({
      interleaved: true,
      layers: deckLayers
    });

    mapRef.current.on("load", () => {
      mapRef.current.addControl(overlayRef.current);
      setMapReady(true);
    });

    return () => {
      overlayRef.current?.finalize();
      mapRef.current?.remove();
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, [deckLayers]);

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  if (!mapboxToken) {
    return <FallbackOperationalMap />;
  }

  return (
    <div className="panel map-panel geospatial-panel">
      <div className="panel-heading compact">
        <div>
          <h3>Telemetry Map</h3>
          <p>Mapbox GL JS base map with Deck.gl mission overlays.</p>
        </div>
        <span className={`map-status ${mapReady ? "online" : ""}`}>{mapReady ? "Online" : "Loading"}</span>
      </div>
      <div className="mapbox-canvas" ref={mapContainerRef} />
      <MapLegend />
    </div>
  );
};

const FallbackOperationalMap = () => {
  return (
    <div className="panel map-panel">
      <div className="panel-heading compact">
        <div>
          <h3>Telemetry Map</h3>
          <p>Add VITE_MAPBOX_TOKEN to enable Mapbox GL JS and Deck.gl overlays.</p>
        </div>
        <button className="icon-button" type="button" aria-label="Center map">
          <Home size={17} />
        </button>
      </div>
      <div className="map-canvas geospatial-fallback" aria-label="Drone location map">
        <div className="map-grid" />
        <div className="geofence-shape restricted" />
        <div className="geofence-shape warning" />
        <div className="flight-path-line" />
        <MapPin className="map-pin pin-a" size={34} />
        <MapPin className="map-pin pin-b" size={28} />
        <MapPin className="map-pin pin-c" size={30} />
        <div className="map-label">Deck.gl overlay ready</div>
      </div>
      <MapLegend />
    </div>
  );
};

const MapLegend = () => {
  return (
    <div className="map-legend">
      <span><i className="dot green" /> Drone</span>
      <span><i className="dot blue" /> Flight path</span>
      <span><i className="dot red" /> Restricted</span>
      <span><i className="dot amber" /> Warning</span>
    </div>
  );
};

export default GeospatialMap;
