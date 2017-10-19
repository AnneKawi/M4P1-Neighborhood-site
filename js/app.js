/*
    **** Neighborhood-Map-Project *****
    ****** Welcome to Dresden *********

This code is meant to display a google map centered on Dresden in Germany. On it there are five locations to be displayed, marked with markers.
* Clicking the markers or the location names at the sidebar of the webpage makes the corresponding marker bounce and tries to fetch an extract of the wikipedia-description of the location.
* the locations may be filtered on the sidebar, they may all be hidden and all be shown by clicking on the corresponding buttons

*/

var map;
var infoWindow;
var searchBox;

// a single Place Marker to keep Track of them and whether it is shown
var PlaceMarker = function(data, defIcon, hiIcon) {
    self = this;
    self.location = data.location;
    self.title = data.title;
    self.type = data.type;
    self.visible = ko.observable(true);
    self.wikipageid = ko.observable(null);

    // Create a marker per location, and put into markers array.
    self.marker = new google.maps.Marker({
        position: self.location,
        title: self.title,
        animation: google.maps.Animation.DROP,
        icon: defIcon
    });

    //fetch and return the wikipedia-PageID for the marker
    self.getThisWikiPageID = function(self) {
        if (self.wikipageid() === null) {
            getWikiPageId(self);
        }
        return self.wikipageid();
    };

    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    self.marker.addListener('mouseover', function() {
        this.setIcon(hiIcon);
        });

    self.marker.addListener('mouseout', function() {
        this.setIcon(defIcon);
        });

    // funcions to show and hide the marker of this PlaceMarker
    self.showMarker = function(self) {
        self.marker.setMap(map);
    };

    self.hideMarker = function(self) {
        self.marker.setMap(null);
    };

};

// the View model to handle locations markers and whatever else need handling
var ViewModel = function() {
    var self = this;

    // Create placemarkers array to use in multiple functions to have control
    // over the number of places that show.
    self.placeMarkers = ko.observableArray([]);
    // keep an eye on the currently selected location type to be displayed
    self.currentMarkerType = ko.observable();
    // var to be able to hide all the markers at once
    self.hideMarkers = false;

    //preparing Marker-Shapes
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('aae623');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // initialising the PlaceMarkers
    locations.forEach(function(placeItem) {
        self.placeMarkers.push(new PlaceMarker(placeItem, defaultIcon, highlightedIcon));
    });

    // Create an onclick event to open the large infowindow at each marker.
    self.placeMarkers().forEach(function(markerItem) {
        markerItem.marker.addListener('click', function(marker) {
            pageid = markerItem.getThisWikiPageID(markerItem);
            // if pageid cannot be retrieved straight away, put a subscription on the marker to display the extract connected to the pageid, whenever wikipedia responds with the value
            if (pageid === null) {
                markerItem.subcription = markerItem.wikipageid.subscribe(function(newpageid) {populateInfoWindow(markerItem.marker, newpageid);});
            }
            bounceMarker(markerItem.marker);
            populateInfoWindow(markerItem.marker, pageid);
             });
        });

    // create the marker-types array (ready to react to new location entries, though that functionality is not provided in this map)
    self.markerTypes = ko.computed(function() {
        array = [];
        self.placeMarkers().forEach(function(marker) {
            if (!array.includes(marker.type)) {
                array.push(marker.type);
                }
            });
        return array;
    });

    // set alle the markers to visible
    self.showAllListings = function() {
        self.hideMarkers = false;
        self.currentMarkerType(null);
    };

    // This function will loop through the markers array, display the visible ones and hide the rest
    self.showListings = function() {
        var bounds = new google.maps.LatLngBounds();
        var count = 0;
        // Extend the boundaries of the map for each marker and display the marker
        self.placeMarkers().forEach(function(markerItem) {
            if (markerItem.visible() && !self.hideMarkers) {
                markerItem.showMarker(markerItem);
                bounds.extend(markerItem.marker.position);
                count += 1;
            } else {
                markerItem.hideMarker(markerItem);
            }
        });
        if (count > 0) {map.fitBounds(bounds);}
        // correct zoom to not zoom in more than necessary (customers may do that if they like later)
        if (map.getZoom() > 16) {
            map.setZoom(16);
            }
    };

    // This function will loop through the listings and hide them all, afterwards resetting the hide value, so that markers may be filtered and shown again
    self.hideAllMarkers = function() {
        self.hideMarkers = true;
        self.currentMarkerType(null);
        self.hideMarkers = false;
    };

    // Handling and showing the Marker that was clicked on the sidebar, switching the InfoWindow to it
    self.setCurrentMarker = function(clickedMarkerItem) {
            pageid = clickedMarkerItem.getThisWikiPageID(clickedMarkerItem);
            if (pageid === null) {
                clickedMarkerItem.subcription = clickedMarkerItem.wikipageid.subscribe(function(newpageid) {populateInfoWindow(clickedMarkerItem.marker, newpageid);});
            }
            clickedMarkerItem.visible(true);
            clickedMarkerItem.showMarker(clickedMarkerItem);
            bounceMarker(clickedMarkerItem.marker);
            populateInfoWindow(clickedMarkerItem.marker, pageid);
        };

    // choose Markers to be shown on map
    self.chooseMarkers = ko.computed(function() {
        if(!self.currentMarkerType()) {
            markers = self.placeMarkers();
        } else {
            markers = ko.utils.arrayFilter(self.placeMarkers(), function(plMarker) {
                return plMarker.type == self.currentMarkerType();
            });
        }
        self.placeMarkers().forEach(function(marker) {
            if (markers.includes(marker) && !self.hideMarkers) {
                marker.visible(true);
                }
                else {
                    marker.visible(false);
                }
            });
        self.showListings();
    });

    // initally show all listings
    self.showListings();

};

// initialise the map and start the view model
function initMap() {
    // Create new google Map, center on Dresden Old Town
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 51.050409, lng: 13.737262},
      zoom: 13,
      mapTypeControl: false
    });

    // preparing the InfoWindow
    infoWindow = new google.maps.InfoWindow({
        content: '',
        maxWidth: 300
    });

    // starting the View Model after the google maps init, so that several google api-references are initiallised and callable
    ko.applyBindings(new ViewModel());
};

// the function to tell the user that something is wrong with google map
function mapError(error) {
    map = document.getElementById('map');
    map.replaceChild(document.createTextNode("The google map could not be initialised. Please check your Internet connection and refresh your browser."), map.firstChild);
};

// This function populates the infowindow when the marker is clicked.
// There is only one window, which is relocated to the next marker as necessary
function populateInfoWindow(marker, pageid) {
    // Check to make sure the infowindow is not already opened on this marker or the wikipedia-data wasn't found before
    if (infoWindow.marker != marker || !infoWindow.content.includes('continue on wikipedia</a>')) {

        // stop a bouncing marker if the InfoWindow is reset to another
        if (infoWindow.marker !== undefined && infoWindow.marker != marker && infoWindow.marker.getAnimation() !== null) {
            infoWindow.marker.setAnimation(null);
        }

        // Clear the infowindow content and reset to new marker
        infoWindow.setContent('<div><strong>' + marker.title + '</strong></div>');
        var infos = '';
        infoWindow.marker = marker;
        // Make sure the marker property is cleared and stops bouncing if the infowindow is closed.
        infoWindow.addListener('closeclick', function() {
            if (infoWindow.marker !== undefined && infoWindow.marker.getAnimation() !== null) {
                infoWindow.marker.setAnimation(null);
                }
            infoWindow.marker = undefined;
        });


        // wikipedia-API
        // adding the Wikipedia.ajax-request (das ein JSON-P oder Cors benötigt)
        // build the query only if there is a pageid
        if (pageid !== null) {
            var queryData = {"action": "query", "format": "json", "prop": "extracts", "pageids": pageid, "utf8": 1, "exchars": "500", "exintro": 1};

            // prepare error handling by starting a timeout, that waits 8sec before killing the process and showing the message in the InfoWindow
            var wikiRequestTimeout = setTimeout(function() {
                infoWindow.setContent(infoWindow.content +
                            '<div>Wikipedia Access Timed Out</div>');
                }, 8000);

            // send query and process answer
            $.ajax( {
                url: 'https://en.wikipedia.org/w/api.php',
                data: queryData,
                dataType: 'jsonp',
                success: function(data) {
                    wiki = data.query.pages[pageid];
                    item = ('<p>' + wiki.extract + '  ' +
                        '<a href="http://en.wikipedia.org/?curid='+wiki.pageid+'">continue on wikipedia</a>'+
                        '</p>' );
                    infos = item;

                    clearTimeout(wikiRequestTimeout); // stop the timeout, the extract is here

                    if (infos.includes('continue on wikipedia')) {
                        infoWindow.setContent('<div><strong>' + marker.title + '</strong></div>' + infos);
                    } else {
                        infoWindow.setContent(infoWindow.content +
                            '<div>No Wikipedia Data Found</div>');
                    }
                },
                error: function() {
                            infoWindow.setContent(infoWindow.content +
                            '<div>No Wikipedia Data Found</div>');
                }
            });
        }
        // when pageid is null, wait 8sec in case pageID and wikipedia-data can be retrieved, elseset Content to Data missing
        else {
            var wikiRequestTimeout = setTimeout(function() {
                if (!infoWindow.content.includes('continue on wikipedia</a>')) {
                    infoWindow.setContent('<div><strong>' + marker.title + '</strong></div>' +
                                '<div>No Wikipedia Data Found</div>');
                }
                }, 8000);
            }

    // Open the infowindow on the correct marker.
    infoWindow.open(map, marker);
    }
}

// fetch the wikipedia-pageid for the requested location, if it is not yet saved in the PlaceMarker
function getWikiPageId(placemarker) {
    title = placemarker.title;
    var queryData = {"action": "query", "format": "json", "prop": "info", "list": "search", "utf8": 1, "srsearch": title, "srlimit": "1",
                     "srprop": "snippet", "srenablerewrites": "1" };

    // prepare error-handling (wait 4 sec for Wikipedia to return answer before killing the process)
    var wikiRequestTimeout = setTimeout(function() {
        infoWindow.setContent(infoWindow.content +
                    '<div>Wikipedia Access Timed Out</div>');
        }, 4000);

    // send query and process answer
    $.ajax( {
        url: 'https://en.wikipedia.org/w/api.php',
        data: queryData,
        dataType: 'jsonp',
        success: function(data) {
            wikis = data.query.search;
            if (wikis.length > 0) {
                clearTimeout(wikiRequestTimeout); // stop the timeout
                var pageid =  wikis[0].pageid;
                placemarker.wikipageid(pageid); // save pageid to the PlaceMarker
            }
        },
        error: function() {
            infoWindow.setContent(infoWindow.content +
                            '<div>No Wikipedia Data Found</div>');
            }
    });
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

// bounce the marker
bounceMarker = function(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
};
