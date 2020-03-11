(function() {
 
	 //
     // Connector definition
     // 
    var myConnector = tableau.makeConnector();

	//Tableau extract schema definition
    myConnector.getSchema = function(schemaCallback) {
         var cols = [
        { id : "lat", alias : "latitude", columnRole: "dimension", dataType : tableau.dataTypeEnum.float },
        { id : "lon", alias : "longitude",columnRole: "dimension", dataType : tableau.dataTypeEnum.float },
     
		{ id : "name", alias : "Name", dataType : tableau.dataTypeEnum.string },
        { id : "vicinity", alias : "Vicinity", dataType : tableau.dataTypeEnum.string },
		
		{ id : "price_level", alias : "Price Level", dataType : tableau.dataTypeEnum.string },
		{ id : "rating", alias : "Rating", dataType : tableau.dataTypeEnum.string },
		{ id : "formatted_address", alias : "Address", dataType : tableau.dataTypeEnum.string },

		//Last field records response status - for example, if there are zero results we will still get a table saying "Zero results"
		{ id : "response_status", alias : "Response Status", dataType : tableau.dataTypeEnum.string}
		
		];

		var tableInfo = {
			id : "googlePlaces",
			alias : "Places returned by Google API",
			columns : cols
		};

		schemaCallback([tableInfo]);
     };

    myConnector.getData = function(table, doneCallback) {
		
		//parse the request string from the web form into a JSON object
		var request = JSON.parse(tableau.connectionData);
	
		//Initialise PlaceService object which will be used to call Google Places API textSearch method
		service = new google.maps.places.PlacesService(document.getElementById("map"));
		tableau.log("Starting search");
		service.textSearch(request, processPlaces);
		
		//Callback function after the textSearch request completes
		function processPlaces(results, status, pagination) {
			var tableData = [];

			//If response status is not OK we save the status in our data table and quit
			if (status != google.maps.places.PlacesServiceStatus.OK) {
				tableau.log("Request status not OK");
				tableau.log(status);
				tableData.push({
					"response_status":status
				});
				table.appendRows(tableData);
				doneCallback();}

			//If the response is OK we insert results into the data table as rows one by one
			else {
				for (var i = 0; i < results.length; i++) {
					tableData.push({
						"lat": results[i].geometry.location.lat(),
						"lon": results[i].geometry.location.lng(),
						"name": results[i].name,
						"vicinity": results[i].vicinity,
						"price_level": results[i].price_level,
						"rating": results[i].rating,
						"formatted_address":results[i].formatted_address,
						"response_status":status
					});
				}
				table.appendRows(tableData);

				//Places API returns up to 20 results at a time. We call below method to get the next batch of results (if available)
				if (pagination.hasNextPage){
					tableau.log("going for next page");
					pagination.nextPage();}
				else {
					tableau.log("No next page - quitting now");
					doneCallback();
				}
			}
		}
	 };


    setupConnector = function(start) {
		
		//Process information from the web form and save it as a request string that will be used in myConnector.getData
		var lat = start.geometry.location.lat();
		var lon = start.geometry.location.lng();
		var radius = $('#radius').val().trim();
		
		if ($('#type_manual').val()){var kws = $('#type_manual').val().trim();}
			else {var kws = $('#type').val().trim();}
		
		var request = {"location":start.geometry.location,
						"radius":radius,
						"type":kws
					}
		
		tableau.connectionData = JSON.stringify(request)
		tableau.log(tableau.connectionData);
        tableau.connectionName = "Google Places data";
        tableau.submit();
	};

    tableau.registerConnector(myConnector);

     //
     // Setup connector UI
     //
     $(document).ready(function() {
		
		//Initialises Google Places API autocomplete object which will help user pick a starting point
		var placeAutocomplete = new google.maps.places.Autocomplete(
            document.getElementById('start'));
        
		$("#submitButton").click(function() { // This event fires when Submit button is clicked

			//If a starting point was picked from Autocomplete then we know the start point's coordinates and can ask the API about places around it - all good!
			if (placeAutocomplete.getPlace()) {
				var start = placeAutocomplete.getPlace();
				setupConnector(start);
				}
				
				//But if the user didn't pick a place from Autocomplete (typed some random address) then we don't know the coordinates... 
				//So we throw an error and ask the user to pick a place from Autocomplete
				else {
					$('#error').text("***Please pick a starting point from Autocomplete***");
				}
            
         });
     });
 })();