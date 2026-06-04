import { useEffect, useMemo, useRef, useState } from "react";
import { Home, MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { PathLayer, PolygonLayer } from "@deck.gl/layers";
import { activeFlightPath, droneMapPoints, geofenceZones, mapCenter } from "../../data/geospatialData";
import { droneOpsApi } from "../../services/droneOpsApi";

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
const TELEMETRY_REFRESH_MS = 10000;
const DRONE_ICON_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M48 34v28"/>
    <path d="M33 48h30"/>
    <path d="M36 37 22 23"/>
    <path d="M60 37 74 23"/>
    <path d="M36 59 22 73"/>
    <path d="M60 59 74 73"/>
    <rect x="38" y="40" width="20" height="16" rx="5" fill="#1d6fea"/>
    <circle cx="18" cy="19" r="10" fill="#0f172a"/>
    <circle cx="78" cy="19" r="10" fill="#0f172a"/>
    <circle cx="18" cy="77" r="10" fill="#0f172a"/>
    <circle cx="78" cy="77" r="10" fill="#0f172a"/>
  </g>
</svg>
`)}`;

const GeospatialMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const droneMarkersRef = useRef(new Map());
  const telemetryErrorCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [liveDrones, setLiveDrones] = useState(droneMapPoints);
  const [liveGeofences, setLiveGeofences] = useState(geofenceZones);
  const [livePath, setLivePath] = useState(activeFlightPath);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadGeofences = async () => {
      try {
        const geofenceRows = await droneOpsApi.geofences.list();
        if (!isMounted) return;

        if (geofenceRows.length) {
          setLiveGeofences(geofenceRows.map((zone) => ({
            ...zone,
            polygon: zone.polygon
          })));
        }
      } catch (error) {
        if (isMounted) setMapError(`Geofences unavailable: ${error.message}`);
      }
    };

    loadGeofences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadTelemetry = async () => {
      if (document.visibilityState !== "visible") {
        scheduleNextTelemetryLoad();
        return;
      }

      try {
        const telemetryRows = await droneOpsApi.telemetry.live();
        if (!isMounted) return;

        telemetryErrorCountRef.current = 0;
        setMapError("");

        const nextDrones = telemetryRows
          .filter((row) => row.telemetry?.location)
          .map((row) => ({
            id: row.drone.droneCode,
            model: row.drone.model,
            status: row.drone.status,
            coordinates: [row.telemetry.location.longitude, row.telemetry.location.latitude],
            battery: row.telemetry.battery.level,
            signal: row.telemetry.signal.strength,
            altitude: row.telemetry.location.altitude,
            speed: row.telemetry.velocity.speed,
            heading: row.telemetry.velocity.heading,
            timestamp: row.telemetry.timestamp
          }));

        if (nextDrones.length) {
          setLiveDrones(nextDrones);
          setLivePath(nextDrones.map((drone) => drone.coordinates));
          setLastUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }

        scheduleNextTelemetryLoad();
      } catch (error) {
        if (!isMounted) return;
        telemetryErrorCountRef.current += 1;
        setMapError(`Live telemetry paused: ${error.message}`);

        if (telemetryErrorCountRef.current < 3) {
          scheduleNextTelemetryLoad(TELEMETRY_REFRESH_MS * 2);
        }
      }
    };

    const scheduleNextTelemetryLoad = (delay = TELEMETRY_REFRESH_MS) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(loadTelemetry, delay);
    };

    loadTelemetry();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  const deckLayers = useMemo(() => {
    return [
      new PolygonLayer({
        id: "geofence-zones",
        data: liveGeofences,
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
        data: [{ path: livePath }],
        getPath: (item) => item.path,
        getColor: [29, 111, 234, 230],
        getWidth: 4,
        widthMinPixels: 3,
        rounded: true
      })
    ];
  }, [liveGeofences, livePath]);

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
      layers: [],
      getTooltip: getMapTooltip
    });

    mapRef.current.on("load", () => {
      mapRef.current.addControl(overlayRef.current);
      setMapReady(true);
    });

    return () => {
      overlayRef.current?.finalize();
      droneMarkersRef.current.forEach((marker) => marker.remove());
      droneMarkersRef.current.clear();
      mapRef.current?.remove();
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    overlayRef.current?.setProps({ layers: deckLayers });
  }, [deckLayers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const activeMarkerIds = new Set(liveDrones.map((drone) => drone.id));

    droneMarkersRef.current.forEach((marker, markerId) => {
      if (!activeMarkerIds.has(markerId)) {
        marker.remove();
        droneMarkersRef.current.delete(markerId);
      }
    });

    liveDrones.forEach((drone) => {
      const markerElement = buildDroneMarkerElement(drone);
      const popup = new mapboxgl.Popup({ closeButton: false, offset: 28 }).setHTML(buildDronePopupHtml(drone));
      const existingMarker = droneMarkersRef.current.get(drone.id);

      if (existingMarker) {
        existingMarker.setLngLat(drone.coordinates);
        existingMarker.setPopup(popup);
        updateDroneMarkerElement(existingMarker.getElement(), drone);
        return;
      }

      const marker = new mapboxgl.Marker({ element: markerElement, anchor: "center" })
        .setLngLat(drone.coordinates)
        .setPopup(popup)
        .addTo(mapRef.current);

      droneMarkersRef.current.set(drone.id, marker);
    });
  }, [liveDrones, mapReady]);

  if (!mapboxToken) {
    return <FallbackOperationalMap />;
  }

  return (
    <div className="panel map-panel geospatial-panel">
      <div className="panel-heading compact">
        <div>
          <h3>Telemetry Map</h3>
          <p>{mapError || "Mapbox GL JS base map with Deck.gl mission overlays."}</p>
        </div>
        <span className={`map-status ${mapReady ? "online" : ""}`}>{mapReady ? "Online" : "Loading"}</span>
      </div>
      <div className="mapbox-canvas" ref={mapContainerRef} />
      <LiveDroneList drones={liveDrones} lastUpdatedAt={lastUpdatedAt} />
      <MapLegend />
    </div>
  );
};

const LiveDroneList = ({ drones, lastUpdatedAt }) => {
  return (
    <div className="live-drone-list" aria-label="Live drone locations">
      <div className="live-drone-list-header">
        <strong>Live Locations</strong>
        <span>{lastUpdatedAt ? `Updated ${lastUpdatedAt}` : "Waiting for telemetry"}</span>
      </div>
      {drones.map((drone) => (
        <article className="live-drone-card" key={drone.id}>
          <div>
            <strong>{drone.id}</strong>
            <span>{drone.model ?? formatStatus(drone.status)}</span>
          </div>
          <div>
            <span>{formatStatus(drone.status)}</span>
            <span>{formatCoordinate(drone.coordinates)}</span>
          </div>
          <div>
            <span>Battery {drone.battery ?? "--"}%</span>
            <span>Signal {drone.signal ?? "--"}%</span>
          </div>
        </article>
      ))}
    </div>
  );
};

const buildDroneMarkerElement = (drone) => {
  const element = document.createElement("div");
  element.className = `drone-map-marker ${drone.status === "IN_MISSION" ? "in-mission" : "standby"}`;
  updateDroneMarkerElement(element, drone);
  return element;
};

const updateDroneMarkerElement = (element, drone) => {
  element.className = `drone-map-marker ${drone.status === "IN_MISSION" ? "in-mission" : "standby"}`;
  element.style.setProperty("--drone-heading", `${Number(drone.heading ?? 0)}deg`);
  element.innerHTML = `
    <span class="drone-marker-pulse"></span>
    <span class="drone-marker-body">
      <img src="${DRONE_ICON_URL}" alt="" />
    </span>
    <span class="drone-marker-label">${drone.id} | ${drone.battery ?? "--"}%</span>
  `;
};

const buildDronePopupHtml = (drone) => {
  return `
    <div class="drone-map-popup">
      <strong>${drone.id}</strong>
      <span>Status: ${formatStatus(drone.status)}</span>
      <span>Battery: ${drone.battery ?? "--"}%</span>
      <span>Signal: ${drone.signal ?? "--"}%</span>
      <span>Altitude: ${drone.altitude ?? "--"} m</span>
      <span>Speed: ${drone.speed ?? "--"} m/s</span>
      <span>Location: ${formatCoordinate(drone.coordinates)}</span>
    </div>
  `;
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

const getMapTooltip = ({ object, layer }) => {
  if (!object) return null;

  if (layer?.id === "drone-icons" || layer?.id === "drone-labels") {
    return {
      html: `
        <strong>${object.id}</strong><br/>
        Status: ${formatStatus(object.status)}<br/>
        Battery: ${object.battery ?? "--"}%<br/>
        Signal: ${object.signal ?? "--"}%<br/>
        Altitude: ${object.altitude ?? "--"} m<br/>
        Speed: ${object.speed ?? "--"} m/s<br/>
        Location: ${formatCoordinate(object.coordinates)}
      `
    };
  }

  if (layer?.id === "geofence-zones") {
    return {
      html: `
        <strong>${object.name ?? "Geofence"}</strong><br/>
        Type: ${formatStatus(object.type)}
      `
    };
  }

  return null;
};

const formatStatus = (status = "") => {
  return status.toString().toLowerCase().replaceAll("_", " ");
};

const formatCoordinate = (coordinates = []) => {
  const [longitude, latitude] = coordinates;
  if (typeof latitude !== "number" || typeof longitude !== "number") return "No coordinates";
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};

export default GeospatialMap;
