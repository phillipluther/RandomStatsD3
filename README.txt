--------
OVERVIEW
--------

The purpose of this programming task is to demonstrate proficiency in 
front-end engineering, with an emphasis on code clarity, data visualization,
and asynchronous web app programming.

The principal technologies needed for this task are: JavaScript, CSS/LESS, 
JQuery, D3, AJAX, and D3. 


--------------
THE ASSIGNMENT
--------------

Your task is to create a single web page that displays 2 time series line 
charts using data pulled from a RESTful web service (provided for you).
Refer to 'webpage_screenshot.jpg' in this directory -- this is basically
what the finished web page should look like.  Here are some implementation
specifics:

Header/Footer:
  - Pretty much what you see in the screenshot.
  - Height is 50px.
  - Footer should be "sticky", and the text should be centered.

Top graph (labeled "Snapshot of the data" in webpage_screenshot.jpg):
  - This static line graph is populated from the JSON response of the web 
    service endpoint 'GET /api/all_values' (described later in this doc).
	This graph needs to be populated once on page load.

Bottom graph (labeled "Dynamically-updated data"):
  - This is a dynamically-updated line graph.  On page load, the graph should
    be initially loaded with data from 'GET /api/all_values'.  After that,
	the graph logic should get a new data point from the web service every
	2 seconds and then update itself (e.g. how a live stock price graph might
	update).  The web service endpoint for this is 'GET /api/latest_value'.
	For this part of the task, don't worry about super smooth animations 
	(although try to avoid flickering or flashing on each update).

Color theme:
  - The colors you see in the screenshot have been added as LESS variables at
    the top of static/css/main.less.
		

----------------
DIRECTORY LAYOUT
----------------

Below is a summary of how this project is structured:

random_stats/
    static/
        css/
            main.less       # CSS/LESS code should go here
        js/
            lib/            # Contains the d3, jquery, and less JS libraries
            graphing.js     # The D3 graphing code will go here
    templates/
        dashboard.html      # The main HTML goes here (there's some skeleton code)
    web_service             # Run this in Terminal to start the web service


-----------------------
RUNNING THE WEB SERVICE
-----------------------

1. Open a Terminal window and cd to this directory.
2. Run ./web_service

If all goes well, the console should spit out this:

  [qbase] main.go:47: Starting up the app server...
  [qbase] main.go:65: Server ready and listening on port :8080
  
To test the web service endpoints, open up Chrome and enter the following URL:

	http://localhost:8080/api/all_values

The server should respond with a JSON-formatted map with containing 2 lists 
of numbers: "Times" and "Values".

The finished product will be here: 

	http://localhost:8080/dashboard
	
Notice that when you go to this URL now, it's mostly blank (except for the little
bit of skeleton code in dashboard.html).


----------------
WRITING THE CODE
----------------

The only files you'll need to deal with are dashboard.html, graphing.js, and 
main.less.  The JQuery, D3, and less libraries have already been linked in 
dashboard.html.  If there are other libraries that you want to use, feel free
to add their CDN URLs into dashboard.html.  However, it would be preferable 
to code the graphs using pure D3 to demonstrate a working knowledge of D3's
fundamental graph/line/axis/scaling features.

The url paths to use when talking to the web service via $.ajax() are:
  "/api/all_values"
  "/api/latest_value"
  
NOTE: One nuisance is that you will need to restart the web service 
(via CTRL-C) whenever you make a change to the HTML or JavaScript file -- 
otherwise your changes won't be seen when you refresh the browser.


---------------
WEB SERVICE API
---------------

The web service exposes 2 endpoints, both of which are utterly useless,
but will serve the purposes of this programming task.  Both endpoints are 
an HTTP GET, and they each return JSON.

Endpoint #1: 'GET /api/all_values'

This endpoint provides some random time series data.  The domain values
(a.k.a. x-values) are the time points, represented as standard Unix Epoch 
values (number of seconds elapsed since 1970-01-01 12:00).  The range values
(a.k.a. y-values) are random numbers in the approximate range [10..90].  
A time series with 3 data points would look like in the JSON format:

	{
		Times: [1408560917, 1408560918, 1408560919],
		Values: [17, 90, 45]
	}

Assuming your web service is running, you can open Chrome and navigate to this
URL to see the live response:

    http://localhost:8080/api/all_values

[NOTE: You can install the JSONView Chrome plug-in to pretty-format the JSON]

This is just a contrived response, so it simply returns 30 data points all 
spaced at 1 second intervals, where the last data point corresponds to the
current time.  Each call to this endpoint will yield a different set of
data points.

Endpoint #2: 'GET /api/latest_value'

This endpoint returns the "latest value" calculated from the web service.
A sample response from this endpoint is:

	{ 
		value: 57 
	}

Each call to this endpoint yields a new random value in the range [10-90].
To see the actual response for this endpoint, go to this URL:

    http://localhost:8080/api/latest_value


