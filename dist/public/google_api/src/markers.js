const ICON_COLOR_RED =            'ff0000';  //BAD
const ICON_COLOR_ORANGE =         'ffab44';  //EH
const ICON_COLOR_NEUTRAL_BLUE =   '2568db';  //NOOTRAL
const ICON_COLOR_TEAL =           '49a2af';  //mellou
const ICON_COLOR_DARK_GREEN =     '0d9e00';  //WOO

const ICON_SCALE_MAX = 1.00;
const ICON_SCALE_MIN = 0.43;

const MARKER_INDICATOR_RANGE = 18;
const MARKER_LABEL_RANGE = 15;

var infowindow;
var formStr = "<input type='text' id='marker-label' value='New Marker' /><input type='button' value='submit' onclick='addLabel();' />"

//––––––––––– Url info for icon (at bottom) –––––––––––
var iconUrl1 = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2238%22%20height%3D%2238%22%20viewBox%3D%220%200%2038%2038%22%3E%3Cpath%20fill%3D%22%23";
var iconUrl2 = "%22%20stroke%3D%22%23ccc%22%20stroke-width%3D%22.5%22%20d%3D%22M34.305%2016.234c0%208.83-15.148%2019.158-15.148%2019.158S3.507%2025.065%203.507%2016.1c0-8.505%206.894-14.304%2015.4-14.304%208.504%200%2015.398%205.933%2015.398%2014.438z%22%2F%3E%3Ctext%20transform%3D%22translate%2819%2018.5%29%22%20fill%3D%22%23fff%22%20style%3D%22font-family%3A%20Arial%2C%20sans-serif%3Bfont-weight%3Abold%3Btext-align%3Acenter%3B%22%20font-size%3D%2212%22%20text-anchor%3D%22middle%22%3E";
var iconUrl3 = "%3C%2Ftext%3E%3C%2Fsvg%3E";
//–––––––––––––––––––––––––––––––––––––––––––––––––––––––


function addLabel() {
  var des = String(document.getElementById('marker-label').value);
  var des_token = des.split(/[,?\s+/.]/);
  for (var i = 0; i < des_token.length; i++) {
    let curr_word = des_token[i].toLowerCase();
    if (binSearch(curr_word) == true) {
        des_token[i] = '*'.repeat(curr_word.length);
    }
  }
  var real_des = des_token.join(" ");
  markerList[markerList.length - 1].des = real_des;
  markerList[markerList.length - 1].createLabel(Marker.map);
  markerList[markerList.length - 1].popupCreated = true;
  markerList[markerList.length - 1].popup.inRange = true;
  markerList[markerList.length - 1].indicator.setVisible(true);
  createMarker(getCookie(), markerList[markerList.length - 1].lat, markerList[markerList.length - 1].lng,markerList[markerList.length-1].display_name, markerList[markerList.length - 1].des, 0, 0);
  //getMarkerIDFromLatLng(markerList[markerList.length - 1].lat, markerList[markerList.length - 1].lng);
  infowindow.close();
}

function removeLastMarker() {
  markerList[markerList.length - 1].marker.setMap(null);
  markerList.pop();
}


// Havent implemented refreshAllMarkers() in the code yet, 
// but I think it will be useful in the future
function refreshAllMarkers() {
/*   markerList.forEach(marker => {
    marker.refreshIcon();
  }); */
}

class Marker {
  constructor(map, x, y, display_name, totalPoints = 20, existing = false, des = "New Marker", _id = 'undefined') {
    this.lat = x;
    this.lng = y;
    this.display_name = display_name;
    this.default = { lat: parseFloat(x), lng: parseFloat(y) };
    this.positionOffset = { lat: parseFloat(x + 0.0005), lng: parseFloat(y) };
    this.infoWindowOffset = { lat: parseFloat(x + 0.0002), lng: parseFloat(y) };

    this.totalPoints = totalPoints;
    this.existing = existing;
    this.popupCreated = existing;
    this.des = des;
    this._id = _id;

    this.color;
    this.size = 40;
    this.scale = ICON_SCALE_MIN;

    this.initializeMarker(map);
  }

  initializeMarker(map) {
    Popup = createPopupClass();

    if (!this.existing) { 
      this.scale = ICON_SCALE_MAX;
      infowindow = new google.maps.InfoWindow({ 
        content: formStr,
        position: this.infoWindowOffset
      });
      infowindow.addListener('closeclick', function(event) {
        removeLastMarker();
      });
      infowindow.open(map);
    }
    else {
      this.createLabel(map);
    }

    this.setIcon();

    this.marker = new google.maps.Marker({
      position: this.default,
      animation: google.maps.Animation.DROP,
      map: map,
      icon: this.icon,
      zIndex: this.totalPoints
    });

    this.indicator = new MarkerIndicator(map, this);
    this.addListeners(map);
  }

  prepRemove() {
    this.marker.setMap(null);
    this.indicator.setVisible(false);
    this.popup.setMap(null)
  }

  createLabel(map) {
    this.label = document.createElement('div');
    this.label.innerHTML = this.des;
    this.label.setAttribute('id', 'testcontent')

    this.popup = new Popup(new google.maps.LatLng(this.lat , this.lng), this.label);
    this.popup.setMap(map);
  }

  addListeners(map) {
    this.marker.addListener('click', function(event) {
      if (deleteToggled == false) {
        this.zoomToMarker(map);
      }
      else {
        deleteMarker(getCookie(), this._id);
        setDeleteToggled(false);
      }
    }.bind(this));

    this.indicator.addListeners();
    
    // this event is for upvoting the marking
    // if the cookie isn't empty, it increments 1 point
    // to the marker.
    this.indicator.upvote.poly.addListener(
      "click",
      function(event) {
        // if document.cookie is assigned, 
        // upvote the marker and store that record in the given user's information
        if (document.cookie != '') {
          upvoteUser(this._id, getCookie(), 1, this.indicator, this.totalPoints);
        }
        // display window alert if the cookie is empty
        else {
          window.alert("please register and/or sign in to vote!");
        }
      }.bind(this)
    );

    this.indicator.downvote.poly.addListener(
      "click",
      function(event) {
        // if document.cookie is assigned, 
        // downvote the marker and stoer that record in the given user's information
        if (document.cookie != '') {
          downvoteUser(this._id, getCookie(), -1, this.indicator, this.totalPoints);
        }
        // display window alert if the cookie is empty
        else {
          window.alert("please register and/or sign in to vote!");
        }
      }.bind(this));
      
    if (this.label) {
    $(this.label).one('click', function(e) {
      validateEditing(this._id, getCookie());
  }.bind(this));
  }
  }

/*   this.indicator.infoWindow.addListener(
    "click",
    function(even) {
      console.log("You clicked it");
    }
  ) */


  zoomToMarker(map, showIndicator = true) {
    map.setZoom(18);
    map.setCenter(this.positionOffset);
    this.indicator.setVisible(showIndicator);
  }

  refreshIcon() {
      this.setIcon();   
      this.marker.setZIndex(this.totalPoints);
      this.marker.setIcon(this.icon);
  }

  setIcon() {
    if ( this.totalPoints > 31) {
          this.color = ICON_COLOR_DARK_GREEN;
          this.size = 60;
      } else if (this.totalPoints <= 31 && this.totalPoints > 23) {
          this.color = ICON_COLOR_TEAL;
          this.size = 50;
      } else if (this.totalPoints <= 23 && this.totalPoints > 17) {
          this.color = ICON_COLOR_NEUTRAL_BLUE;
          this.size = 40;
      } else if (this.totalPoints <= 17 && this.totalPoints >= 10) {
          this.color = ICON_COLOR_ORANGE;
          this.size = 30;
      } else if (this.totalPoints < 10) {
          this.color = ICON_COLOR_RED;
          this.size = 20;
      }

      this.icon = {
          url: iconUrl1 + this.color + iconUrl2 + this.totalPoints + iconUrl3,
          scaledSize: { width: this.size * this.scale, height: this.size * this.scale }
      };
  }

  get getMarker() {
    return this.getM();
  }

  getM() {
    return this.marker;
  }
}
