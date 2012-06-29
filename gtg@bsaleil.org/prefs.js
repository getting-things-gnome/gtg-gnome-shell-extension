const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

var prefs;

// Gnome-Shell entry point :
// Build preferences widget in extensions preferences menu
function buildPrefsWidget() 
{
	// Load preferences
	prefs = readPreferences();
	
	// Define settings with label, and id
	var settings = 
	[
		{label: "Hide existing menu", id : "HideExisting"},
		{label: "Display long tasks", id : "DisplayLong"},
		{label: "Use system theme", id : "SystemTheme"},
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
		hbox = createSetting(settings[setting]);
		mainBox.add(hbox);
	}	
	
	// Display settings
	mainBox.show_all();
	return mainBox;
}

// Create the hbox for the given setting
function createSetting(setting)
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
	let prefs = readPreferences();
	for (var i in prefs)
	{
		// If the preference exists, set new state
		if (i == id)
			prefs[i] = state;
	}
	
	writePreferences(prefs);
}

// Read array from preferences file (return an array)
function readPreferences()
{
	let r = GLib.file_get_contents(Extension.dir.get_path() + "/prefs.json");
	return JSON.parse(r[1]);
}

// Write array in preferences file.
function writePreferences(prefs)
{
	GLib.file_set_contents(Extension.dir.get_path() + "/prefs.json",JSON.stringify(prefs));
}

// Necessary
function init() {}
