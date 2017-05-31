var demo = new Vue({
  el: "#vue-map",
  data: {
    options: {
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: new google.maps.LatLng(38.8225, 9.1406)
    },
    map: "",
    zoomTreshold: 4,
    radiusTreshold: 400000, // in meters
    locations: [
      { lat: 36.0845, lng: -79.4209 },  //BFP
      { lat: 34.9885, lng: -79.2408 },  //Raeford
      { lat: 18.8601, lng: -98.8808 },  //Mexico
      { lat: 30.7917, lng: 120.7722 }   //Jiaxing
    ],
    visibleMarkers: [],
    noVisibleMarkers: false,
    markers: [],
    infoWindow: "",
    currentZoom: 0,
    currentLocation: ""
  },
  watch: {
    locations: function(val) {
      this.deleteMarkers();
      this.createMarkers();
    }
  },
  methods: {
    createMarkers: function() {
      var self = this;
      this.markers = this.locations.map(function(location, i) {
        var infoWindowContent =
          "<h2> Marker n. " +
          i +
          "</h2>" +
          "<br />" +
          "<p>lat: " +
          location.lat +
          "<br />lng: " +
          location.lng +
          "</p>";
        var marker = new google.maps.Marker({
          position: location,
          name: "Marker n. " + i,
          info: infoWindowContent,
          id: i + 1
        });
        google.maps.event.addListener(marker, "click", function() {
          self.infoWindow.setContent(this.info);
          self.infoWindow.open(self.map, this);
        });
        return marker;
      });
      new MarkerClusterer(this.map, this.markers, {
        imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m"
      });
    },
    deleteMarkers() {
      for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
      }
      this.markers = [];
    },
    getVisibleMarkers: function() {
      var self = this;
      google.maps.event.addListener(self.map, "idle", function() {
        self.noVisibleMarkers = false;

        // Read the bounds of the map being displayed.
        bounds = self.map.getBounds();

        // delete previously added items
        self.visibleMarkers = [];

        // Iterate through all of the markers that are displayed on the *entire* map.
        for (var i = 0; i < self.markers.length; i++) {
          currentMarker = self.markers[i];

          /* If the current marker is visible within the bounds of the current map,
           * let's add it as a list item to #nearby-results that's located above
           * this script.
           */
          if (bounds.contains(currentMarker.getPosition())) {
            /* Only add a list item if it doesn't already exist. This is so that
             * if the browser is resized or the tablet or phone is rotated, we don't
             * have multiple results.
             */

            self.visibleMarkers.push(currentMarker);
          }
        }
      });

      console.log(this.noVisibleMarkers);
    },
    getInvisibleMarkersInTresholdRadius: function() {
      // TODO: maybe find a less expensive way?
      var center = this.currentLocation.position ? this.currentLocation.position : this.map.center;
      for (var i = 0; i < this.markers.length; i++) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(
          center,
          this.markers[i].position
        );
        if (distance < this.radiusTreshold) {
          this.visibleMarkers.push(this.markers[i]);
        }
      }
    },
    initAutocomplete: function() {
      var self = this;
      var autocompleteInput = document.getElementById("autocompleteInput");
      var autocomplete = new google.maps.places.Autocomplete(autocompleteInput);
      autocomplete.addListener("place_changed", function() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          // User entered the name of a Place that was not suggested and
          // pressed the Enter key, or the Place Details request failed.
          window.alert("No details available for input: '" + place.name + "'");
          return;
        } else {
          if (self.currentLocation) {
            self.currentLocation.setMap(null);
          }
          self.currentLocation = new google.maps.Marker({
            position: place.geometry.location,
            id: "currentLocation",
            icon: "https://mt.googleapis.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=0288D1&scale=2.0",
            map: self.map
          });
        }
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
          self.map.fitBounds(place.geometry.viewport);
        } else {
          self.map.setCenter(place.geometry.location);
          self.map.setZoom(17); // Why 17? Because it looks good.
        }
      });
    },
    getCurrentZoom: function() {
      var self = this;
      google.maps.event.addListener(self.map, "idle", function() {
        self.currentZoom = self.map.zoom;
      });
    },
    centerMapToMarker: function(e) {
      var id = e.target.dataset.id;
      for (var i = 0; i < this.visibleMarkers.length; i++) {
        if (this.visibleMarkers[i].id == id) {
          var thisMarker = this.visibleMarkers[i];
          // open info window above marker
          // this.infoWindow.setContent(thisMarker.info);
          // this.infoWindow.open(this.map, thisMarker);
          // pan map to the marker

          this.map.panTo(thisMarker.getPosition());
          this.map.setZoom(17);

          return false;
        }
      }
    }
  },
  mounted: function() {
    this.map = new google.maps.Map(
      document.getElementById("map_canvas"),
      this.options
    );
    this.createMarkers();
    this.getVisibleMarkers();
    this.infoWindow = new google.maps.InfoWindow({ content: "" });
    this.initAutocomplete();
    this.getCurrentZoom();
  }
});
