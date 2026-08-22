'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getStatusColor, OVERALL_STATUSES, getStatusList, PARCEL_LABEL_SHORT } from '@/lib/constants';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/Control.FullScreen.css';
// @ts-ignore
import 'leaflet-measure';
import 'leaflet-measure/dist/leaflet-measure.css';
// @ts-ignore
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
// @ts-ignore
import * as easyPrint from 'leaflet-easyprint';
import { Box } from '@mui/material';
import { isMultiModifier, toggleSelection, mergeUnique } from '@/lib/map/multiSelect';

// Fix for default markers not showing in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Parcel {
  id: string;
  parcelNumber?: string | null;
  pin?: string | null;
  easementNumber?: string | null;
  newStructureNumbers?: string | null;
  existingStructureNumbers?: string | null;
  owner?: string | null;
  status: string;
  titleStatus?: string;
  surveyStatus?: string;
  appraisalStatus?: string;
  acquisitionStatus?: string;
  condemnationStatus?: string;
  damagesStatus?: string;
  specialConditionsStatus?: string;
  ptsStatus?: string;
  permitStatus?: string;
  existingRightsStatus?: string;
  parcelClass?: string;
  encroachmentStatus?: string;
  bookmarked?: boolean | null;
  priority?: string | null;
  labels?: { code: string; note?: string | null }[];
  existingRightLinks?: Array<{
    existingRight?: {
      id: string;
      instrumentNumber?: string | null;
      name?: string | null;
      rightType?: string;
      purpose?: string;
      lifeStatus?: string;
      widthFeet?: number | string | null;
      grantor?: string | null;
      grantee?: string | null;
      restrictionFlags?: unknown;
    } | null;
  }>;
  geometry?: any;
  acreage?: number | null;
  county?: string | null;
  lastCompensationOutsideRange?: boolean | null;
  propertyAddress?: string | null;
}

interface ProjectLayer {
  id: string;
  name: string;
  kind: string;
  geometryType?: string | null;
  featureCount: number;
  data: any;
  visible: boolean;
  opacity: number;
}

interface ParcelMapProps {
  parcels: Parcel[];
  layers?: ProjectLayer[];
  /** Project-level instruments (geometry + multi-parcel links) */
  existingRights?: Array<{
    id: string;
    instrumentNumber?: string | null;
    name?: string | null;
    rightType?: string;
    purpose?: string;
    lifeStatus?: string;
    geometry?: any;
    parcels?: Array<{ parcelId: string }>;
  }>;
  selectedParcelId?: string | null;
  /** Multi-select for bulk actions */
  multiSelectedIds?: string[];
  onParcelClick?: (parcelId: string) => void;
  onMultiSelectChange?: (ids: string[]) => void;
  center?: [number, number];
  zoom?: number;
  /** Used in map PNG export filename */
  projectTitle?: string;
  activeStatusTab?:
    | 'status'
    | 'pts'
    | 'title'
    | 'survey'
    | 'appraisal'
    | 'acquisition'
    | 'condemnation'
    | 'special_conditions'
    | 'damages'
    | 'permit'
    | 'existing_rights'
    | 'parcel_class'
    | 'encroachments';
  /** Map-embedded search (survives fullscreen) */
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  /** Status values hidden from map (legend toggles) */
  hiddenStatuses?: string[];
  onToggleStatusVisibility?: (statusValue: string) => void;
  onShowAllStatuses?: () => void;
  onHideAllStatuses?: () => void;
}

// Removed duplicate getStatusList - now using centralized version from @/lib/constants

export default function ParcelMap({
  parcels,
  layers = [],
  existingRights = [],
  selectedParcelId,
  multiSelectedIds = [],
  onParcelClick,
  onMultiSelectChange,
  center = [39.8283, -98.5795], // Geographic center of USA
  zoom = 5,
  projectTitle,
  activeStatusTab = 'status',
  searchQuery = '',
  onSearchChange,
  hiddenStatuses = [],
  onToggleStatusVisibility,
  onShowAllStatuses,
  onHideAllStatuses,
}: ParcelMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.LayerGroup | L.GeoJSON | L.Marker }>({});
  const projectLayersRef = useRef<{ [key: string]: L.GeoJSON }>({});
  const existingRightsGroupRef = useRef<L.LayerGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const controlsRef = useRef<any>({});
  const projectTitleRef = useRef(projectTitle);
  projectTitleRef.current = projectTitle;
  const multiSelectedRef = useRef(multiSelectedIds);
  multiSelectedRef.current = multiSelectedIds;
  const onMultiSelectChangeRef = useRef(onMultiSelectChange);
  onMultiSelectChangeRef.current = onMultiSelectChange;
  const parcelsRef = useRef(parcels);
  parcelsRef.current = parcels;
  const boxSelectModeRef = useRef(false);
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const hiddenStatusesRef = useRef(hiddenStatuses);
  hiddenStatusesRef.current = hiddenStatuses;
  const onToggleStatusVisibilityRef = useRef(onToggleStatusVisibility);
  onToggleStatusVisibilityRef.current = onToggleStatusVisibility;
  const onShowAllStatusesRef = useRef(onShowAllStatuses);
  onShowAllStatusesRef.current = onShowAllStatuses;
  const onHideAllStatusesRef = useRef(onHideAllStatuses);
  onHideAllStatusesRef.current = onHideAllStatuses;

  // Get the appropriate status value based on active tab
  const getParcelStatus = (parcel: Parcel) => {
    switch (activeStatusTab) {
      case 'status':
        return parcel.status;
      case 'pts':
        return parcel.ptsStatus;
      case 'title':
        return parcel.titleStatus;
      case 'survey':
        return parcel.surveyStatus;
      case 'appraisal':
        return parcel.appraisalStatus;
      case 'acquisition':
        return parcel.acquisitionStatus || parcel.status;
      case 'condemnation':
        return parcel.condemnationStatus;
      case 'special_conditions':
        return parcel.specialConditionsStatus;
      case 'damages':
        return parcel.damagesStatus;
      case 'permit':
        return parcel.permitStatus;
      case 'existing_rights':
        return parcel.existingRightsStatus;
      case 'parcel_class':
        return parcel.parcelClass;
      case 'encroachments':
        return parcel.encroachmentStatus;
      default:
        return parcel.status;
    }
  };

  const getStatusLabel = () => {
    switch (activeStatusTab) {
      case 'status':
        return 'Overall';
      case 'pts':
        return 'PTS';
      case 'title':
        return 'Title';
      case 'survey':
        return 'Survey';
      case 'appraisal':
        return 'Appraisal';
      case 'acquisition':
        return 'Acquisition';
      case 'condemnation':
        return 'Condemnation';
      case 'special_conditions':
        return 'Special';
      case 'damages':
        return 'Damages';
      case 'permit':
        return 'Permit';
      case 'existing_rights':
        return 'Existing rights';
      case 'parcel_class':
        return 'Parcel class';
      case 'encroachments':
        return 'Encroachments';
      default:
        return 'Status';
    }
  };

  const ensureConstraintHatch = (map: L.Map) => {
    const pane = map.getPanes().overlayPane;
    const svg = pane?.querySelector('svg');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(ns, 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }
    if (svg.querySelector('#rf-hatch-amber')) return;
    const pattern = document.createElementNS(ns, 'pattern');
    pattern.setAttribute('id', 'rf-hatch-amber');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '7');
    pattern.setAttribute('height', '7');
    pattern.setAttribute('patternTransform', 'rotate(45)');
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', '0');
    line.setAttribute('y2', '7');
    line.setAttribute('stroke', 'rgba(245, 158, 11, 0.9)');
    line.setAttribute('stroke-width', '2.25');
    pattern.appendChild(line);
    defs.appendChild(pattern);
  };

  /** Apply SVG hatch fill to every path in a Leaflet layer (live paths, not clones). */
  const paintHatchFill = (layer: L.Layer) => {
    const anyLayer = layer as any;
    const path = anyLayer._path as SVGPathElement | undefined;
    if (!path) return;
    path.setAttribute('fill', 'url(#rf-hatch-amber)');
    path.setAttribute('fill-opacity', '1');
    path.setAttribute('stroke', 'none');
    path.style.pointerEvents = 'none';
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: 'topleft',
      },
    }).setView(center, zoom);
    map.getContainer().classList.add('rowflow-map-root');

    // Create base layers
    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    );

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    );

    const topoLayer = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        attribution:
          'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
        maxZoom: 17,
      }
    );

    const darkLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    );

    // Add default layer — dark (suite feel with Tractsource)
    darkLayer.addTo(map);

    // Create drawn items layer
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Add drawing control (hidden until Tools expanded)
    const drawControl = new (L.Control as any).Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Shape edges cannot cross!',
          },
          shapeOptions: {
            color: '#2196f3',
          },
        },
        polyline: {
          shapeOptions: {
            color: '#f44336',
            weight: 4,
          },
        },
        circle: false,
        circlemarker: false,
        rectangle: {
          shapeOptions: {
            color: '#ff9800',
          },
        },
        marker: true,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);
    // Tag draw chrome for collapse
    try {
      const drawEl = (drawControl as any)._container as HTMLElement | undefined;
      if (drawEl) drawEl.classList.add('rowflow-tool-chrome');
    } catch {
      /* ignore */
    }

    // Tools toggle — default collapsed so review mode stays clean
    const toolsToggle = (L as any).control({ position: 'topleft' });
    toolsToggle.onAdd = () => {
      const div = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control rowflow-tools-toggle'
      );
      const a = L.DomUtil.create('a', '', div) as HTMLAnchorElement;
      a.href = '#';
      a.title = 'Map tools (draw, select, measure, search)';
      a.setAttribute('role', 'button');
      a.style.cssText =
        'width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;text-decoration:none;';
      a.textContent = '⚒';
      L.DomEvent.on(div, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        const root = map.getContainer();
        const open = root.classList.toggle('rowflow-tools-open');
        a.style.backgroundColor = open ? '#3b82f6' : '';
        a.style.color = open ? '#fff' : '';
        a.title = open ? 'Hide map tools' : 'Map tools (draw, select, measure, search)';
      });
      return div;
    };
    toolsToggle.addTo(map);
    controlsRef.current.toolsToggle = toolsToggle;
    // Move tools toggle above draw chrome in the stack
    try {
      const left = map.getContainer().querySelector('.leaflet-top.leaflet-left');
      const toggleEl = (toolsToggle as any)._container as HTMLElement | undefined;
      if (left && toggleEl) {
        left.insertBefore(toggleEl, left.firstChild);
      }
    } catch {
      /* ignore */
    }

    // Handle drawn shapes
    map.on((L.Draw as any).Event.CREATED, (event: any) => {
      const layer = event.layer;

      // Box-select mode: rectangle used only to pick parcels, not kept as annotation
      if (boxSelectModeRef.current && event.layerType === 'rectangle') {
        const b = layer.getBounds?.() || (layer as L.Rectangle).getBounds();
        const hits: string[] = [];
        Object.entries(markersRef.current).forEach(([id, g]) => {
          if (g instanceof L.GeoJSON) {
            const pb = g.getBounds();
            if (pb.isValid() && b.intersects(pb)) hits.push(id);
          }
        });
        const prev = multiSelectedRef.current || [];
        const merged = mergeUnique(prev, hits);
        onMultiSelectChangeRef.current?.(merged);
        boxSelectModeRef.current = false;
        map.getContainer().style.cursor = '';
        try {
          controlsRef.current.boxDrawer?.disable?.();
        } catch {
          /* ignore */
        }
        // Reset ▢ button chrome
        try {
          const a = (controlsRef.current.boxSelect as any)?._container?.querySelector?.('a') as
            | HTMLElement
            | undefined;
          if (a) {
            a.style.backgroundColor = '';
            a.style.color = '';
          }
        } catch {
          /* ignore */
        }
        // Do not keep the selection rectangle as a drawn feature
        try {
          map.removeLayer(layer);
        } catch {
          /* ignore */
        }
        return;
      }

      drawnItems.addLayer(layer);
      const geoJSON = layer.toGeoJSON();
      console.log('Feature drawn:', geoJSON);
    });

    map.on((L.Draw as any).Event.EDITED, (event: any) => {
      console.log('Features edited:', event.layers);
    });

    map.on((L.Draw as any).Event.DELETED, (event: any) => {
      console.log('Features deleted:', event.layers);
    });

    // Box-select parcels (for bulk status)
    const boxSelectControl = (L as any).control({ position: 'topleft' });
    boxSelectControl.onAdd = () => {
      const div = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control rowflow-tool-chrome'
      );
      div.innerHTML =
        '<a href="#" title="Box-select parcels (Shift+click also toggles)" style="font-size:14px;line-height:34px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;text-decoration:none;">▢</a>';
      L.DomEvent.on(div, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        boxSelectModeRef.current = !boxSelectModeRef.current;
        const a = div.querySelector('a') as HTMLElement | null;
        if (boxSelectModeRef.current) {
          if (a) {
            a.style.backgroundColor = '#3b82f6';
            a.style.color = '#fff';
          }
          map.getContainer().style.cursor = 'crosshair';
          // Start rectangle draw for selection
          try {
            const drawer = new (L.Draw as any).Rectangle(map, {
              shapeOptions: { color: '#3b82f6', weight: 2, fillOpacity: 0.08 },
            });
            drawer.enable();
            controlsRef.current.boxDrawer = drawer;
          } catch (err) {
            console.error('box select', err);
          }
        } else {
          if (a) {
            a.style.backgroundColor = '';
            a.style.color = '';
          }
          map.getContainer().style.cursor = '';
          try {
            controlsRef.current.boxDrawer?.disable?.();
          } catch {
            /* ignore */
          }
        }
      });
      return div;
    };
    boxSelectControl.addTo(map);
    controlsRef.current.boxSelect = boxSelectControl;

    // Add text annotation tool
    const textControl = (L as any).control({ position: 'topleft' });
    let textMode = false;

    textControl.onAdd = () => {
      const div = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control leaflet-control-custom rowflow-tool-chrome'
      );
      div.innerHTML =
        '<a href="#" title="Add Text Annotation" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;text-decoration:none;">T</a>';

      L.DomEvent.on(div, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        textMode = !textMode;
        const a = div.querySelector('a') as HTMLElement | null;
        if (textMode) {
          div.classList.add('leaflet-draw-toolbar-button-enabled');
          if (a) {
            a.style.backgroundColor = '#3b82f6';
            a.style.color = '#fff';
          }
          map.getContainer().style.cursor = 'crosshair';
        } else {
          div.classList.remove('leaflet-draw-toolbar-button-enabled');
          if (a) {
            a.style.backgroundColor = '';
            a.style.color = '';
          }
          map.getContainer().style.cursor = '';
        }
      });

      return div;
    };
    textControl.addTo(map);

    // Handle text annotation placement
    map.on('click', (e: any) => {
      if (textMode) {
        const text = prompt('Enter text for annotation:');
        if (text) {
          const textIcon = L.divIcon({
            className: 'text-annotation',
            html: `<div style="
              background: white;
              padding: 5px 10px;
              border: 2px solid #2196f3;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              white-space: nowrap;
            ">${text}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const textMarker = L.marker(e.latlng, { icon: textIcon });
          textMarker.addTo(drawnItems);

          console.log('Text annotation added:', { text, latlng: e.latlng });
        }

        // Reset text mode
        textMode = false;
        const textControlElement = document.querySelector('.leaflet-control-custom');
        if (textControlElement) {
          const anchor = textControlElement.querySelector('a') as HTMLElement | null;
          if (anchor) {
            anchor.style.backgroundColor = '';
            anchor.style.color = '';
          }
        }
        map.getContainer().style.cursor = '';
      }
    });

    // Add measurement control
    try {
      const measureControl = new (L.Control as any).Measure({
        position: 'topleft',
        primaryLengthUnit: 'feet',
        secondaryLengthUnit: 'miles',
        primaryAreaUnit: 'acres',
        secondaryAreaUnit: 'sqfeet',
        activeColor: '#2196f3',
        completedColor: '#4caf50',
      });
      measureControl.addTo(map);
      controlsRef.current.measure = measureControl;
      try {
        const el = (measureControl as any)._container as HTMLElement | undefined;
        if (el) el.classList.add('rowflow-tool-chrome');
      } catch {
        /* ignore */
      }
    } catch (error) {
      console.error('Measurement control error:', error);
    }

    // Add geocoder/search control
    try {
      const geocoder = (L.Control as any).geocoder({
        defaultMarkGeocode: false,
        position: 'topleft',
        placeholder: 'Search address or location...',
        errorMessage: 'Nothing found',
      });

      geocoder.on('markgeocode', (e: any) => {
        const bbox = e.geocode.bbox;
        const poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest(),
        ]);
        map.fitBounds(poly.getBounds());
      });

      geocoder.addTo(map);
      controlsRef.current.geocoder = geocoder;
      try {
        const el = (geocoder as any)._container as HTMLElement | undefined;
        if (el) el.classList.add('rowflow-tool-chrome');
      } catch {
        /* ignore */
      }
    } catch (error) {
      console.error('Geocoder control error:', error);
    }

    // Add custom print/export button using leaflet-image
    const printControl = (L as any).control({ position: 'topleft' });
    printControl.onAdd = () => {
      const div = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control rowflow-tool-chrome'
      );
      div.innerHTML =
        '<a href="#" title="Print/Export Map" style="font-size:15px;line-height:34px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;">⎙</a>';

      L.DomEvent.on(div, 'click', async (e) => {
        L.DomEvent.preventDefault(e);

        try {
          // Use html2canvas for complete map capture including all layers
          const html2canvas = (await import('html2canvas')).default;

          // Hide controls temporarily for cleaner export
          const controls = map.getContainer().querySelectorAll('.leaflet-control-container');
          controls.forEach((control: any) => {
            control.style.display = 'none';
          });

          // Wait a moment for render
          await new Promise((resolve) => setTimeout(resolve, 300));

          const mapElement = map.getContainer();
          const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality export
            logging: false,
          });

          // Restore controls
          controls.forEach((control: any) => {
            control.style.display = '';
          });

          // Convert canvas to blob and download
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${(projectTitleRef.current || 'row-map')
                .replace(/[^\w\-]+/g, '-')
                .slice(0, 48)}-${new Date().toISOString().split('T')[0]}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }
          });
        } catch (error) {
          console.error('Export error:', error);
          alert('Map export failed. Please try again.');
        }
      });

      return div;
    };
    printControl.addTo(map);
    controlsRef.current.print = printControl;

    // Create WMS overlay layers — opacity held in ref so toggle on/off keeps values
    const overlayOpacity = {
      wetlands: 0.6,
      contours: 0.7,
      topo: 0.5,
    };
    (controlsRef.current as any).overlayOpacity = overlayOpacity;

    const wetlandsLayer = L.tileLayer.wms(
      'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer',
      {
        layers: '1',
        format: 'image/png',
        transparent: true,
        attribution: 'USFWS National Wetlands Inventory',
        opacity: overlayOpacity.wetlands,
        version: '1.3.0',
      }
    );

    const contoursLayer = L.tileLayer.wms(
      'https://carto.nationalmap.gov/arcgis/services/contours/MapServer/WMSServer',
      {
        layers: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21',
        format: 'image/png',
        transparent: true,
        attribution: 'USGS National Map - Contours',
        opacity: overlayOpacity.contours,
        version: '1.3.0',
      }
    );

    const topoOverlayLayer = L.tileLayer.wms(
      'https://basemap.nationalmap.gov/arcgis/services/USGSTopo/MapServer/WMSServer',
      {
        layers: '0',
        format: 'image/png',
        transparent: true,
        attribution: 'USGS National Map - Topographic',
        opacity: overlayOpacity.topo,
      }
    );

    // Re-apply stored opacity whenever an overlay is turned back on
    const applyStoredOpacity = (layer: L.Layer) => {
      if (layer === wetlandsLayer) wetlandsLayer.setOpacity(overlayOpacity.wetlands);
      if (layer === contoursLayer) contoursLayer.setOpacity(overlayOpacity.contours);
      if (layer === topoOverlayLayer) topoOverlayLayer.setOpacity(overlayOpacity.topo);
    };
    map.on('overlayadd', (e: any) => {
      if (e?.layer) applyStoredOpacity(e.layer);
    });

    // Add layer control
    const baseMaps = {
      'Street Map': streetLayer,
      Satellite: satelliteLayer,
      Topographic: topoLayer,
      'Dark Mode': darkLayer,
    };

    const existingRightsGroup = L.layerGroup();
    existingRightsGroupRef.current = existingRightsGroup;
    existingRightsGroup.addTo(map);

    const overlayMaps = {
      Parcels: new L.LayerGroup(),
      'Existing rights': existingRightsGroup,
      'Drawn Features': drawnItems,
      'Wetlands (NWI)': wetlandsLayer,
      'Contours (USGS)': contoursLayer,
      'Topo Overlay (USGS)': topoOverlayLayer,
    };

    const layerControl = (L as any).control.layers(baseMaps, overlayMaps, {
      position: 'topright',
      collapsed: true,
    }).addTo(map);
    controlsRef.current.layerControl = layerControl;

    // Opacity sliders live inside Layers menu (not a free-floating panel)
    try {
      const lcEl = (layerControl as any)._container as HTMLElement | undefined;
      const list = lcEl?.querySelector('.leaflet-control-layers-list') as HTMLElement | null;
      if (list) {
        const section = L.DomUtil.create('div', 'leaflet-control-layers-opacity', list);
        section.innerHTML = `
          <div class="layers-opacity-title">Overlay opacity</div>
          ${(['wetlands', 'contours', 'topo'] as const)
            .map((key) => {
              const label =
                key === 'wetlands' ? 'Wetlands' : key === 'contours' ? 'Contours' : 'Topo overlay';
              const pct = Math.round(overlayOpacity[key] * 100);
              return `<div class="opacity-row" data-key="${key}">
                <label>${label}<span class="opacity-value">${pct}%</span></label>
                <input type="range" min="0" max="100" value="${pct}" data-opacity-key="${key}" />
              </div>`;
            })
            .join('')}
        `;
        L.DomEvent.disableClickPropagation(section);
        L.DomEvent.disableScrollPropagation(section);
        section.querySelectorAll('input[type="range"]').forEach((el) => {
          const input = el as HTMLInputElement;
          const key = input.getAttribute('data-opacity-key') as
            | 'wetlands'
            | 'contours'
            | 'topo';
          const valueLabel = input.parentElement?.querySelector('.opacity-value');
          const apply = (raw: string) => {
            const v = Math.max(0, Math.min(100, Number(raw) || 0)) / 100;
            overlayOpacity[key] = v;
            if (valueLabel) valueLabel.textContent = `${Math.round(v * 100)}%`;
            if (key === 'wetlands') wetlandsLayer.setOpacity(v);
            if (key === 'contours') contoursLayer.setOpacity(v);
            if (key === 'topo') topoOverlayLayer.setOpacity(v);
          };
          input.addEventListener('input', () => apply(input.value));
          input.addEventListener('change', () => apply(input.value));
        });
      }
    } catch (err) {
      console.error('layers opacity inject', err);
    }

    // Add geolocation control
    const locateControl = (L as any).control({ position: 'topleft' });
    locateControl.onAdd = () => {
      const div = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control rowflow-tool-chrome'
      );
      div.innerHTML =
        '<a href="#" title="My Location" style="font-size:16px;line-height:34px;display:block;text-align:center;">◎</a>';

      L.DomEvent.on(div, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        map.locate({ setView: true, maxZoom: 16 });
      });

      return div;
    };
    locateControl.addTo(map);

    map.on('locationfound', (e: any) => {
      L.marker(e.latlng)
        .addTo(map)
        .bindPopup('You are here!')
        .openPopup();
      L.circle(e.latlng, e.accuracy / 2, {
        color: '#2196f3',
        fillColor: '#2196f3',
        fillOpacity: 0.2,
      }).addTo(map);
    });

    map.on('locationerror', (e: any) => {
      alert('Location access denied or unavailable');
    });

    // Add coordinate display control
    const coordsControl = (L as any).control({ position: 'bottomleft' });
    coordsControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-control-coordinates');
      div.textContent = 'Lat: —, Lng: —';
      return div;
    };
    coordsControl.addTo(map);

    map.on('mousemove', (e: any) => {
      const { lat, lng } = e.latlng;
      const coordDiv = document.querySelector('.leaflet-control-coordinates');
      if (coordDiv) {
        coordDiv.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      }
    });

    // Parcel search — top-center of map (survives fullscreen, clear of tools/layers)
    if (onSearchChangeRef.current) {
      const div = L.DomUtil.create('div', 'rowflow-map-search', map.getContainer());
      div.innerHTML = `
        <div class="rowflow-map-search-inner">
          <input type="search" placeholder="Search PIN, owner, address…" value="" autocomplete="off" spellcheck="false" />
          <button type="button" class="rowflow-map-search-clear" title="Clear search" aria-label="Clear search" hidden>×</button>
        </div>
      `;
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      const input = div.querySelector('input') as HTMLInputElement;
      const clearBtn = div.querySelector('.rowflow-map-search-clear') as HTMLButtonElement;
      input.value = searchQueryRef.current || '';
      const syncClear = () => {
        clearBtn.hidden = !input.value;
      };
      syncClear();
      let timer: ReturnType<typeof setTimeout> | null = null;
      input.addEventListener('input', () => {
        syncClear();
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          onSearchChangeRef.current?.(input.value);
        }, 120);
      });
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
          input.value = '';
          syncClear();
          onSearchChangeRef.current?.('');
          input.blur();
        }
      });
      clearBtn.addEventListener('click', (ev) => {
        L.DomEvent.stop(ev);
        input.value = '';
        syncClear();
        onSearchChangeRef.current?.('');
        input.focus();
      });
      (controlsRef.current as any).searchInput = input;
      (controlsRef.current as any).searchEl = div;
    }

    mapRef.current = map;

    return () => {
      const searchEl = (controlsRef.current as any)?.searchEl as HTMLElement | undefined;
      if (searchEl?.parentNode) {
        searchEl.parentNode.removeChild(searchEl);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);


  // Keep map search input in sync with parent state
  useEffect(() => {
    const input = (controlsRef.current as any)?.searchInput as HTMLInputElement | undefined;
    if (input && input.value !== (searchQuery || '')) {
      input.value = searchQuery || '';
    }
  }, [searchQuery]);

  // Update single collapsible legend when status tab / visibility changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (controlsRef.current.legend) {
      controlsRef.current.legend.remove();
    }

    const legend = new (L.Control as any)({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend rowflow-map-legend');
      div.style.maxWidth = '220px';
      div.style.marginBottom = '28px';

      const statuses = (() => {
        switch (activeStatusTab) {
          case 'status':
            return OVERALL_STATUSES;
          case 'pts':
            return getStatusList('pts');
          case 'title':
            return getStatusList('title');
          case 'survey':
            return getStatusList('survey');
          case 'appraisal':
            return getStatusList('appraisal');
          case 'acquisition':
            return getStatusList('acquisition');
          case 'condemnation':
            return getStatusList('condemnation');
          case 'special_conditions':
            return getStatusList('special_conditions');
          case 'damages':
            return getStatusList('damages');
          case 'permit':
            return getStatusList('permit');
          case 'existing_rights':
            return getStatusList('existing_rights');
          case 'parcel_class':
            return getStatusList('parcel_class');
          case 'encroachments':
            return getStatusList('encroachments');
          default:
            return OVERALL_STATUSES;
        }
      })();

      const hidden = new Set(hiddenStatusesRef.current || []);
      const bodyHtml = statuses
        .map((status) => {
          const checked = !hidden.has(status.value);
          return `
          <label class="legend-row legend-toggle-row" data-status="${status.value}">
            <input type="checkbox" ${checked ? 'checked' : ''} data-status="${status.value}" />
            <span class="legend-swatch" style="background:${getStatusColor(status.value)}"></span>
            <span class="legend-label">${status.label}</span>
          </label>`;
        })
        .join('');

      div.innerHTML = `
        <button type="button" class="legend-toggle" title="Toggle legend">
          <span>${getStatusLabel()} colors</span>
          <span class="legend-chevron">▾</span>
        </button>
        <div class="legend-body">
          <div class="legend-actions">
            <button type="button" class="legend-all" data-act="all">All</button>
            <button type="button" class="legend-all" data-act="none">None</button>
          </div>
          ${bodyHtml}
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      const btn = div.querySelector('.legend-toggle') as HTMLButtonElement | null;
      const body = div.querySelector('.legend-body') as HTMLElement | null;
      const chev = div.querySelector('.legend-chevron') as HTMLElement | null;
      let open = true;
      if (btn && body) {
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.stop(e);
          open = !open;
          body.style.display = open ? 'block' : 'none';
          if (chev) chev.textContent = open ? '▾' : '▸';
        });
      }

      div.querySelectorAll('input[type="checkbox"][data-status]').forEach((el) => {
        el.addEventListener('change', () => {
          const v = (el as HTMLInputElement).getAttribute('data-status') || '';
          onToggleStatusVisibilityRef.current?.(v);
        });
      });
      div.querySelectorAll('button.legend-all').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const act = (el as HTMLElement).getAttribute('data-act');
          if (act === 'all') onShowAllStatusesRef.current?.();
          if (act === 'none') onHideAllStatusesRef.current?.();
        });
      });

      return div;
    };

    legend.addTo(map);
    controlsRef.current.legend = legend;

    return () => {
      if (controlsRef.current.legend) {
        controlsRef.current.legend.remove();
      }
    };
  }, [activeStatusTab, hiddenStatuses]);

  // Render imported project reference layers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    Object.values(projectLayersRef.current).forEach((layer) => {
      layer.remove();
      if (controlsRef.current.layerControl) {
        try {
          controlsRef.current.layerControl.removeLayer(layer);
        } catch {}
      }
    });
    projectLayersRef.current = {};

    layers
      .filter((layer) => layer.visible !== false && layer.data?.features?.length > 0)
      .forEach((projectLayer) => {
        try {
          const geoJsonLayer = L.geoJSON(projectLayer.data, {
            style: (feature) => {
              const kind = String(projectLayer.kind || '');
              const props = feature?.properties || {};
              if (kind === 'centerline') {
                return { color: '#e8f1f4', weight: 4, opacity: 0.95, fillOpacity: 0 };
              }
              if (kind === 'access') {
                return { color: '#e5a426', weight: 2, opacity: 0.9, dashArray: '6 4', fillOpacity: 0 };
              }
              if (kind === 'corridor') {
                return { color: '#3db8d4', weight: 2, fillColor: '#3db8d4', fillOpacity: 0.12 };
              }
              if (kind === 'buildings') {
                const cls = String(props.encroachClass || '');
                if (cls === 'IN_ROW') {
                  return { color: '#e53935', weight: 2.5, fillColor: '#c65151', fillOpacity: 0.72 };
                }
                if (cls === 'PROXIMITY') {
                  return { color: '#503c78', weight: 1.5, fillColor: '#7558a5', fillOpacity: 0.42 };
                }
                return { color: '#666', weight: 0.6, fillOpacity: 0.08, opacity: 0.3 };
              }
              const stroke = props.stroke || props.color || '#7c3aed';
              const fill = props.fill || props['marker-color'] || stroke;
              const weight = Number(props['stroke-width'] || props.weight || (projectLayer.geometryType === 'polyline' ? 3 : 1));
              const opacity = Number(props['stroke-opacity'] || projectLayer.opacity || 0.65);
              const fillOpacity = Number(props['fill-opacity'] || (projectLayer.geometryType === 'polygon' ? projectLayer.opacity ?? 0.25 : 0));
              return { color: stroke, weight, opacity, fillColor: fill, fillOpacity };
            },
            pointToLayer: (feature, latlng) => {
              const props = feature?.properties || {};
              const isStructure = Boolean(props.icon?.includes('transmission')) || /station|^\d|structure/i.test(String(props.name || ''));
              const color = props['marker-color'] || props.stroke || (isStructure ? '#f59e0b' : '#7c3aed');

              return L.circleMarker(latlng, {
                radius: isStructure ? 6 : 4,
                color,
                fillColor: color,
                fillOpacity: projectLayer.opacity ?? 0.75,
                weight: isStructure ? 2 : 1,
              });
            },
            onEachFeature: (feature, layer) => {
              const props = feature.properties || {};
              const title = props.PIN || props.RPC || props.fullname || props.fulladdr || props.ZONING || props.OVERLAY || projectLayer.name;
              const rows = Object.entries(props)
                .slice(0, 8)
                .map(([key, value]) => `<strong>${key}:</strong> ${String(value ?? '')}`)
                .join('<br/>');
              layer.bindPopup(`<div style="min-width: 220px;"><strong>${title}</strong><br/>${rows}</div>`);
            },
          }).addTo(map);

          projectLayersRef.current[projectLayer.id] = geoJsonLayer;
          if (controlsRef.current.layerControl) {
            controlsRef.current.layerControl.addOverlay(
              geoJsonLayer,
              `${projectLayer.name} (${projectLayer.featureCount})`
            );
          }
        } catch (error) {
          console.error('Error rendering project layer:', error);
        }
      });
  }, [layers]);

  // Update parcel markers when parcels or status tab changes
  useEffect(() => {
    if (!mapRef.current || !parcels) return;

    const map = mapRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};
    const erGroup = existingRightsGroupRef.current;
    if (erGroup) {
      erGroup.clearLayers();
    }

    ensureConstraintHatch(map);

    // Add new markers
    const bounds: L.LatLngBoundsExpression[] = [];

    const hidden = new Set(hiddenStatuses || []);
    parcels.forEach((parcel) => {
      if (parcel.geometry) {
        try {
          const parcelStatus = getParcelStatus(parcel) || 'NOT_STARTED';
          if (hidden.size > 0 && hidden.has(parcelStatus)) {
            return;
          }
          const isMulti = multiSelectedIds.includes(parcel.id);
          const isFocus = selectedParcelId === parcel.id;
          const hasLabels = (parcel.labels || []).length > 0;
          const rightLinks = parcel.existingRightLinks || [];
          const hasExistingRights = rightLinks.length > 0;
          const rightsSummary = rightLinks
            .map((l) => {
              const r = l.existingRight;
              if (!r) return null;
              const num = r.instrumentNumber ? `#${r.instrumentNumber}` : r.name || 'Right';
              const w = r.widthFeet != null ? ` ${Number(r.widthFeet)}'` : '';
              return `${num}${w}`;
            })
            .filter(Boolean)
            .join('; ');
          const labelShorts = (parcel.labels || [])
            .map((l) => PARCEL_LABEL_SHORT[l.code] || l.code)
            .join(' · ');
          const statusColor = getStatusColor(parcelStatus);
          // Amber border is visible on dark basemap; slate was effectively invisible.
          const constraintStroke = '#f59e0b';
          ensureConstraintHatch(map);

          const bindParcelInteractions = (layer: L.Layer) => {
            const popupContent = `
                <div style="min-width: 200px;">
                  <strong style="font-size: 14px;">${
                    parcel.parcelNumber || 'N/A'
                  }</strong>${parcel.bookmarked ? ' ★' : ''}<br/>
                  <strong>Owner:</strong> ${parcel.owner || 'N/A'}<br/>
                  <strong>${getStatusLabel()} Status:</strong> ${parcelStatus.replace(
              /_/g,
              ' '
            )}<br/>
                  ${
                    labelShorts
                      ? `<strong>Labels:</strong> ${labelShorts}<br/>`
                      : ''
                  }
                  ${
                    rightsSummary
                      ? `<strong style="color:#22d3ee">Existing rights:</strong> ${rightsSummary}<br/>`
                      : ''
                  }
                  ${
                    parcel.acreage
                      ? `<strong>Acreage:</strong> ${parcel.acreage}<br/>`
                      : ''
                  }
                  ${
                    parcel.county
                      ? `<strong>County:</strong> ${parcel.county}`
                      : ''
                  }
                  <div style="margin-top:6px;font-size:11px;opacity:0.8">Shift/Ctrl+click multi-select · ▢ box-select</div>
                </div>
              `;
            layer.bindPopup(popupContent);
            layer.bindTooltip(
              `<strong>${
                              parcel.easementNumber || parcel.parcelNumber || parcel.pin || 'Parcel'
                            }</strong>${parcel.bookmarked ? ' ★' : ''}<br/>${
                              parcel.easementNumber && (parcel.pin || parcel.parcelNumber)
                                ? `PIN ${parcel.pin || parcel.parcelNumber}<br/>`
                                : ''
                            }${parcel.owner || 'No owner'} · ${parcelStatus.replace(/_/g, ' ')}${
                              labelShorts ? ` · <span style="color:#f59e0b">${labelShorts}</span>` : ''
                            }${
                              rightsSummary ? ` · <span style="color:#22d3ee">${rightsSummary}</span>` : ''
                            }${parcel.acreage != null ? ` · ${parcel.acreage} ac` : ''}`,
              { sticky: true, opacity: 0.95, className: 'parcel-hover-tip' }
            );

            layer.on('click', (ev: L.LeafletMouseEvent) => {
              const orig = ev.originalEvent as MouseEvent | undefined;
              L.DomEvent.stopPropagation(ev);
              if (orig) {
                L.DomEvent.preventDefault(orig);
              }

              if (isMultiModifier(orig) && onMultiSelectChangeRef.current) {
                try {
                  layer.closePopup();
                } catch {
                  /* ignore */
                }
                const cur = multiSelectedRef.current || [];
                const next = toggleSelection(cur, parcel.id);
                onMultiSelectChangeRef.current(next);
                return;
              }

              try {
                layer.closePopup();
              } catch {
                /* ignore */
              }
              onMultiSelectChangeRef.current?.([]);
              if (onParcelClick) {
                onParcelClick(parcel.id);
              }
            });
          };

          // FeatureGroup so fill + hatch + outline all zoom/pan together (no stale path clones).
          const group = L.featureGroup();

          // 1) Status fill (no stroke)
          L.geoJSON(parcel.geometry, {
            style: () => ({
              color: statusColor,
              weight: 0,
              opacity: 0,
              fillOpacity: isFocus ? 0.55 : isMulti ? 0.45 : hasLabels ? 0.4 : 0.3,
              fillColor: statusColor,
              className: 'rf-parcel-fill',
            }),
            onEachFeature: (_f, layer) => bindParcelInteractions(layer),
          }).eachLayer((layer) => group.addLayer(layer));

          // 2) Hatch overlay — live Leaflet paths; CSS applies pattern fill
          if (hasLabels) {
            L.geoJSON(parcel.geometry, {
              style: () => ({
                color: 'transparent',
                weight: 0,
                fillOpacity: 1,
                fillColor: constraintStroke,
                className: 'rf-parcel-hatch',
                interactive: false,
              }),
              interactive: false,
            }).eachLayer((layer) => {
              group.addLayer(layer);
              // Ensure class sticks after Leaflet paints
              requestAnimationFrame(() => {
                const path = (layer as any)._path as SVGPathElement | undefined;
                if (path) {
                  path.classList.add('rf-parcel-hatch');
                  path.setAttribute('fill', 'url(#rf-hatch-amber)');
                  path.setAttribute('stroke', 'none');
                  path.style.pointerEvents = 'none';
                }
              });
            });
          }

          // 3) Outline (amber dashed when labeled)
          L.geoJSON(parcel.geometry, {
            style: () => ({
              color: isMulti ? '#fbbf24' : hasLabels ? constraintStroke : statusColor,
              weight: isMulti ? 3.5 : hasLabels ? (isFocus ? 4 : 3) : isFocus ? 3.5 : 2,
              opacity: 1,
              fillOpacity: 0,
              fillColor: 'transparent',
              dashArray: hasLabels && !isMulti ? '10 5' : undefined,
              className: hasLabels ? 'rf-parcel-constraint' : 'rf-parcel-outline',
            }),
            onEachFeature: (_f, layer) => bindParcelInteractions(layer),
          }).eachLayer((layer) => group.addLayer(layer));

          // 4) Existing rights highlight (cyan dashed) — also on Existing rights overlay group
          if (hasExistingRights) {
            L.geoJSON(parcel.geometry, {
              style: () => ({
                color: '#22d3ee',
                weight: isFocus ? 4 : 3,
                opacity: 1,
                fillColor: '#22d3ee',
                fillOpacity: 0.14,
                dashArray: '8 5',
                className: 'rf-existing-right',
              }),
              onEachFeature: (_f, layer) => bindParcelInteractions(layer),
            }).eachLayer((layer) => {
              group.addLayer(layer);
              erGroup?.addLayer(
                L.geoJSON(parcel.geometry as any, {
                  style: () => ({
                    color: '#22d3ee',
                    weight: 3,
                    opacity: 0.95,
                    fillColor: '#22d3ee',
                    fillOpacity: 0.18,
                    dashArray: '8 5',
                    className: 'rf-existing-right',
                  }),
                  onEachFeature: (_f, lyr) => {
                    lyr.bindPopup(
                      `<div style="min-width:180px"><strong>Existing rights</strong><br/>${
                        parcel.pin || parcel.parcelNumber || parcel.id
                      }<br/>${rightsSummary}</div>`
                    );
                  },
                })
              );
            });
          }

          group.addTo(map);
          markersRef.current[parcel.id] = group as any;

          const layerBounds = group.getBounds();
          if (layerBounds.isValid()) {
            bounds.push(layerBounds);
          }
        } catch (error) {
          console.error('Error rendering parcel geometry:', error);
        }
      }
    });

    // Instrument corridor geometries (when stored)
    (existingRights || []).forEach((er) => {
      if (!er.geometry || !erGroup) return;
      try {
        const title = er.instrumentNumber
          ? `#${er.instrumentNumber}`
          : er.name || 'Existing right';
        const pins = (er.parcels || []).length;
        L.geoJSON(er.geometry as any, {
          style: () => ({
            color: '#a78bfa',
            weight: 4,
            opacity: 0.95,
            fillColor: '#a78bfa',
            fillOpacity: 0.2,
            dashArray: '2 6',
          }),
          onEachFeature: (_f, layer) => {
            layer.bindPopup(
              `<div style="min-width:200px"><strong>${title}</strong><br/>${
                er.rightType || ''
              } · ${er.purpose || ''}<br/>${er.lifeStatus || ''}<br/>Linked parcels: ${pins}</div>`
            );
          },
        }).eachLayer((layer) => erGroup.addLayer(layer));
      } catch (e) {
        console.error('existing right geometry', e);
      }
    });

    // Fit bounds only when parcels set or primary selection changes —
    // NOT on multi-select toggles (that felt jumpy / "funny").
    const parcelsKey = parcels.map((p) => p.id).join(',');
    const prevKey = (controlsRef.current as any)._parcelsFitKey as string | undefined;
    const prevSel = (controlsRef.current as any)._selectedFitId as string | null | undefined;
    const parcelsChanged = prevKey !== parcelsKey;
    const selectionChanged = prevSel !== selectedParcelId;

    if (selectedParcelId && markersRef.current[selectedParcelId] && (selectionChanged || parcelsChanged)) {
      const sel = markersRef.current[selectedParcelId] as any;
      if (sel?.getBounds) {
        const b = sel.getBounds();
        if (b.isValid()) {
          map.fitBounds(b, { padding: [48, 48], maxZoom: 17 });
        }
      }
      (controlsRef.current as any)._selectedFitId = selectedParcelId;
      (controlsRef.current as any)._parcelsFitKey = parcelsKey;
    } else if (!selectedParcelId && bounds.length > 0 && parcelsChanged) {
      const group = L.featureGroup(
        Object.values(markersRef.current).filter((m: any) => typeof m.getBounds === 'function') as any
      );
      const gb = group.getBounds();
      if (gb.isValid()) {
        map.fitBounds(gb, { padding: [50, 50] });
      }
      (controlsRef.current as any)._selectedFitId = null;
      (controlsRef.current as any)._parcelsFitKey = parcelsKey;
    } else {
      (controlsRef.current as any)._parcelsFitKey = parcelsKey;
      (controlsRef.current as any)._selectedFitId = selectedParcelId ?? null;
    }
  }, [parcels, selectedParcelId, onParcelClick, activeStatusTab, hiddenStatuses, existingRights, multiSelectedIds]);

  // Lightweight style refresh when selection changes (avoids full rebuild flicker)
  useEffect(() => {
    if (!mapRef.current) return;
    const constraintStroke = '#f59e0b';
    Object.entries(markersRef.current).forEach(([id, layer]) => {
      const parcel = parcelsRef.current.find((p) => p.id === id);
      if (!parcel) return;
      const parcelStatus = getParcelStatus(parcel) || 'NOT_STARTED';
      const statusColor = getStatusColor(parcelStatus);
      const isMulti = (multiSelectedIds || []).includes(id);
      const isFocus = selectedParcelId === id;
      const hasLabels = (parcel.labels || []).length > 0;

      const applyToPathLayer = (sub: any, role: 'fill' | 'hatch' | 'outline' | 'unknown') => {
        if (!sub?.setStyle) return;
        if (role === 'fill') {
          sub.setStyle({
            color: statusColor,
            weight: 0,
            opacity: 0,
            fillOpacity: isFocus ? 0.55 : isMulti ? 0.45 : hasLabels ? 0.4 : 0.3,
            fillColor: statusColor,
          });
        } else if (role === 'hatch') {
          sub.setStyle({
            color: 'transparent',
            weight: 0,
            fillOpacity: 1,
            fillColor: constraintStroke,
          });
          requestAnimationFrame(() => {
            const path = sub._path as SVGPathElement | undefined;
            if (path) {
              path.classList.add('rf-parcel-hatch');
              path.setAttribute('fill', 'url(#rf-hatch-amber)');
              path.setAttribute('stroke', 'none');
              path.style.pointerEvents = 'none';
            }
          });
        } else if (role === 'outline') {
          sub.setStyle({
            color: isMulti ? '#fbbf24' : hasLabels ? constraintStroke : statusColor,
            weight: isMulti ? 3.5 : hasLabels ? (isFocus ? 4 : 3) : isFocus ? 3.5 : 2,
            opacity: 1,
            fillOpacity: 0,
            fillColor: 'transparent',
            dashArray: hasLabels && !isMulti ? '10 5' : undefined,
          });
        }
      };

      if (layer instanceof L.FeatureGroup || layer instanceof L.LayerGroup) {
        (layer as L.FeatureGroup).eachLayer((sub: any) => {
          const cn = String(sub.options?.className || '');
          if (cn.includes('rf-parcel-hatch')) applyToPathLayer(sub, 'hatch');
          else if (cn.includes('rf-parcel-constraint') || cn.includes('rf-parcel-outline'))
            applyToPathLayer(sub, 'outline');
          else applyToPathLayer(sub, 'fill');
        });
      } else if (layer instanceof L.GeoJSON) {
        applyToPathLayer(layer, hasLabels ? 'outline' : 'fill');
      }
    });
  }, [multiSelectedIds, selectedParcelId, activeStatusTab]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <Box
        ref={mapContainerRef}
        sx={{
          position: 'absolute',
          inset: 0,
          '& .leaflet-container': {
            height: '100%',
            width: '100%',
          },
        }}
      />
    </Box>
  );
}

// Helper function to get color based on parcel status
// Removed duplicate getStatusColor - now using centralized version from @/lib/constants
