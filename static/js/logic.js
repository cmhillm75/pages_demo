let newYorkCoords = [40.73, -74.0059];
let mapZoomLevel = 12;

// Colors for different station statuses
const colors = {
  comingSoon: 'blue',
  emptyStations: 'red',
  outOfOrder: 'purple',
  lowStations: 'yellow',
  healthyStations: 'green'
};

// Create the createMap function.
function createMap(layers) {
  // Create the tile layer that will be the background of our map.
  let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Create a baseMaps object to hold the streetmap layer.
  let baseMaps = {
    "Street Map": streetmap
  };

  // Create an overlayMaps object to hold the layers.
  let overlayMaps = {
    "Coming Soon": layers.comingSoon,
    "Empty Stations": layers.emptyStations,
    "Out of Order": layers.outOfOrder,
    "Low Stations": layers.lowStations,
    "Healthy Stations": layers.healthyStations
  };

  // Create the map object with options.
  let map = L.map("map-id", {
    center: newYorkCoords,
    zoom: mapZoomLevel,
    layers: [streetmap, layers.healthyStations] // Default to show healthy stations
  });

  // Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(map);
}

// Create the createMarkers function.
function createMarkers(stations, statuses) {
  // Initialize layer groups for different station statuses.
  let layers = {
    comingSoon: L.layerGroup(),
    emptyStations: L.layerGroup(),
    outOfOrder: L.layerGroup(),
    lowStations: L.layerGroup(),
    healthyStations: L.layerGroup()
  };

  // Loop through the stations array.
  stations.forEach((station) => {
    // Find the corresponding status for each station.
    let stationStatus = statuses.find(status => status.station_id === station.station_id);

    // Determine the layer group and color for the station based on its status.
    let layerGroup;
    let color;
    if (!stationStatus.is_installed) {
      layerGroup = layers.comingSoon;
      color = colors.comingSoon;
    } else if (stationStatus.is_installed && !stationStatus.is_renting) {
      layerGroup = layers.outOfOrder;
      color = colors.outOfOrder;
    } else if (stationStatus.num_bikes_available === 0) {
      layerGroup = layers.emptyStations;
      color = colors.emptyStations;
    } else if (stationStatus.num_bikes_available < 5) {
      layerGroup = layers.lowStations;
      color = colors.lowStations;
    } else {
      layerGroup = layers.healthyStations;
      color = colors.healthyStations;
    }

    // Create a circle marker for the station with the appropriate color.
    let bikeMarker = L.circleMarker([station.lat, station.lon], {
      color: color,
      radius: 10,
      fillOpacity: 0.75
    }).bindPopup("<h3>" + station.name + "</h3><h3>Capacity: " + station.capacity + "</h3><h3>Bikes Available: " + stationStatus.num_bikes_available + "</h3>");

    // Add the marker to the appropriate layer group.
    layerGroup.addLayer(bikeMarker);
  });

  // Pass the layer groups to the createMap function.
  createMap(layers);
}

// Perform an API call to the Citi Bike API to get the station information and statuses.
d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json").then(function(stationResponse) {
  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json").then(function(statusResponse) {
    // Call createMarkers with both station information and statuses.
    createMarkers(stationResponse.data.stations, statusResponse.data.stations);
  });
});
