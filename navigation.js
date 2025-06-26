var nodeEdgeDetails = {};
var currentPath;
var layerGroup;
var currentDestination;
var watchLocationTimeout;

// Creating map options
var mapOptions = {
    center: [22.04916111, 88.10478889],
    zoom: 16
}

// Creating a map object
var map = new L.map('map', mapOptions);

// Creating a Layer object
var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

// Adding layer to the map
map.addLayer(layer);

layerGroup = L.layerGroup([]);
layerGroup.addTo(map);  

// Icon options
var iconOptions = {
    iconUrl: 'location_marker.png',
    iconSize: [30, 30],
    iconAnchor: [15, 25]
}
var testIconOptions = {
    iconUrl: 'node_marker.png',
    iconSize: [30, 30],
    iconAnchor: [15, 25]
}

function submitPassword(nodeid, event) {
    // Prevent any default behavior that might cause page reload
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    var enteredPwd = document.getElementById('pwdInput').value;
    if (enteredPwd === "1234") {
        navigate(nodeid);
        // Close the popup after successful navigation
        map.closePopup();

        watchLocationTimeout = setTimeout(() => {
            watchLocation();
        }, 2000);
        isUserInteracting = false;
    } else {
        alert("Wrong password.");
    }
    return false; // Prevent any form submission
}

function addMarkers() {
    Object.entries(nodes).forEach(([nodeid, node]) => {
        var nodename = node.nodename;
        var lat = node.lat;
        var lon = node.lon;
        var popupContent = `
            <div>
                <input type="password" id="pwdInput" placeholder="Password" /><br/><br/>
                <button type="button" onclick="submitPassword(${nodeid}, event); return false;">Submit</button>
            </div>
        `;

        if (nodename != "") {
            // Creating a Marker
            var marker = L.marker([lat, lon], { icon: L.icon(iconOptions) });

            marker.bindTooltip(nodename);

            marker.on('click', function () {      
                if (navigator.geolocation && watchId && interactionTimeout && watchLocationTimeout) {
                    clearTimeout(interactionTimeout);
                    clearTimeout(watchLocationTimeout);
                    navigator.geolocation.clearWatch(watchId);
                }
                marker.bindPopup(popupContent).openPopup();
            });

            // Adding marker to the map
            marker.addTo(map);
        }
        //else {
        //    var marker = L.marker([lat, lon], { icon: L.icon(testIconOptions) });

        //    marker.bindTooltip(nodeid);

        //    marker.on('click', function () {
        //        navigate(nodeid);
        //    });

        //    // Adding marker to the map
        //    marker.addTo(map);
        //}
        
    });      
}

function addEdges() {
    Object.entries(edges).forEach(([edgeid, edge]) => {
        var startnodeid = edge.startnodeid;
        var endnodeid = edge.endnodeid;
        var pos1 = [nodes[startnodeid].lat, nodes[startnodeid].lon];
        var pos2 = [nodes[endnodeid].lat, nodes[endnodeid].lon];
        var status = edge.status;

        var blockedEdgeOptions = { color: 'red' };

        if (!nodeEdgeDetails.hasOwnProperty(startnodeid)) {
            nodeEdgeDetails[startnodeid] = {};
        }
        if (!nodeEdgeDetails.hasOwnProperty(endnodeid)) {
            nodeEdgeDetails[endnodeid] = {};
        }

        nodeEdgeDetails[startnodeid][endnodeid] = edgeid;
        nodeEdgeDetails[endnodeid][startnodeid] = edgeid;

        if (status == 'N') {
            var line = L.polyline([pos1, pos2], {
                color: 'red',
                weight: 6,
            }).addTo(map);
            //line.bindTooltip(`Edge - ${edgeid}`);
        }
        //else {
        //    var line = L.polyline([pos1, pos2], {
        //        color: 'grey',
        //        weight: 6,
        //    }).addTo(map);
        //    line.bindTooltip(`Edge - ${edgeid}`);
        //}
    });
    
}

function addAreas() {
    Object.values(areas).forEach(areaData => {
        // Add polygon
        L.polygon(areaData.coords, {
            color: "green",
            fillColor: "green",
            fillOpacity: 0.1,
            weight: 1
        }).addTo(map);

        // Add marker with HTML label
        L.marker(areaData.label_pos, {
            icon: L.divIcon({
                className: '', // Important: clear default Leaflet styles
                html: `<div style="white-space: nowrap; color: red; font-size: 15px;">${areaData.html}</div>`
            })
        }).addTo(map);
    });
}

function navigate(dest) {
    var path;
    var nodeid
    var lat;
    var lon;

    if (substitutes.hasOwnProperty(dest)) {
        dest = substitutes[dest];
    }
    path = findPath(1, dest);

    if (path.length < 2) {
        alert("No route found for the selected destination");
        return;
    }

    for (let i = 0; i < path.length; i++) {
        nodeid = path[i];
        lat = nodes[nodeid].lat;
        lon = nodes[nodeid].lon;
        path[i] = [lat, lon];
    }

    if (currentPath) {
        layerGroup.removeLayer(currentPath);
    }
    currentPath = L.polyline.antPath(path).addTo(map);
    layerGroup.addLayer(currentPath);
}

function checkAllNavigations() {
    var path;
    var count = 0;
    var nodename;
    var lat;
    var lon;
    var text;
    var dest;
    Object.entries(nodes).forEach(([nodeid, node]) => {
        nodename = node.nodename;
        lat = node.lat;
        lon = node.lon;

        if (nodename != "") {
            text = nodename;
        }
        else {
            text = nodeid;
        }

        dest = nodeid;
        if (substitutes.hasOwnProperty(nodeid)) {
            dest = substitutes[nodeid];
        }

        path = findPath(1, dest);

        if (path.length < 2) {
            console.log(`No route found for destination id ${dest}`);
            count += 1;

            lat = node.lat;
            lon = node.lon;

            var marker = L.marker([lat, lon]);

            marker.bindTooltip(text);

            // Adding marker to the map
            marker.addTo(map);


        }  
    });
    console.log(`${count} routes not found`);
} 


