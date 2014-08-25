'use strict';

// TODO: write some JavaScript!
// Done!

// i set up our graph as a JS "constructor" so any instances we add to the page are treated in a
// standard way.
var TimeGraph = function(Selector, DataSource, Options) {

    var
        // an internal binding to the instance context
        $this = this,

        // flag tripped on instantiation if a required param is missing
        HasRequiredParams = true,

        // these are used for managing our dynamic charts
        AutoRefresh     = false,
        RefreshInterval = 1000, // default of a second

        // general layout options (we could include these as an option property)
        Padding = {
            top     : 15,
            right   : 15,
            bottom  : 50,
            left    : 50
        },

        // these are defined during construction and available instance-wide
        Data = {
            'Times'  : [],
            'Values' : []
        },

        // our maximum number of data points to plot
        MaxDataPoints = Options.maxDataPoints || 100,

        // optional scaling subdivision option
        XScaleTicks = Options.xScaleTicks || 6,

        // our cache of any "aliases" we'll put on our data keys; this could be extended to
        // affect data points, as well.
        TranslatedKeys,

        // when our graph is rendered the first time, we'll keep references to some of our D3
        // utility functions so we can refresh the line graph in the lightest, most efficient
        // way possible and avoid re-calculating everything
        XScaling,
        YScaling,
        Plotter,
        SVG;

//
// ===============================================================================================
// Private methods
//

    //
    // This is a convenience method to save us some keystrokes on checking whether something is
    // defined.
    //
    function isUndefined(variable) {
        return (typeof variable === 'undefined');
    }

    //
    // Given the ubiquity of using translations to layout SVGs, this method creates a normal
    // "translate" property for transforms to avoid extra string concatenation in what follows.
    // It exists primarily for readability/clarity.
    //
    function buildTranslation(xVal, yVal) {
        return 'translate(' + xVal + ', ' + yVal + ')';
    }

    //
    // This method applies an optional translation to our axis scale. For this use case, our times
    // come in as Unix times and we'll translate them to human-friendly values.
    //
    function createTranslatedScale(arr) {

        var
            translatedKeys = [],
            translator     = Options.keyTranslator,
            i,
            n;

        if (isUndefined(translator)) {
            return arr;
        }

        // if a translation method was provided, translate each item
        for (i = 0, n = arr.length; i < n; i++) {

            translatedKeys.push(
                translator(arr[i])
            );
        }

        return translatedKeys;
    }

    //
    // This is a convenience method for getting some key sizings of our graph - both the height/
    // width of the wrapper itself and the "usable" size for our SVG element.
    //
    function takeMeasurements() {

        var
            wrapper = $(Selector),
            header  = wrapper.find('.graph-header'),

            wrapperWidth    = wrapper.innerWidth(),
            wrapperHeight   = wrapper.innerHeight() - header.outerHeight(),

            measurements = {
                width          : wrapperWidth,
                height         : wrapperHeight,
                usableWidth    : wrapperWidth - (Padding.left + Padding.right),
                usableHeight   : wrapperHeight - (Padding.top + Padding.bottom)
            };

        return measurements;
    }

    //
    // This method renders the header for our graph instance, taking the title and other (future?)
    // relevant info from our options object.
    //
    function renderHeader(options) {

        var
            graphHeader = $('<div/>').addClass('graph-header'),

            // used in fleshing out our header below
            titleText;

        // normalize our options object for easier checks below
        options = isUndefined(options) ? {} : options;

        // add a title
        titleText = (isUndefined(options.title)) ? 'Graph' : options.title;
        graphHeader.text(titleText);

        return graphHeader;
    }

    //
    // This method creates a scaling object; it's a convenience wrapper for D3's built-in linear
    // scaling helper so we can handle X and Y axis scaling uniformly.
    //
    function createScaling(domainMin, domainMax, rangeMin, rangeMax) {
                
        var
            scale = d3.scale.linear()
                .domain([domainMin, domainMax])
                .range([rangeMin, rangeMax]);

        return scale;
    }

    //
    // This method creates our initial SVG object for plotting times and values. It creates the
    // axes and sets the labels. Drawing the line itself (path) is done in refresh.
    //
    // @NOTE We make the assumption D3 is available and ready; dangerous, but I figured we were
    // doing this in a controlled environment and could get away with it for now. We also assume
    // our data is coming up in a standard format ... an object with Time/Values properties.
    //
    // Note to self ... this is a fat method; circle back and look for ways to break this up into
    // smaller/clearer chunks when time allows.
    //
    function renderVisualization() {

        var
            svg = d3.select(Selector).append('svg'),

            // take measurements within our instance wrapper
            measurements = takeMeasurements(),

            // initial setup
            xMin = (isUndefined(Options.xScaleMin))
                ? d3.min(Data.Times)
                : Options.xScaleMin,

            xMax = (isUndefined(Options.xScaleMax))
                ? d3.max(Data.Times)
                : Options.xScaleMax,

            yMax = (isUndefined(Options.yScaleMax))
                ? d3.max(Data.Values)
                : Options.yScaleMax,

            xAxis,
            yAxis,

            // position our y-axis at the bottom ... irritating this isn't configurable to be
            // automatic, D3 ...
            yAxisTopOffset = measurements.usableHeight + Padding.top;

        XScaling = createScaling(xMin, xMax, 0, measurements.usableWidth);
        YScaling = createScaling(0, yMax, measurements.usableHeight, 0);

        Plotter = d3.svg.line()
            .x(function(d, i) {
                return XScaling(Data.Times[i]);
            })
            .y(function(d, i) {
                return YScaling(d);
            });

        // create our x/y axis create methods
        xAxis = d3.svg.axis()
            .tickFormat(function(d, i) {

                // apply custom formatting to our scale to make it user-friendly
                if (isUndefined(Options.keyTranslator)) {
                    return d;

                } else {
                    return Options.keyTranslator(d + (i * 10));
                }
            })
            .ticks(XScaleTicks)
            .scale(XScaling);

        yAxis = d3.svg.axis()
            .scale(YScaling)
            .ticks(4)
            .orient('left');

        // size our graph appropriately 
         svg
            .attr('width', measurements.width)
            .attr('height', measurements.height)
            .attr('class', 'graph-viz-wrapper');

        // create our y-axis legend (running horizontally)
        svg.append('g')
            .attr('transform', buildTranslation(Padding.left, yAxisTopOffset))
            .attr('class', 'graph-y-axis')
            .call(xAxis);

        svg.append('g')
            .attr('transform', buildTranslation(Padding.left, Padding.top))
            .attr('class', 'graph-y-axis')
            .call(yAxis)

            // slap on an axis label
            .append('text')
                .attr('class', 'axis-label')
                .attr('transform', buildTranslation(0, yAxisTopOffset + (Padding.bottom / 2)))
                .text('Time:');

        // stash a reference to our SVG element
        SVG = svg;
    }

    //
    // This method refreshes our line graph (SVG path) in the chart.
    //
    function refreshVisualization() {

        // check if any translation methods were given for the keys (in this case, time comes
        // as Unix times, and we can pass an optional translation method for formatting).
        // if this were a larger project, we could do the same type of thing for values, too.
        //TranslatedKeys = translateKeys(Data.Times);

        // if our graph shell hasn't been rendered (first time loading data), do so
        if (isUndefined(SVG)) {
            renderVisualization();
        }

        SVG.append('path')
            .attr('transform', buildTranslation(Padding.left, Padding.top))
            .attr('class', 'line-graph')
            .attr('d', Plotter(Data.Values))
            .attr('stroke-linejoin', 'round');
    }

    //
    // This is our method for fetching data from a given source; it's incredibly simplistic for
    // the purposes of this exercise, but could be fleshed out in any direction to help scale.
    //
    function fetchData(dataSource) {

        $.get(DataSource, function(response) {
            $this.update.call($this, response);
        });
    }

    //
    // This method builds out our graph shell in the given wrapper selector and governs the
    // construction process.
    //
    function render(selector, options) {

        var
            graphWrapper = $(selector);

        // if we can't find the element in the DOM, we're dead in the water; bail.
        if (graphWrapper.length === 0) {
            console.warn(
                "An element was not found from the given selector; can't graph:", 
                selector
            );

            return;
        }

        // render our HTML wrapper first so we can get accurate offsets for sizing the SVG
        graphWrapper.append(
            renderHeader(options)
        );

        // simply CSS-hook when our graph is good to go
        graphWrapper.addClass('graph-ready');
    }

    //
    // This method timestamps a single value from fetchData and returns a standard data object 
    // that contains both a Times and Values property for passing to our update method. It's used
    // by our dynamic charts and adds "now" as the Times value.
    //
    function timestampValue(data) {

        var
            timestamp = new Date(),

            dataObj = {
                Times   : [timestamp.getTime()],
                Values  : [data.value]
            };

        return dataObj;
    }

    //
    // 
    //
    function processData(data) {

        var
            //parsedResponse = JSON.parse(data),
            parsedResponse = data,

            // are we working with a fully-fleshed out obj (Times/Vals) or just a single update?
            dataObj = (isUndefined(parsedResponse.Values))
                ? timestampValue(parsedResponse)
                : parsedResponse,

            processedData = {},
            spliceFrom;

        if (isUndefined(dataObj.Times) || isUndefined(dataObj.Values)) {
            console.warn('Can not update graph with the given data object:', dataObj);
            return false;
        }

        processedData.Times  = Data.Times.concat(dataObj.Times);
        processedData.Values = Data.Values.concat(dataObj.Values);

        // truncate any items in our Times/Values arrays that are overflowing; we're assuming our
        // two datapoints are always in sync
        if (processedData.Times.length > MaxDataPoints) {

            //console.log('Reset');
            spliceFrom = processedData.Times.length - MaxDataPoints;

            processedData.Times  = processedData.Times.splice(spliceFrom, MaxDataPoints);
            processedData.Values = processedData.Values.splice(spliceFrom, MaxDataPoints);

            // re-render with the new scale
            SVG.remove();
            SVG = undefined;

            Options.xScaleMin = d3.min(Data.Times);
            Options.xScaleMax = d3.max(Data.Times) + Options.xScaleJump;
        }

        // update our data cache
        Data.Times  = processedData.Times;
        Data.Values = processedData.Values;

        return true;
        //$this.update(processedData);
    }

//
// ===============================================================================================
// Public methods
//

    //
    // This is a public method for checking the status of our current data in a Graph instance.
    // It's primarily here as a debugging helper and should probably be removed/stubbed if this
    // thing ever goes into a prod environment.
    //
    this.dataStatus = function() {
        console.log(Data);
    };

    //
    // This is our publicly-exposed method for updating our internal data cache.
    //
    this.update = function(data) {

        // pass our data along for processing
        if (processData(data)) {
            refreshVisualization();
        }
    };


//
// ===============================================================================================
// Initialization logic/actions
//

    // validate we have the required params
    if (isUndefined(Selector) || (typeof Selector !== 'string')) {
        console.warn('A valid selector string was not given to our Graph constructor.');
        HasRequiredParams = false;
    }

    if (isUndefined(DataSource) || (typeof DataSource !== 'string')) {
        console.warn('A valid data source was not provided to our Graph constructor.');
        HasRequiredParams = false;
    }

    // when everything checks out, bind with our data and render
    if (HasRequiredParams) {
        
        render(Selector, Options);

        // check for special handling via our options obj
        if (Options.isDynamic) {

            // dynamic charts require special scaling, as the entire list of values is built
            // over time

            // custom interval for refreshing?
            RefreshInterval = (isUndefined(Options.refreshInterval))
                ? RefreshInterval
                : Options.refreshInterval;


            // we found an auto-refresher ...
            AutoRefresh = setInterval(function() {

                //
                // POINT OF CONVERSATION! This is a stellar application for using web sockets
                // instead of simply polling the API like this ... 
                //
                fetchData(DataSource, true);

            }, RefreshInterval);
        }

        //
        // NOTE! We make a big assumption here that all of our Graphs are getting data from a web
        // service, so we automatically make a GET request to fetch data right off the bat. The
        // error handling here could be fleshed out a lot, but I kept it light for the purpose of
        // this exercise.
        //
        fetchData(DataSource);
    }
};