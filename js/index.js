mapboxgl.accessToken = 'pk.eyJ1Ijoibm9haHNhbW9hIiwiYSI6ImNsb3Q3Z2lkaTA2aDQycnA4MmdqZ2J1cGYifQ.8NMJu7X2FcPeARpvIH0ItA';
        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-122.335167, 47.608013], // Seattle coordinates
            zoom: 12
        });



        map.on('load', function () {
            
            map.addSource('collisions', {
                type: 'geojson',
                data: 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Collisions_All_Years/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson'
            });

            map.addLayer({
            'id': 'collisions-layer',
            'type': 'circle',
            'source': 'collisions',
            'paint': {
                 // This example uses a simple linear scaling. Adjust as necessary for your data.
                'circle-radius': [
                    'interpolate',
                    ['linear'], ['get', 'INJURIES'],
                    0, 4,   // Data value 0 maps to a circle radius of 4
                    10, 24  // Data value 100 maps to a circle radius of 24
                ],
                'circle-color': [
                    'interpolate',
                    ['linear'], ['get', 'INJURIES'], // Replace 'injury_count' with your attribute name
                    1, "rgba(57, 0, 179, 1)",
                    2, "rgba(113, 77, 191, 1)",  // Scale start: blue for 1
                    3, "rgba(158, 107, 144, 1)",  // Midpoint: orange for 5
                    5, "rgba(207, 146, 112, 1)",
                    7, "rgba(235, 182, 152, 1)"  // Scale end: bright red for 10
                ]// Customize color as needed
            }
            

            

        });

        map.on('click', 'collisions-layer', (event) => {
            new mapboxgl.Popup()
                .setLngLat(event.features[0].geometry.coordinates)
                .setHTML(`<strong>INJURIES:</strong> ${event.features[0].properties.INJURIES}`)
                .addTo(map);
        });

        // Size legend
            var sizes = [4, 12, 24]; // Example sizes
            var sizeLabels = ['Low', 'Medium', 'High']; // Example labels for sizes
            var sizeContainer = document.getElementById('legend-size');
            sizes.forEach(function(size, i) {
                var item = document.createElement('div');
                var key = document.createElement('span');
                key.className = 'legend-key';
                key.style.width = size + 'px';
                key.style.height = size + 'px';
                key.style.borderRadius = '50%';
                key.style.background = '#555'; // Use a neutral color or vary based on your preference
                key.style.display = 'inline-block';
                key.style.marginRight = '5px';

                var label = document.createTextNode(sizeLabels[i]);
                item.appendChild(key);
                item.appendChild(label);
                sizeContainer.appendChild(item);
            });

            // Color legend
            var colors = ["rgba(57, 0, 179, 1)", "rgba(113, 77, 191, 1)", "rgba(158, 107, 144, 1)", "rgba(207, 146, 112, 1)", "rgba(235, 182, 152, 1)"]; // Example colors
            var colorLabels = ['1', '2', '3', '5', "7+"]; // Example labels for colors
            var colorContainer = document.getElementById('legend-color');
            colors.forEach(function(color, i) {
                var item = document.createElement('div');
                var key = document.createElement('span');
                key.className = 'legend-key';
                key.style.width = '20px';
                key.style.height = '10px';
                key.style.background = color;
                key.style.display = 'inline-block';
                key.style.marginRight = '5px';

                var label = document.createTextNode(colorLabels[i]);
                item.appendChild(key);
                item.appendChild(label);
                colorContainer.appendChild(item);
            });

            function updateKPI() {
                if (!map.isSourceLoaded('collisions')) {
                    // If the source is not loaded, don't try to update the KPI or chart.
                    return;
                }

                var bounds = map.getBounds();
                var count = 0;
                var injuryCounts = {}; // Object to hold the count of injuries

                // Use querySourceFeatures to get the features from the 'collisions' source within the current map view.
                var features = map.querySourceFeatures('collisions');

                // Loop through these features to populate injuryCounts
                features.forEach(function(feature) {
                    var lng = feature.geometry.coordinates[0];
                    var lat = feature.geometry.coordinates[1];
                    if (bounds.contains([lng, lat])) {
                        count++;
                        var injuries = feature.properties.INJURIES; // Assuming 'INJURIES' is the property name
                        injuryCounts[injuries] = (injuryCounts[injuries] || 0) + 1;
                    }
                });

                // Update the KPI display
                document.getElementById('kpiValue').textContent = count;

                // Prepare data for the chart
                var columns = Object.keys(injuryCounts).map(function(key) {
                    return [key, injuryCounts[key]];
                });

                // Update the chart
                updateChart(columns);
            }

            function updateChart(columns) {
                var chart = c3.generate({
                    bindto: '#chart',
                    data: {
                        columns: columns,
                        type: 'bar'
                    },
                    axis: {
                        x: {
                            label: 'Number of Injuries',
                            type: 'category'
                        },
                        y: {
                            label: 'Count'
                        }
                    },
                    bar: {
                        width: {
                            ratio: 0.5
                        }
                    }
                });
            }

            // Call updateKPI whenever the map is moved, and also initially once the map and source are fully loaded.
            map.on('idle', updateKPI);


            // Initial update
        });
