const initLocn = [
    {
        "title": "Times Square",
        "location" : {"lat": 40.758895, "lng": -73.9873197},
    },
    {
        "title": "Empire State Building",
        "location" : {"lat": 40.7484404, "lng": -73.9878441},
    },
    {
        "title": "Statue of Liberty",
        "location": {"lat": 40.6892494, "lng": -74.0466891},
    },
    {
        "title": "Madame Tussauds",
        "location": {"lat": 40.7564269, "lng": -73.9910225},
    },
    {
        "title": "Broadway Theatre",
        "location" : {"lat": 40.7632778, "lng": -73.985348},
    },
    {
        "title": "Chrysler Building",
        "location" : {"lat": 40.7516208, "lng": -73.97550199},
    },
    {
        "title": "American Museum of Natural History",
        "location" : {"lat": 40.7813241, "lng": -73.973988},
    },
    {
        "title": "9/11 Memorial",
        "location" : {"lat": 40.7114836, "lng": -74.012725},
    },
    {
        "title": "Battery Park",
        "location" : {"lat": 40.7032775, "lng": -74.0170279},
    },
];


// Create global variable here..
let map,
    bounds,
    titleInfo,
    prevSearchData;

//Create a blank marker array  for all the listing markers.
let markers = [];

function initMap() {
    "use strict";

    const myLatLng = {lat: 40.758895, lng: -73.9873197};

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: myLatLng,
        mapTypeControl: false
    });

    // Create infoWindow on initalize.
    let infoWindow = new google.maps.InfoWindow();

    bounds = new google.maps.LatLngBounds();

function populateInfoWindow(marker, infoWindow) {
    // Check to make sure info window is not open.
    if (infoWindow.marker !== marker) {
        // Clear the infoWindow content to give a streetview time to load.
        infoWindow.setContent('');
        infoWindow.marker = marker;
        //Make sure that marker property is cleared if the infoWindow is closed.
        infoWindow.addListener('closeclick', function() {
            infoWindow.setMap(null);
        });

        let streetViewService = new google.maps.StreetViewService();
        const radius = 50;

        function getStreetView(data, status) {
            if (status === google.maps.StreetViewStatus.OK) {
                let nearStreetViewLocation = data.location.latLng;
                let heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infoWindow.setContent('<div>' + marker.title + '</div><div id="pano"></div><div id ="info"></div>');
                let panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                let panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infoWindow.setContent('<div>' + marker.title + '</div>' +
                '<div>No Street View Found</div>');
            }
        } // Close getStreetView
        
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infoWindow.open(map, marker);
    } // infoWindow.marker != marker)
} // Close populateInfoWindow   


let ViewModel = function() {

    let self = this;
    
    this.markerList = ko.observableArray([]);
    this.locFilter = ko.observable();

    let Marker = function(data,map) {
        this.title = data.title;
        this.location = data.location;
    };

    initLocn.forEach(function(locnItem){
        self.markerList.push(new Marker(locnItem));
    });
    
    this.markerList().forEach(function(marker){
        marker = new google.maps.Marker({
            position: marker.location,
            title: marker.title,
            draggable: true,
            animation: google.maps.Animation.DROP,
            map: map
        });

        markers.push(marker);

        bounds.extend(marker.position);
        map.fitBounds(bounds);
    
        marker.addListener('click', function() {
            getWikiData(marker);
            toggleBounce(marker);
            populateInfoWindow(this,infoWindow)
        });
    });

    this.getMarker = function(clickedMarker) {
        if (clickedMarker) {
            for(let i=0; i < markers.length; i++) {
                if (clickedMarker.title === markers[i].title)
                    google.maps.event.trigger(markers[i], "click");
                } // end-if
            } //end-if
        }; // end-function getMarker

    this.query = ko.observable('');
    this.filteredLoc = ko.computed(function() {
        let search = this.query().toLowerCase();

        for(let i=0; i< self.markerList().length; i++) {
            if(self.markerList()[i].title.toLowerCase().indexOf(search) >=0) {
                for(let j=0; j < markers.length; j++) {
                    if (self.markerList()[i].title === markers[j].title) {
                        markers[j].setVisible(true);
                    }
                }
            } else {
                for(let k=0; k < markers.length; k++) {
                    if (self.markerList()[i].title === markers[k].title) {
                        markers[k].setVisible(false);
                    }
                }
            }
        }
        if (search) {
            return ko.utils.arrayFilter(this.markerList(), function(item) {
                    return item.title.toLowerCase().indexOf(search) >=0;
                });
        } else {
            return this.markerList();
        }
    },this); 

    function toggleBounce(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ marker.setAnimation(null); }, 750);
    } // end-toggleBounce

    function getWikiData(marker) {
        //https://en.wikipedia.org/w/api.php?action=opensearch&search=Empire%20State%20Building&format=json&callback=wikiCallback
        let $searchData = marker.title,
            infoSet,
            wikiURL = "https://en.wikipedia.org/w/api.php?action=opensearch&search="
                        + $searchData +"&format=json&callback=wikiCallback";
        if ($searchData == prevSearchData) {
            infoSet = false
        } else {
            prevSearchData = $searchData;
            infoSet = true;
        }

        var wikiReqTimeOut = setTimeout(function() {
            alert("Wikipedia request failed.....");
        }, 2000);
        
        $.ajax({
            url: wikiURL,
            dataType: "jsonp",
            asynch: false,
            statusCode: {
                200: function(response, textStatus, xhr) {
                    if (textStatus === 'success' && infoSet) {
                        let titleDetails = response [3];
                        titleInfo = titleDetails[0];
                        $('#info').append('<a href="' + titleInfo + '">' + 'More Info (Powered by wikipedia)' + '</a>')
;                        infoSet = true;
                    }
                    clearTimeout(wikiReqTimeOut);
                }
            }
        })
    } //end-getWikiData

};// end-viewModel

ko.applyBindings(new ViewModel());
}

mapLoadError = function () {
        alert('Google maps failed to load. Try reloading the page or Connect to internet');
};