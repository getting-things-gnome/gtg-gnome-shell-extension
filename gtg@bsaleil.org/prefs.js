const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

// Gnome-Shell entry point :
// Build preferences widget in extensions preferences menu
function buildPrefsWidget() 
{
	// Load preferences
	let prefs = readPreferences();

	// Create main box
	let mainBox = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 20,
		spacing: 20
	});

	// UI : "Hide existing" item
	let labelHE = createLabel("Hide existing menu :\n<small>(Hide the original menu when extension is enabled)</small>");
	let checkHE = new Gtk.CheckButton();
	let hboxHE = createHBox(labelHE,checkHE);
	
	// UI : "Display long" item
	let labelDL = createLabel("Display long tasks:\n<small>(Display tasks that started long ago, and those ending in a long time)</small>");
	let checkDL = new Gtk.CheckButton();
	let hboxDL = createHBox(labelDL,checkDL);
	
	// UI : "System theme" item
	let labelST = createLabel("Use system theme:\n<small>(Display the gtg extension menu with a system-like theme)</small>");
	let checkST = new Gtk.CheckButton();
	let hboxST = createHBox(labelST,checkST);

	// UI : Add the horizontal boxes
	mainBox.add(hboxHE);
	mainBox.add(hboxDL);
	mainBox.add(hboxST);
	
	// Connect toggled signal of checkboxes
	checkHE.connect('toggled', function(obj){stateChanged("HideExisting",obj.active)});
	checkDL.connect('toggled', function(obj){stateChanged("DisplayLong",obj.active)});
	checkST.connect('toggled', function(obj){stateChanged("SystemTheme",obj.active)});
	
	// Set actual state of preferences
	checkHE.set_active(prefs.HideExisting);
	checkDL.set_active(prefs.DisplayLong);
	checkST.set_active(prefs.SystemTheme);
	
	mainBox.show_all();
	return mainBox;
}

// Create and return a new horizontal box with given label and checkbox
function createHBox(label,checkbox)
{
	let hbox = new Gtk.Box({
		orientation: Gtk.Orientation.HORIZONTAL,
		spacing: 20
	});
	hbox.add(label);
	hbox.add(checkbox);
	return hbox;
}

// Create and return a new label with given text
function createLabel(text)
{
	let label = new Gtk.Label({
		label: text,
		use_markup: true
	});
	return label;
}

// Called when a state on one of the preferences changed
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
