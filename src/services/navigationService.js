class NavigationService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.map = null;
    this.navigation = null;
  }

  async initialize(container, center) {
    try {
      // Load Google Maps script if not already loaded
      if (!window.google || !window.google.maps) {
        await this.loadGoogleMapsScript();
      }

      this.map = new window.google.maps.Map(container, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom: 14,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
        ],
        mapTypeControl: false,
        fullscreenControl: false,
      });

      // Add custom controls
      this.addNavigationControl();
      this.addGeolocationControl();

      console.log('Map initialized successfully');
      return this.map;
    } catch (error) {
      console.error('Map initialization failed:', error);
    }
  }

  loadGoogleMapsScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  addNavigationControl() {
    const navigationControl = document.createElement('div');
    navigationControl.className = 'custom-map-control';
    navigationControl.style.cssText = `
      background-color: white;
      border-radius: 2px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      margin: 10px;
      padding: 5px;
    `;

    const zoomInButton = this.createControlButton('+');
    const zoomOutButton = this.createControlButton('-');

    zoomInButton.addEventListener('click', () => {
      this.map.setZoom(this.map.getZoom() + 1);
    });

    zoomOutButton.addEventListener('click', () => {
      this.map.setZoom(this.map.getZoom() - 1);
    });

    navigationControl.appendChild(zoomInButton);
    navigationControl.appendChild(zoomOutButton);

    this.map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(navigationControl);
  }

  addGeolocationControl() {
    const locationButton = document.createElement('button');
    locationButton.className = 'custom-map-control';
    locationButton.innerHTML = '📍';
    locationButton.style.cssText = `
      background-color: white;
      border: none;
      border-radius: 2px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      cursor: pointer;
      margin: 10px;
      padding: 10px;
      font-size: 18px;
    `;

    locationButton.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            this.map.setCenter(pos);
          },
          () => {
            console.error('Error: The Geolocation service failed.');
          }
        );
      } else {
        console.error('Error: Your browser doesn\'t support geolocation.');
      }
    });

    this.map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
  }

  createControlButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 18px;
      padding: 5px 10px;
      display: block;
      width: 100%;
      text-align: center;
      &:hover {
        color: #333;
      }
    `;
    return button;
  }
}

export default NavigationService;
