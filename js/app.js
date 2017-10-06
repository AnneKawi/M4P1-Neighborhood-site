/* var Cat1 = {
    name: 'Kitty',
    picURL: "img/22252709_010df3379e_z.jpg",
    nickNames: ['Penny', 'Tiger', 'CAT'],
    clicks: 0,
    };
var Cat2 = {
    name: 'Merry',
    picURL: "img/cat-1192026_960_720.jpg",
    nickNames: ['Funnycat'],
    clicks: 0,
    };
var Cat3 = {
    name: 'Bella',
    picURL: "img/cat-323262__340.jpg",
    nickNames: ['Belle'],
    clicks: 0,
    };
var Cat4 = {
    name: 'Cherry',
    picURL: "img/cat-2083492__340.jpg",
    nickNames: ['Kirsche'],
    clicks: 0,
    };
var Cat5 = {
    name: 'Sleepy',
    picURL: "img/cat-1634369__340.jpg",
    nickNames: ['Zzzzz'],
    clicks: 0,
    };

var initialCats = [Cat1, Cat2, Cat3, Cat4, Cat5];

//KnockoutJS-Bereich mit der Einzelkatze und dem View-Model zum Data-Handling
var Cat = function(data) {
    this.clickCount = ko.observable(data.clicks);
    this.name = ko.observable(data.name);
    this.nickNames = ko.observableArray(data.nickNames);
    this.imgSrc = ko.observable(data.picURL);

    this.catLevel = ko.computed(function() {
            if (this.clickCount() < 4) {
                return 'Newborn';
            } else if (this.clickCount() < 10) {
                return 'Kitten';
            } else if (this.clickCount() >= 10) {
                return 'Cat';
            };
        }, this);

};

var ViewModel = function() {
    var self = this; //pointer zum viewModel, selbst wenn man im HTMl den this-context mit "with: ... " ändert (Bsp: with:currentCat => this ist dann innerhalb der currentCat(), was arg verwirrend werden kann)

    self.catList = ko.observableArray([]); // würde ich direkt das initialCats-Array reingeben, hätte ich nur einfache Objekte aber keine ko.observables,

    initialCats.forEach(function(catItem) { // => daher alle erst mal als Cat() implementieren und dann ab ins array (und immer schön aufpassen, den self-pointer zu nutzen um im Original-View-Model zu bleiben)
        self.catList.push(new Cat(catItem));
    });

    self.currentCat = ko.observable(self.catList()[0]);

    self.setCurrentCat = function(clickedCat) {
        self.currentCat(clickedCat);
        };

    self.incrementCounter = function() {
        self.currentCat().clickCount(self.currentCat().clickCount() + 1);
        };

};

ko.applyBindings(new ViewModel()) // hiermit werden die data-binds im HTML mit dem ViewModel verbunden und KnockoutJS kümmert sich jetzt um die Aktualisierung der Anzeige
*/
var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];

// Several Tourist-Must-Sees in Dresden and the Marker for the Main Station.
// Normally they'd be in a database instead.
var locations = [
  {title: 'Frauenkirche Dresden', location: {lat: 51.051873, lng: 13.741522}},
  {title: 'Zwinger Dresden', location: {lat:  51.053368, lng: 13.734677}},
  {title: 'Semper Opera House Dresden', location: {lat:  51.054226, lng: 13.735539}},
  {title: 'Palais Großer Garten Dresden', location: {lat: 51.037879, lng: 13.762844}},
  {title: 'Dresden Main Station', location: {lat: 51.040163, lng: 13.73224}},
];

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 51.050409, lng: 13.737262},
      zoom: 13,
      mapTypeControl: false
    });

    // This autocomplete is for use in the geocoder entry box.
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));
    // Bias the boundaries within the map for the zoom to area text.
    zoomAutocomplete.bindTo('bounds', map);
    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map.
    searchBox.setBounds(map.getBounds());


    var largeInfowindow = new google.maps.InfoWindow();

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('aae623');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
      // Get the position from the location array.
      var position = locations[i].location;
      var title = locations[i].title;
      // Create a marker per location, and put into markers array.
      var marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i
      });
      // Push the marker to our array of markers.
      markers.push(marker);
      // Create an onclick event to open the large infowindow at each marker.
      marker.addListener('click', function() {
        populateInfoWindow(this, largeInfowindow);
      });
      // Two event listeners - one for mouseover, one for mouseout,
      // to change the colors back and forth.
      marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
      });
      marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
      });
    }
    document.getElementById('show-listings').addEventListener('click', showListings);

    document.getElementById('hide-listings').addEventListener('click', function() {
      hideMarkers(markers);
    });

    document.getElementById('zoom-to-area').addEventListener('click', function() {
      zoomToArea();
    });

    // Listen for the event fired when the user selects a prediction from the
    // picklist and retrieve more details for that place.
    searchBox.addListener('places_changed', function() {
      searchBoxPlaces(this);
    });

    // Listen for the event fired when the user selects a prediction and clicks
    // "go" more details for that place.
    document.getElementById('go-places').addEventListener('click', textSearchPlaces);

}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      // Clear the infowindow content to give the streetview time to load.
      infowindow.setContent('');
      infowindow.marker = marker;
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
      var streetViewService = new google.maps.StreetViewService();
      var radius = 50;
      // In case the status is OK, which means the pano was found, compute the
      // position of the streetview image, then calculate the heading, then get a
      // panorama from that and set the options
      function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
          var nearStreetViewLocation = data.location.latLng;
          var heading = google.maps.geometry.spherical.computeHeading(
            nearStreetViewLocation, marker.position);
            infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
            var panoramaOptions = {
              position: nearStreetViewLocation,
              pov: {
                heading: heading,
                pitch: 30
              }
            };
          var panorama = new google.maps.StreetViewPanorama(
            document.getElementById('pano'), panoramaOptions);
        } else {
          infowindow.setContent('<div>' + marker.title + '</div>' +
            '<div>No Street View Found</div>');
        }
      }
      // Use streetview service to get the closest streetview image within
      // 50 meters of the markers position
      streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
      // Open the infowindow on the correct marker.
      infowindow.open(map, marker);
    }
}

// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
}

// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    var address = document.getElementById('zoom-to-area-text').value;
    // Make sure the address isn't blank.
    if (address == '') {
      window.alert('You must enter an area, or address.');
    } else {
      // Geocode the address/area entered to get the center. Then, center the map
      // on it and zoom in
      geocoder.geocode(
        { address: address,
          componentRestrictions: {locality: 'New York'}
        }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(15);
          } else {
            window.alert('We could not find that location - try entering a more' +
                ' specific place.');
          }
        });
      }
}

// This function fires when the user selects a searchbox picklist item.
// It will do a nearby search using the selected query string or place.
function searchBoxPlaces(searchBox) {
    hideMarkers(placeMarkers);
    var places = searchBox.getPlaces();
    if (places.length == 0) {
      window.alert('We did not find any places matching that search!');
    } else {
    // For each place, get the icon, name and location.
      createMarkersForPlaces(places);
    }
}

// This function firest when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces() {
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
      query: document.getElementById('places-search').value,
      bounds: bounds
    }, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        createMarkersForPlaces(results);
      }
    });
}

// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
      var place = places[i];
      var icon = {
        url: place.icon,
        size: new google.maps.Size(35, 35),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 34),
        scaledSize: new google.maps.Size(25, 25)
      };
      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      });
      // Create a single infowindow to be used with the place details information
      // so that only one is open at once.
      var placeInfoWindow = new google.maps.InfoWindow();
      // If a marker is clicked, do a place details search on it in the next function.
      marker.addListener('click', function() {
        if (placeInfoWindow.marker == this) {
          console.log("This infowindow already is on this marker!");
        } else {
          getPlacesDetails(this, placeInfoWindow);
        }
      });
      placeMarkers.push(marker);
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    }
    map.fitBounds(bounds);
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
    placeId: marker.id
    }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again.
      infowindow.marker = marker;
      var innerHTML = '<div>';
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        innerHTML += '<br><br><strong>Hours:</strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
    }
    });
}

