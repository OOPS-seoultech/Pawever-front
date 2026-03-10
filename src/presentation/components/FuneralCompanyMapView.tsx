import { memo, useMemo } from 'react';

import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type FuneralCompanyMapMarker = {
  id: number;
  isBlocked: boolean;
  isSaved: boolean;
  label: string;
  latitude: number;
  longitude: number;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type FuneralCompanyMapViewProps = {
  markers: FuneralCompanyMapMarker[];
  onLayout?: (event: LayoutChangeEvent) => void;
  onPressMarker: (companyId: number) => void;
  selectedCompanyId: number | null;
  style?: StyleProp<ViewStyle>;
  userCoordinates: Coordinates;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildMapHtml = (
  markers: FuneralCompanyMapMarker[],
  selectedCompanyId: number | null,
  userCoordinates: Coordinates,
) => {
  const markerPayload = JSON.stringify(markers.map(marker => ({
    ...marker,
    label: escapeHtml(marker.label),
  })));
  const userPayload = JSON.stringify(userCoordinates);
  const selectedPayload = JSON.stringify(selectedCompanyId);

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html,
      body,
      #map {
        background: #eae4d9;
        height: 100%;
        margin: 0;
        overflow: hidden;
        padding: 0;
        width: 100%;
      }

      .leaflet-control-container {
        display: none;
      }

      .leaflet-pane,
      .leaflet-top,
      .leaflet-bottom,
      .leaflet-control {
        z-index: 1 !important;
      }

      .company-marker-wrapper {
        align-items: center;
        display: flex;
        flex-direction: column;
      }

      .company-pin {
        align-items: center;
        background: #ffffff;
        border: 1.4px solid #dad3cb;
        border-radius: 18px 18px 18px 0;
        box-shadow: 0 8px 18px rgba(53, 38, 34, 0.12);
        display: flex;
        height: 34px;
        justify-content: center;
        position: relative;
        transform: rotate(-45deg);
        width: 34px;
      }

      .company-pin::after {
        background: inherit;
        border-bottom: inherit;
        border-left: inherit;
        border-radius: 0 0 0 6px;
        bottom: -5px;
        content: '';
        height: 10px;
        left: 4px;
        position: absolute;
        width: 10px;
      }

      .company-pin.saved {
        background: #ffa94e;
        border-color: #ffa94e;
      }

      .company-pin.blocked {
        background: #f3f0ec;
        border-color: #d6d1ca;
        opacity: 0.8;
      }

      .company-pin.selected {
        box-shadow: 0 10px 24px rgba(253, 126, 20, 0.28);
      }

      .company-pin-core {
        align-items: center;
        background: #ffffff;
        border: 1.5px solid #6d625b;
        border-radius: 999px;
        display: flex;
        height: 14px;
        justify-content: center;
        transform: rotate(45deg);
        width: 14px;
      }

      .company-pin.saved .company-pin-core {
        border-color: #ffffff;
      }

      .company-pin-core::after {
        background: #6d625b;
        border-radius: 999px;
        content: '';
        height: 4px;
        width: 4px;
      }

      .company-pin.saved .company-pin-core::after {
        background: #ffffff;
      }

      .company-pin.blocked .company-pin-core,
      .company-pin.blocked .company-pin-core::after {
        border-color: #bdb6af;
        background: #bdb6af;
      }

      .company-label {
        align-items: center;
        background: #ffffff;
        border: 1px solid #c9c2bb;
        border-radius: 10px;
        color: #4f433d;
        display: inline-flex;
        font-size: 12px;
        font-weight: 700;
        justify-content: center;
        line-height: 1;
        margin-top: 8px;
        min-height: 24px;
        min-width: 54px;
        padding: 0 11px;
        white-space: nowrap;
      }

      .company-label.saved {
        background: #ffa94e;
        border-color: #ffa94e;
        color: #ffffff;
      }

      .company-label.blocked {
        background: #f7f4f1;
        border-color: #ddd6cf;
        color: #b4aea8;
      }

      .user-marker {
        background: rgba(255, 169, 78, 0.16);
        border: 2px solid rgba(255, 169, 78, 0.92);
        border-radius: 999px;
        box-shadow: 0 0 0 6px rgba(255, 169, 78, 0.1);
        height: 16px;
        width: 16px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const markers = ${markerPayload};
      const selectedCompanyId = ${selectedPayload};
      const userCoordinates = ${userPayload};

      const map = L.map('map', {
        attributionControl: false,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const bounds = [];

      const userMarker = L.marker([userCoordinates.latitude, userCoordinates.longitude], {
        icon: L.divIcon({
          className: '',
          html: '<div class="user-marker"></div>',
          iconAnchor: [8, 8],
          iconSize: [16, 16],
        }),
      });

      userMarker.addTo(map);
      bounds.push([userCoordinates.latitude, userCoordinates.longitude]);

      markers.forEach(marker => {
        const isSelected = marker.id === selectedCompanyId;
        const markerHtml = [
          '<div class="company-marker-wrapper">',
          '<div class="company-pin ' +
            (marker.isSaved ? 'saved ' : '') +
            (marker.isBlocked ? 'blocked ' : '') +
            (isSelected ? 'selected' : '') +
            '"><div class="company-pin-core"></div></div>',
          '<div class="company-label ' +
            (marker.isSaved ? 'saved ' : '') +
            (marker.isBlocked ? 'blocked ' : '') +
            '">' + marker.label + '</div>',
          '</div>',
        ].join('');

        const leafletMarker = L.marker([marker.latitude, marker.longitude], {
          icon: L.divIcon({
            className: '',
            html: markerHtml,
            iconAnchor: [23, 48],
            iconSize: [80, 72],
          }),
        });

        leafletMarker.on('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            companyId: marker.id,
            type: 'markerPress',
          }));
        });

        leafletMarker.addTo(map);
        bounds.push([marker.latitude, marker.longitude]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 11);
      } else {
        map.fitBounds(bounds, {
          padding: [32, 32],
        });
      }
    </script>
  </body>
</html>`;
};

function FuneralCompanyMapViewComponent({
  markers,
  onLayout,
  onPressMarker,
  selectedCompanyId,
  style,
  userCoordinates,
}: FuneralCompanyMapViewProps) {
  const html = useMemo(
    () => buildMapHtml(markers, selectedCompanyId, userCoordinates),
    [markers, selectedCompanyId, userCoordinates],
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as {
        companyId?: number;
        type?: string;
      };

      if (payload.type === 'markerPress' && typeof payload.companyId === 'number') {
        onPressMarker(payload.companyId);
      }
    } catch {
      // Ignore malformed bridge messages from the embedded map.
    }
  };

  return (
    <View onLayout={onLayout} style={[styles.root, style]}>
      <WebView
        javaScriptEnabled
        nestedScrollEnabled={false}
        onMessage={handleMessage}
        originWhitelist={['*']}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        source={{ html }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: '#EAE4D9',
    flex: 1,
  },
});

export const FuneralCompanyMapView = memo(FuneralCompanyMapViewComponent);
