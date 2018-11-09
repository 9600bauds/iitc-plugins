// ==UserScript==
// @id             iitc-plugin-open-in-fieldsim
// @name           IITC plugin: Open in ICFS
// @category       Misc
// @version        0.1
// @namespace      fieldsimmer
// @updateURL      https://github.com/9600bauds/iitc-plugins/raw/master/open-in-fieldsim/open-in-fieldsim.user.js
// @downloadURL    https://github.com/9600bauds/iitc-plugins/raw/master/open-in-fieldsim/open-in-fieldsim.user.js
// @description    Open an approximate copy of the current screen in the Ingress Control Field Simulator.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.fieldsimmer = function() {};

window.plugin.fieldsimmer.forgeUrl = function() {
	var boardsize = 400; //The default Ingress Control Field Simulator board size. I highly recommend you modify this value, then rightclick -> inspect element on ICFS and manually set the board width and height to that.
	var eligible_portals = [];
	var lowest_lat = 99999;
	var highest_lat = -99999;
	var lowest_lng = 99999;
	var highest_lng = -99999;
	var b = window.map.getBounds();
	for(var listindex in window.portals) {
		var p = window.portals[listindex];
		// skip if not currently visible
		if(p._latlng.lat < b._southWest.lat || p._latlng.lng < b._southWest.lng ||
			p._latlng.lat > b._northEast.lat || p._latlng.lng > b._northEast.lng) continue;
		eligible_portals.push(p);
		lowest_lat = Math.min(lowest_lat, p._latlng.lat)
		highest_lat = Math.max(highest_lat, p._latlng.lat)
		lowest_lng = Math.min(lowest_lng, p._latlng.lng)
		highest_lng = Math.max(highest_lng, p._latlng.lng)
	}
	
	var counter = 0;
	var final_str = "http://melpon.github.io/cfsimu/english.html?p=";
	final_str += serialize_int(1); //portal_id
	final_str += serialize_int(0); //current
	final_str += serialize_int(eligible_portals.length);
	for(var listindex in eligible_portals) {
		var p = eligible_portals[listindex];
		
		counter += 1;
		final_str += serialize_int(counter); //arbitrary id
		final_str += serialize_string(p.options.data.title.replace(/\"/g, "\\\"")); //portal name
		var x = parseInt(crazy_lerp(p._latlng.lng, highest_lng, lowest_lng) * boardsize);
		final_str += serialize_int(x);
		var y = parseInt(crazy_lerp(p._latlng.lat, lowest_lat, highest_lat) * boardsize);
		final_str += serialize_int(y);
		final_str += 'r'; //todo?
	}
	
	window.open(final_str, '_blank');
}

var ENCODE_STR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var DECODE_OBJ = {};
for (var i = 0; i < ENCODE_STR.length; i++) {
	DECODE_OBJ[ENCODE_STR[i]] = i;
};
var serialize_int = function(num) {
	//return num + "-";
	// 5bit compressed encoding.
	var result = '';
	while (num >= 32) {
		result += ENCODE_STR[(num & 0x1f) + 32];
		num >>= 5;
	}
	result += ENCODE_STR[num];

	return result;
}
var serialize_string = function(str) {
	//return str + "-";
	var result = '';
	str = encodeURIComponent(str);
	result += serialize_int(str.length);
	result += str;
	return result;
}

var crazy_lerp = function(x, a, b) {
	if(a == b) return 1
	var result = (b - x)/(b - a);
	if(result > 1) return 1;
	if(result < 0) return 0;
	return result;
}

var setup = function() {
	$('#toolbox').append('<a onclick="window.plugin.fieldsimmer.forgeUrl()" title="Open a new tab simulating the portals in view on the Ingress Control Field Simulator.">Field Sim</a>');
}



// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
