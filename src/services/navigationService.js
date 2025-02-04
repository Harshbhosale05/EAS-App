class NavigationService {
  constructor(apiKey) {
    if (!window.OlaMaps) {
      console.error('OlaMaps SDK not loaded');
      return;
    }
    this.OlaMaps = window.OlaMaps;
    this.apiKey = apiKey;
    this.map = null;
    this.navigation = null;
  }

  async initialize(container, center) {
    if (!this.OlaMaps) {
      console.error('OlaMaps SDK not loaded');
      return;
    }
    try {
      const olaMaps = new this.OlaMaps({
        apiKey: this.apiKey,
        mode: '2d',
        voiceInstructions: true,
        trafficView: true,
        etaView: true
      });

      this.map = await olaMaps.init({
        container,
        center: [center.longitude, center.latitude],
        zoom: 14,
        style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
        routePreviewOptions: {
          showTraffic: true,
          showAlternativeRoutes: true,
          enableSoftTurnArrowState: true,
          showTimeMarkerView: true
        }
      });

      // Add custom controls
      this.map.addControl(new this.OlaMaps.NavigationControl());
      this.map.addControl(new this.OlaMaps.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }));

      console.log('Map initialized successfully');
      return this.map;
    } catch (error) {
      console.error('Map initialization failed:', error);
    }
  }

  // ...existing code...
}

export default NavigationService;
