var nodeEdgeDetails = {};
var currentPath;
var layerGroup;
var currentSource;
var currentDestination;
var selectedSource;
var selectedDestination;

var watchLocationTimeout;
var popUpsCount = 0;
var edgeStatus = {};

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
    //iconUrl: 'location_marker.png',
    iconUrl: 'location3.png',
    iconSize: [30, 30],
    iconAnchor: [15, 25]
}
var testIconOptions = {
    iconUrl: 'node_marker.png',
    iconSize: [30, 30],
    iconAnchor: [15, 25]
}

map.on('popupopen', function(e) {
    popUpsCount += 1
});

map.on('popupclose', function(e) {
    popUpsCount -= 1
    if (popUpsCount == 0 && currentPath) {
        watchLocationTimeout = setTimeout(() => {
            watchLocation();
        }, 5000);
        isUserInteracting = false;
    }    
});

function setStart(nodeid, event) {
    // Prevent any default behavior that might cause page reload
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    var enteredPwd = document.getElementById('pwdInput').value;

    if (enteredPwd === "1") {
        // currentDestination = nodeid;
        selectedSource = nodeid;

        if (selectedDestination && selectedSource!=selectedDestination) {
            navigate(selectedSource,selectedDestination)
        }
        map.closePopup();          
    } 
    else if (enteredPwd === "") {
        alert("Please enter the password.");
    }
    else {
        alert("Wrong password.");
    }
    return false; // Prevent any form submission
}

function setEnd(nodeid, event) {
    // Prevent any default behavior that might cause page reload
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    var enteredPwd = document.getElementById('pwdInput').value;

    if (enteredPwd === "1") {
        // currentDestination = nodeid;
        selectedDestination = nodeid;

        if (selectedSource && selectedSource!=selectedDestination) {
            navigate(selectedSource,selectedDestination)
        }
        map.closePopup();          
    } 
    else if (enteredPwd === "") {
        alert("Please enter the password.");
    }
    else {
        alert("Wrong password.");
    }
    return false; // Prevent any form submission
}

function addMarkers() {
    Object.entries(nodes).forEach(([nodeid, node]) => {
        var flag = node.flag;
        var lat = node.lat;
        var lon = node.lon;
        var popupContent = `
            <div>
                <p style="margin: 0 0 10px 0;">
                    <span style="font-weight: bold;">Location ID:</span> L${nodeid}
                </p>
                <input type="password" id="pwdInput" placeholder="Enter Password" style="margin-bottom: 10px;" /><br/>
                <button type="button" onclick="setStart(${nodeid}, event); return false;" 
                        style="background-color:rgb(162, 177, 164); color: rgb(8, 8, 8); padding: 6px 6px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center;">
                    Set as start point
                </button><br/>
                <button type="button" onclick="setEnd(${nodeid}, event); return false;" 
                        style="background-color:rgb(162, 177, 164); color: rgb(8, 8, 8); padding: 6px 6px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center;">
                    Set as end point
                </button><br/>
            </div>
        `;

        if (flag == "L") {
            // Creating a Marker
            var marker = L.marker([lat, lon], { icon: L.icon(iconOptions) });

            marker.bindPopup(popupContent);

            marker.on('click', function () { 
                stopWatchLocation();
                this.openPopup();
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

        if (!nodeEdgeDetails.hasOwnProperty(startnodeid)) {
            nodeEdgeDetails[startnodeid] = {};
        }
        if (!nodeEdgeDetails.hasOwnProperty(endnodeid)) {
            nodeEdgeDetails[endnodeid] = {};
        }

        nodeEdgeDetails[startnodeid][endnodeid] = edgeid;
        nodeEdgeDetails[endnodeid][startnodeid] = edgeid;


        var line = L.polyline([pos1, pos2], {
            //color: 'grey',
            color: '#ebf0ec',
            weight: 10,
        });

        var popupDiv = document.createElement('div');
        popupDiv.innerHTML = `
            <p style="margin: 0 0 10px 0;">
                <span style="font-weight: bold;">Edge ID:</span> ${edgeid}
            </p>
            <input type="password" placeholder="Enter Password" style="margin-bottom: 10px;" /><br/>
            <button style="background-color:rgb(16, 56, 235); color: rgb(252, 246, 246); padding: 6px 6px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center;">
                Close/Open Road
            </button>
        `;

        // Attach click event to the button inside the popup
        popupDiv.querySelector('button').addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            var enteredPwd = popupDiv.querySelector('input').value;
            var status = edges[edgeid]["status"];
            const node1 = edges[edgeid].startnodeid;
            const node2 = edges[edgeid].endnodeid;
            const edgeKey1 = `${node1}-${node2}`;
            const edgeKey2 = `${node2}-${node1}`;
            if (enteredPwd === "1") {
                if (status=='Y') {
                    edges[edgeid]["status"] = 'N';
                    edgeStatus[edgeKey1] = 'N';
                    edgeStatus[edgeKey2] = 'N';
                    line.setStyle({ color: 'red' });
                }
                else {
                    edges[edgeid]["status"] = 'Y';
                    edgeStatus[edgeKey1] = 'Y';
                    edgeStatus[edgeKey2] = 'Y';
                    //line.setStyle({ color: 'grey' });
                    line.setStyle({ color: '#ebf0ec' });
                }  
                if (currentSource && currentDestination) {
                    navigate(currentSource, currentDestination);    
                }                         
                map.closePopup();
            } else if (enteredPwd === "") {
                alert("Please enter the password.");
            } else {
                alert("Wrong password.");
            }
        });

        line.bindPopup(popupDiv);

        line.on('click', function (e) {
            stopWatchLocation();
            this.openPopup(e.latlng);
        });

        line.addTo(map);
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

function navigate(srcInput, destInput) {
    var src = srcInput;
    var dest = destInput;
    var path;
    var nodeid;
    var lat;
    var lon;

    if (substitutes.hasOwnProperty(srcInput)) {
        src = substitutes[srcInput];
    }
    if (substitutes.hasOwnProperty(destInput)) {
        dest = substitutes[destInput];
    }
    path = findPath(src, dest);

    if (path.length < 2) {
        alert("No route found between the selected source and destination");
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
    currentPath = L.polyline.antPath(path, { interactive: false }).addTo(map);
    layerGroup.addLayer(currentPath);
    currentSource = srcInput;
    currentDestination = destInput;
    document.getElementById('currentSource').innerText = `L${srcInput}`;
    document.getElementById('currentDestination').innerText = `L${destInput}`;

}

function checkAllNavigations() {
    var path;
    var count = 0;
    var lat;
    var lon;
    var dest;
    Object.entries(nodes).forEach(([nodeid, node]) => {
        lat = node.lat;
        lon = node.lon;

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

            marker.bindTooltip(dest);

            // Adding marker to the map
            marker.addTo(map);


        }  
    });
    console.log(`${count} routes not found`);
} 


