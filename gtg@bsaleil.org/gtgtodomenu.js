const St = imports.gi.St;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const GTGCalendarMenu = Extension.imports.gtgcalendarmenu;
const GTGDBus = Extension.imports.gtgdbus;

// TODO : scrollbar ?
// TODO : prefs timer seconds

var actors; 	// array : Contains actual actors in todo menu
var CMopened;	// bool  : Calendar menu is opened
var timerActive;	// bool	: Timer is active

const GTGTodoMenu = new Lang.Class({
	Name: 'GTGTodoMenu',

	_init: function()
	{
		timerActive = true;
		actors = [];
		
		// Vertical separator
		let calendar = getChildByName(Main.panel._dateMenu.menu.box, 'calendarArea');
		this.addSeparator(calendar);
		
		// Main box
		this.todoBox = new St.BoxLayout();
		this.todoBox.set_vertical(true);
		calendar.add_actor(this.todoBox, {expand: true});
		
		// Start the timer
		this.refresh();
		
		// Menu opened - closed
        	Main.panel._dateMenu.menu.connect('open-state-changed', Lang.bind(this,
		function(menu, isOpen) {
			CMopened = isOpen;
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
	
	refresh: function()
	{
		// If the calendar menu is closed
		if (!CMopened)
		{
			// Remove actual actors
			for (i=0; i<actors.length; i++)
				this.todoBox.remove_actor(actors[i].actor);
	
			// Display tasks only if gtg is running
			if (!GTGCalendarMenu.running)
			{
				this.displayBlockedItem("GTG is closed");
			}
			else
			{
				tasks = GTGCalendarMenu.allTasks;
	
				// Display all tasks without start and due date
				for (i=0; i<tasks.length; i++)
					if (tasks[i].startdate == "" && tasks[i].duedate == "")
						this.displayTodo(tasks[i]);
			}
		}
		// Stop the timer if extension diabled
		if (timerActive)
			this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this.refresh));
	},
	
	// Display a blocked item (non-clickable) with given string
	displayBlockedItem: function(title)
	{
		let item = new PopupMenu.PopupMenuItem(title,{reactive:false});
		item.actor.add_style_class_name("task");
		this.todoBox.add(item.actor,{y_align: St.Align.START,y_fill: false});		
		actors.push(item);
	},
	
	// Display a task
	displayTodo: function(task)
	{
		let title = task.title;
		let item = new PopupMenu.PopupMenuItem(title);
		item.actor.add_style_class_name("task");
		item.connect('activate', function() {
			GTGDBus.openTaskEditor(task.id);
			Main.panel._dateMenu.menu.close();
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
