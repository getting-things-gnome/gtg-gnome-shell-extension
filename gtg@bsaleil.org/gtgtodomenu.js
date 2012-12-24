const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const GTGCalendarMenu = Extension.imports.gtgcalendarmenu;
const GTGDBus = Extension.imports.gtgdbus;
const Preferences = Extension.imports.prefs;

const LENGTHMAX = 40; // Maximum length of a displayed task

var allTasks;	// array : Contains all the tasks
var running;	// bool : GTG is running
var actors;	// array : Contains actual actors in calendar menu
var prefs;	// array : Contains actual values of preferences

const GTGTodoMenu = new Lang.Class({
	Name: 'GTGTodoMenu',

	_init: function()
	{
		// Load tasks
		allTasks = new Array();
		loadTasks();
		running = false;
		actors = [];
		
		// Signals
		this.addedSignal = GTGDBus.GTGProxy.connect('TaskAdded',
			function(sender, tid) { loadTasks(); });
		this.modifiedSignal = GTGDBus.GTGProxy.connect('TaskModified',
			function(sender, tid) { loadTasks(); });
    		this.deletedTask = GTGDBus.GTGProxy.connect('TaskDeleted',
    			function(sender, tid) { loadTasks(); });
    		
    		// Watch GTG state
		GTGDBus.DBus.session.watch_name("org.gnome.GTG", false,
			function() { running=true; loadTasks(); },
			function() { running=false; loadTasks(); });
		
		// Load preferences
		prefs = Preferences.readPreferences();
		
		// Monitor on prefs.json file
		let prefsJSON = Gio.file_new_for_path(Extension.dir.get_path() + "/prefs.json");
		this.monitor = prefsJSON.monitor(Gio.FileMonitorFlags.NONE, null);
		this.monitor.connect('changed', function(){prefs = Preferences.readPreferences();});
		
		// Vertical separator
		let calendar = getChildByName(Main.panel.statusArea.dateMenu.menu.box, 'calendarArea');
		this.addSeparator(calendar);
		
		// Todo box
		this.todoBox = new St.BoxLayout();
		this.todoBox.set_vertical(true);
		this.todoBox.add_style_class_name("todoBox");
		
		// Scroll view
		this.scrollView = new St.ScrollView({style_class: 'vfade',
                                          hscrollbar_policy: Gtk.PolicyType.NEVER,
                                          vscrollbar_policy: Gtk.PolicyType.ALWAYS});
		this.scrollView.add_actor(this.todoBox);
		calendar.add_actor(this.scrollView);
		
		// If calendar menu is open, display todos
        	Main.panel.statusArea.dateMenu.menu.connect('open-state-changed', Lang.bind(this,
		function(menu, isOpen) {
			if (isOpen) this.displayTodos();
        	}));
	},
	
	addSeparator : function(calendar)
	{
		this.separator = new St.DrawingArea({
			style_class: 'calendar-vertical-separator',
			pseudo_class: 'highlighted'
		});
		this.separator.connect('repaint', Lang.bind(this, onVertSepRepaint));
		calendar.add_actor(this.separator);
	},
	
	displayTodos: function()
	{
		// Remove actual actors
		for (let i=0; i<actors.length; i++)
			this.todoBox.remove_actor(actors[i].actor);

		// Display tasks only if gtg is running
		if (!running)
		{
			this.displayBlockedItem("GTG is closed");
		}
		else
		{	
			// Display all tasks without start and due date
			var nbTasks = 0;
			for (i=0; i<allTasks.length; i++)
				if (allTasks[i].startdate == "" && allTasks[i].duedate == "")
				{
					this.displayTodo(allTasks[i]);
					nbTasks++;
				}
			if (nbTasks < 1)
				this.displayBlockedItem("Nothing");
		}
	},
	
	// Display a blocked item (non-clickable) with given string
	displayBlockedItem: function(title)
	{
		let item = new PopupMenu.PopupMenuItem(title,{reactive:false});
		
		// Check preferences
		if (prefs.SystemTheme)
			item.actor.add_style_class_name("task");
			
		this.todoBox.add(item.actor,{y_align: St.Align.START,y_fill: false});		
		actors.push(item);
	},
	
	// Display a task
	displayTodo: function(task)
	{
		let title = task.title;
		// Adjust length
		if (title.length > LENGTHMAX)
			title = title.substr(0,LENGTHMAX) + "..."
		
		let item = new PopupMenu.PopupMenuItem(title);
		
		// Check preferences
		if (prefs.SystemTheme)
			item.actor.add_style_class_name("task");
			
		item.connect('activate', function() {
			GTGDBus.openTaskEditor(task.id);
			Main.panel.statusArea.dateMenu.menu.close();
		});
		this.todoBox.add(item.actor,{y_align: St.Align.START,y_fill: false});
		actors.push(item);
	},
	
	// Destroy items
	destroy: function()
	{
		timerActive = false;
		this.todoBox.destroy();
		this.separator.destroy();
		this.monitor.cancel();
	}
	
});

// Repaint vertical separator
function onVertSepRepaint(area)
{
	let cr = area.get_context();
	let themeNode = area.get_theme_node();
	let [width, height] = area.get_surface_size();
	let stippleColor = themeNode.get_color('-stipple-color');
	let stippleWidth = themeNode.get_length('-stipple-width');
	let x = Math.floor(width/2) + 0.5;
	cr.moveTo(x, 0);
	cr.lineTo(x, height);
	Clutter.cairo_set_source_color(cr, stippleColor);
	cr.setDash([1, 3], 1); // Hard-code for now
	cr.setLineWidth(stippleWidth);
	cr.stroke();
}

// Get child with given parent and name
function getChildByName (a_parent, name) 
{
	return a_parent.get_children().filter(
	function(elem)
	{
		return elem.name == name
	})[0];
}

// Load tasks in "alltasks"
function loadTasks()
{	
	// If gtg is running
	if (running)
	{
		GTGDBus.getActiveTasks(['@all'], function (tasks) {
		allTasks = new Array();
		for (var i in tasks) {
		    allTasks.push(tasks[i]);
		}
		});
	}
	else { allTasks = new Array(); }
}
