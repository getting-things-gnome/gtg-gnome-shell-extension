const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

var prefs;
var daysLongTaskBox;

// Gnome-Shell entry point :
// Build preferences widget in extensions preferences menu
function buildPrefsWidget() 
{
	// Load preferences
	prefs = readPreferences();
	
	// Define settings with label, and id
	var settings = 
	[
		{label: "Hide existing menu", id : "HideExisting", type : 'b'},
		{label: "Display long tasks", id : "DisplayLong", type : 'b'},
		{label: "Number of days for a long task", id : "DaysLongTask", type : 'i'},
		{label: "Use system theme", id : "SystemTheme", type : 'b'},
	]

	// Create main box
	let mainBox = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 20,
		margin_top: 10,
		margin: 20
	});
	
	// Create settings
	var hbox;
	for (setting in settings)
	{
		if (settings[setting].type == 'b')
			hbox = createBoolSetting(settings[setting]);
		else if (settings[setting].type == 'i')
			hbox = createIntSetting(settings[setting]);
		mainBox.add(hbox);
	}	
	
	// Display settings
	mainBox.show_all();
	return mainBox;
}

// Create the hbox for the given int setting
function createIntSetting(setting)
{
	// Label
	let label = new Gtk.Label({
		label: setting.label,
		xalign: 0
	});
	
	// Spin button
	let adjustment = new Gtk.Adjustment({ lower: 30, upper: 365, step_increment: 1});
	let button = new Gtk.SpinButton({adjustment: adjustment,snap_to_ticks: true});
	button.set_value(prefs[setting.id]);
	button.connect('value-changed', function(entry){stateChanged(setting.id,entry.value)});
	
	let box = new Gtk.Box({
		orientation: Gtk.Orientation.HORIZONTAL,
		margin_top: 5
	});
	box.pack_start(label, true, true, 0);
	box.add(button);
	
	// If it's the "dayslongtask" item, it depends on DisplayLong state
	if (setting.id == "DaysLongTask")
	{
		box.set_sensitive(!prefs["DisplayLong"]);
		daysLongTaskBox = box;
	}
	return box;
}

// Create the hbox for the given string setting
function createBoolSetting(setting)
{
	// Label
	let label = new Gtk.Label({
		label: setting.label,
		xalign: 0
	});
	
	// Switch button
	let button = new Gtk.Switch({active: prefs[setting.id]});	
	button.connect('notify::active', function(obj){stateChanged(setting.id,obj.active)});
	
	let box = new Gtk.Box({
		orientation: Gtk.Orientation.HORIZONTAL,
		margin_top: 5
	});
	box.pack_start(label, true, true, 0);
	box.add(button);
	return box;
}

// Called when a state of one setting changed
function stateChanged(id,state)
{
	for (var i in prefs)
	{
		// If the preference exists, set new state
		if (i == id)
			prefs[i] = state;
	}
	
	daysLongTaskBox.set_sensitive(!prefs["DisplayLong"]);
	writePreferences();
}

// Read array from preferences file (return an array)
function readPreferences()
{
	let r = GLib.file_get_contents(Extension.dir.get_path() + "/prefs.json");
	return JSON.parse(r[1]);
}

// Write array in preferences file.
function writePreferences()
{
	GLib.file_set_contents(Extension.dir.get_path() + "/prefs.json",JSON.stringify(prefs));
}

// Necessary
function init() {}
