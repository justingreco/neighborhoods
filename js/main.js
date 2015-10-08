{{$(document).ready(function () {
  var cacs, hoods, cacLabels, hoodLabels, popupFeatures, popupId, marker;
  var streets, imagery, labels, lots;
  var map;



  var printMap = function () {
    var scales = [
    {
      level: 11,
      scale: 288895.277144
    },{
      level: 12,
      scale: 144447.638572
    },{
      level: 13,
      scale: 72223.819286
    },{
      level: 14,
      scale: 36111.909643
    },{
      level: 15,
      scale: 18055.954822
    },{
      level: 16,
      scale: 9027.977411
    },{
      level: 17,
      scale: 4513.9887055
    },{
      level: 18,
      scale: 2256.99435275
    }];

    var scale = $(scales).filter(function (i) {
      return this.scale === map.getZoom();
    });

    if (scale.length > 0) {
      scale = scale[0];
    }

    var webmapJson = {
     "mapOptions": {
     "extent" : {
      "xmin" : map.getBounds().getWest(),
      "ymin" : map.getBounds().getSouth(),
      "xmax" : map.getBounds().getEast(),
      "ymax" : map.getBounds().getNorth(),
      "spatialReference" : {
        wkid: 4326
       }
     },
     "scale": scale,
     "rotation": 0,
     "spatialReference": {
      wkid: 4326
     }
   },
     "operationalLayers": [{
      "url" : "https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer",
      "title" : "Parcels",
      "opacity" : 0.5,
      "visibleLayers" : [
       0,
       1
      ]
     },{
      "url" : "https://maps.raleighnc.gov/arcgis/rest/services/Planning/Subdivisions/MapServer",
      "title" : "Neighborhoods",
      "opacity" : 1,
      "visibleLayers" : [
       1
      ]
     }
    ],
      "baseMap" : {
       "title" : "CartoDB Proton",
       "baseMapLayers" :  [
        {
         "type" : "WebTiledLayer",
         "urlTemplate" : "http://{subDomain}.basemaps.cartocdn.com/light_all/{level}/{col}/{row}.png",
         "subDomains" : [
           "a", 
           "b", 
           "c", 
           "d"
         ]
        }
       ]
      },
     "exportOptions": {},
     "layoutOptions": {
      "titleText": "City of Raleigh Neighborhood Registry"
     }
    };
    $.ajax({
      url: 'http://maps.raleighnc.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task/execute',
      type: 'POST',
      dataType: 'json',
      data: {'Web_Map_as_JSON': JSON.stringify(webmapJson),
              'Format': 'PDF',
              'Layout_Template': 'Letter ANSI A Landscape',
              'Output_File': 'test.pdf',
              'f': 'json'
    },
    })
    .done(function(data) {
      console.log("success");
      window.open(data.results[0].value.url);
    })
    .fail(function() {
      console.log("error");
    })
    .always(function() {
      console.log("complete");
    });
    
  };
  var getCacColor = function (name) {
    var color = "#000";
    switch (name) {
      case "Atlantic":
      color = "#838A34";
      break;
      case "Central":
      color = "#F5BA9D";
      break;
      case "East":
      color = "#F0A1D1";
      break;
      case "Five Points":
      color = "#E7F299";
      break;
      case "Forestville":
      color = "#50D64B";
      break;
      case "Glenwood":
      color = "#8A3E52";
      break;
      case "Hillsborough":
      color = "#80674E";
      break;
      case "Midtown":
      color = "#80674E";
      break;
      case "Mordecai":
      color = "#486A87";
      break;
      case "North":
      color = "#EB54DE";
      break;
      case "Northeast":
      color = "#40854B";
      break;
      case "Northwest":
      color = "#3E9494";
      break;
      case "North Central":
      color = "#6CEBC7";
      break;
      case "South":
      color = "#DB4F4D";
      break;
      case "Southeast":
      color = "#A84892";
      break;
      case "Southwest":
      color = "#95A4E8";
      break;
      case  "South Central":
      color = "#5CCEF7";
      break;
      case "Wade":
      color = "#9186F7";
      break;
      case "West":
      color = "#BAF757";
      break;
    }
    return color;
  };
  var specialists = null;
  $.getJSON('data/specialists.json', function (json) {
    specialists = json;
    initMap();
  });
  var getNeighborhoodDetails = function (feature) {
    var matches = $(specialists).filter(function (i) { return this.code === feature.properties.CAC;});
    if (matches.length > 0) {
      feature.properties.CAC = matches[0].name;
      feature.properties.SPECIALIST = matches[0].person;
      feature.properties.EMAIL = matches[0].email;
      feature.properties.PHONE = matches[0].phone;
    }
    return feature;
  }
  var boundsToGeojson = function (bounds) {
    return {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
          [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
          [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
          [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
          [bounds.getSouthWest().lng, bounds.getSouthWest().lat]
        ]]
      }
    }
  };
  var addGeocoder = function (map) {
    var flProvider = new L.esri.Geocoding.Controls.Geosearch.Providers.FeatureLayer({
      url: 'https://maps.raleighnc.gov/arcgis/rest/services/Planning/Subdivisions/MapServer/1/',
      searchFields: ['NAME'],
      label: 'Neighborhoods',
      formatSuggestion: function(feature){
        return feature.properties.NAME;
      }
    });
    var flProvider2 = new L.esri.Geocoding.Controls.Geosearch.Providers.FeatureLayer({
      url: 'https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/',
      searchFields: ['ADDRESS'],
      label: 'Address',
      formatSuggestion: function(feature){
        return feature.properties.ADDRESS;
      }
    });
    var searchControl = L.esri.Geocoding.Controls.geosearch({expanded: true, collapseAfterResult: false, placeholder: 'Search By Address or Neighborhood', useMapBounds: false}).addTo(map);
    searchControl.options.providers = [];
    searchControl.options.providers.push(flProvider);
    searchControl.options.providers.push(flProvider2);
    searchControl.on('results', function (data) {
      hoods.eachFeature(function (feature, layer) {
        marker.clearLayers();
        marker.addLayer(L.marker(data.latlng));
        try {
          if (turf.intersect(feature.toGeoJSON(), {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Point",
              "coordinates": [data.latlng.lng, data.latlng.lat]
            }
          }) != undefined) {
            feature.openPopup();
            map.fitBounds(feature.getBounds());
            highlightPopup(feature.feature.id);
          }} catch (err) {
          }
        });
      });
    };
    var setCacStyle = function (fill) {
      cacs.setStyle(function (feature) {
        var color = getCacColor(feature.properties.NAME);
        return {
          weight: 3,
          opacity: 1,
          color: color,
          fillColor: color,
          fillOpacity: (fill) ? 0.25 : 0,
          clickable: true
        }
      }
    );
  };
  var highlightPopup = function (id) {
    hoods.setStyle(function () {
      return {
        weight: 3,
        opacity: 1,
        color: '#777',
        fillColor: '#777',
        fillOpacity: 0.5,
        clickable: true
      }
    });
    hoods.setFeatureStyle(id, function (feature) {
      return {
        weight: 3,
        opacity: 1,
        color: '#FFF000',
        fillColor: '#FFF000',
        fillOpacity: 0.5,
        clickable: true
      }
    }
  );
};
var drawLabel = function (simplified, bounds, name) {
  var intersect = turf.intersect(simplified, bounds);
  if (intersect) {
    var center = turf.centroid(intersect);//feature.getBounds().getCenter();
    var label = L.marker([center.geometry.coordinates[1], center.geometry.coordinates[0]], {
      icon: L.divIcon({
        iconSize: null,
        className: 'cac-label',
        iconAnchor: [40, 20],
        html: '<div>' + name + '</div>'
      })
    }).addTo(cacLabels);
  }
};
var labelCacs = function (bounds, map) {
  cacLabels.clearLayers();
  cacs.eachFeature(function (f) {
    try {
      var feat, simplified;
      if (f.feature.geometry.type === 'MultiPolygon') {
        $.each(f.feature.geometry.coordinates, function (i, coords) {
          feat = {'type': 'Feature', 'properties':{}, 'geometry': {'type': 'Polygon', 'coordinates': coords}};
          if (map.getZoom() > 14 || turf.area(feat) > 10000000) {
            simplified = turf.simplify(feat, 0.001, false);
            drawLabel(simplified, bounds, f.feature.properties.NAME );
          }
        });
      } else {
        simplified = turf.simplify(f.feature, 0.001, false);
        drawLabel(simplified, bounds, f.feature.properties.NAME );
      }
    } catch (err){
    }
  });
};
var labelHoods = function (bounds, map) {
  hoods.query().intersects(map.getBounds()).run(function (error, featureCollection) {
    for (var i = 0; i < featureCollection.features.length; i++) {
      var f = featureCollection.features[i];
      try {
        var intersect = turf.intersect(f, bounds);
        if (intersect) {
          var center = turf.centroid(intersect);//feature.getBounds().getCenter();
          var label = L.marker([center.geometry.coordinates[1], center.geometry.coordinates[0]], {
            icon: L.divIcon({
              iconSize: null,
              className: 'hood-label',
              iconAnchor: [20, 20],
              html: '<div>' + f.properties.NAME + '</div>'
            })
          }).addTo(hoodLabels);
        }
      } catch (err){
      }
    }
  });
};
var cacLoadCnt = 0;
var addCacs = function (map) {
  cacs = L.esri.featureLayer({
    url: 'https://maps.raleighnc.gov/arcgis/rest/services/Boundaries/MapServer/1',
    simplifyFactor: 0.35,
    precision: 5
  }).addTo(map);
  setCacStyle(true);
  cacs.on('load', function (e) {
    labelCacs(boundsToGeojson(map.getBounds()), map);

    if (cacLoadCnt === 0) {
      //if ($("[name='hood-checkbox']").prop('checked')){
        window.setTimeout(function() {
          addHoods(map);
        }, 500);
      //}
    }
    cacLoadCnt += 1;
  });
};
var toggleLinkClicked = function () {
  if (this.text === 'Next') {
    popupId += 1;
    if (popupId >= popupFeatures.length) {
      popupId = 0;
    }
  } else {
    popupId -= 1;
    if (popupId < 0) {
      popupId = popupFeatures.length - 1;
    }
  }
  var f = popupFeatures[popupId];
  $(".leaflet-popup-content").html(popupFeatures[popupId]._popup.getContent());
  $('.toggle-links a').on('click', toggleLinkClicked);
  highlightPopup(f.feature.id);
};
var hoodClicked = function (e) {
  var polys = leafletPip.pointInLayer(e.latlng, hoods);
  if (polys.length > 1) {
    $('.toggle-links').show();
    popupFeatures = polys;
    popupId = 0;
    $(".leaflet-popup-content").html(popupFeatures[0]._popup.getContent());
    $('.toggle-links a').on('click', toggleLinkClicked);
  } else {
    $('.toggle-links').hide();
  }
  hoods.setStyle(function () {
    return {
      weight: 3,
      opacity: 1,
      color: '#777',
      fillColor: '#777',
      fillOpacity: 0.5,
      clickable: true
    }
  });
  highlightPopup(polys[0].feature.id);
};
var addHoods = function (map) {
  hoods = L.esri.featureLayer({
    url: 'https://maps.raleighnc.gov/arcgis/rest/services/Planning/Subdivisions/MapServer/1',
    simplifyFactor: 0.35,
    precision: 5,
    style: function (feature) {
      return {
        weight: 3,
        opacity: 1,
        color: '#777',
        fillColor: '#777',
        fillOpacity: 0.5,
        clickable: true
      }
    }, onEachFeature: function (feature, layer) {
      feature = getNeighborhoodDetails(feature);
      layer.bindPopup(L.Util.template("<div><div class='popup-title'><strong class='popup-name lead'>{NAME}</strong></div><hr/><span class='glyphicon glyphicon-map-marker'></span><strong>CAC:</strong> {CAC}<br/><span class='glyphicon glyphicon-user'></span><strong>Specialist:</strong> {SPECIALIST}<br/><span class='glyphicon glyphicon-envelope'></span><strong>Email:</strong> <a href='mailto:{EMAIL}'>{EMAIL}</a><br/><span class='glyphicon glyphicon-phone'></span><strong>Phone:</strong> {PHONE}<br/><span class='glyphicon glyphicon-home'></span><strong>Homes:</strong> {HOMES}</div><form action='php/export.php' method='post'  style='display:none'><input name='columns' style='display:none'/><input name='csv' style='display:none'/></form><br/><a class='mail-list' data-id='" + feature.id + "' href='javascript:void(0)'><span class='glyphicon glyphicon-floppy-save'></span> Mailing List</a><br/><br/><div class='toggle-links'><a href='javascript:void(0)'>&lt; Previous</a><a href='javascript:void(0)'>Next &gt;</a></div>", feature.properties));
    }
  }).addTo(map).on('click', hoodClicked);
};
var createMailList = function (features) {
  var list = [];
  $.each(features, function (i, feature) {
    var item = [];
    item.push("Resident");
    item.push(feature.properties.ADDRESS);
    item.push(feature.properties.CITY);
    item.push(feature.properties.STATE);
    item.push(feature.properties.ZIP);
    list.push(item);
  });
  $('form>input[name="columns"]', '.leaflet-popup-content').attr("value", JSON.stringify(['PERSON','ADDRESS','CITY','STATE','ZIP']));
  $('form>input[name="csv"]', '.leaflet-popup-content').attr("value", JSON.stringify(list));
  $('form', '.leaflet-popup-content').submit();
};
var initMap = function () {
  $("#print").click(printMap);
  map = L.map('map').setView([35.85, -78.65], 11);
  streets = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);
  imagery = L.esri.basemapLayer('Imagery');
  $('#basemaps').change(function (e) {
    if ($(this).val() === 'Streets') {
      map.removeLayer(imagery);
      map.removeLayer(labels);
      map.addLayer(streets);
      lots.setOpacity(0.25);
    } else {
      map.removeLayer(streets);
      map.addLayer(imagery);
      labels = L.esri.basemapLayer('ImageryLabels');
      map.addLayer(labels);
      lots.setOpacity(1);
    }
  });
  addGeocoder(map);
  addCacs(map);
  map.on('popupopen', function (e){
    $(e.popup.getContent, '.mail-list').off();
    $(e.popup.getContent, '.mail-list').click(function (e) {
      
      var id = $(e.target).data('id');
      var feature = hoods.getFeature(id);
      if (feature) {
         L.esri.Tasks.query({
          url: 'https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0'
        }).within(feature.feature.geometry).run(function (error, featureCollection) {
          createMailList(featureCollection.features);
        });       
      }

    });
  });
  marker = L.featureGroup().addTo(map);
  hoodLabels = L.featureGroup().addTo(map);
  cacLabels = L.featureGroup().addTo(map);

  map.on('zoomend', function (e) {
    setCacStyle(map.getZoom() < 14);
  });
  map.on('moveend', function (e) {
    hoodLabels.clearLayers();
    if (map.getZoom() > 13) {
      labelHoods(boundsToGeojson(map.getBounds()), map);
    }
    labelCacs(boundsToGeojson(map.getBounds()), map);
  });
  $("[name='cac-checkbox']").bootstrapSwitch({onSwitchChange: function (e, state) {
    if (state) {
      map.removeLayer(hoods);
      map.removeLayer(hoodLabels);
      //cacLoadCnt = 0;
      //addCacs(map);
      //if ($("[name='hood-checkbox']").prop('checked')) {
        //map.addLayer(hoodLabels);
      //}
      map.addLayer(cacs);
      map.addLayer(cacLabels);

      window.setTimeout(function() {
        map.addLayer(hoods);
        map.addLayer(hoodLabels);
        }, 1000);      
    } else {
      map.removeLayer(cacs);
      map.removeLayer(cacLabels);
    }
  }});
  $("[name='hood-checkbox']").bootstrapSwitch({onSwitchChange: function (e, state) {
    if (state) {
      map.addLayer(hoods);
      map.addLayer(hoodLabels);
    } else {
      map.removeLayer(hoods);
      map.removeLayer(hoodLabels);
    }
  }});
  lots = L.esri.dynamicMapLayer({
    url: 'https://maps.raleighnc.gov/arcgis/rest/services/Parcels/MapServer',
    opacity: 0.25,
    position: 'back'
  }).addTo(map);
  if (window.innerWidth <= 650) {
    $('.navbar-brand').html('Neighborhood Registry');
  } else {
    $('.navbar-brand').html('City of Raleigh');
  }  
}
window.setTimeout(function () {
  $(".geocoder-control-input").prop('placeholder', 'Search By Address or Neighborhood');
}, 100);
$(window).resize(function () {
  if (window.innerWidth <= 650) {
    $('.navbar-brand').html('Neighborhood Registry');
  } else {
    $('.navbar-brand').html('City of Raleigh');
  }
});
});}}