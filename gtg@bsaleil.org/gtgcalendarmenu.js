const St = imports.gi.St;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const GTGDBus = Extension.imports.gtgdbus;
const Preferences = Extension.imports.prefs;
const Calendar = imports.ui.calendar;
const Gettext = imports.gettext;
const _ = Gettext.domain('gtgextension').gettext;

const LENGTHMAX = 40; 	// Maximum length of a displayed task

var allTasks;	// array : Contains all the tasks
var running;	// bool : GTG is running
var actors;	// array : Contains actual actors in calendar menu
var prefs;	// array : Contains actual values of preferences

// TODO : Fix hover bug
// TODO : Fix scrollbar bug
// TODO : Sort tasks before reading (in load tasks)

const GTGCalendarMenu = new Lang.Class({
	Name: 'GTGCalendarMenu',

	_init: function(name)
	{
		let locales = Extension.dir.get_path() + "/locale";
		Gettext.bindtextdomain('gtgextension', locales);
		
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
		loadPreferences();
		
		// Monitor on prefs.json file
		let prefsJSON = Gio.file_new_for_path(Extension.dir.get_path() + "/prefs.json");
		this.monitor = prefsJSON.monitor(Gio.FileMonitorFlags.NONE, null);
		this.monitor.connect('changed', function(){loadPreferences();});
		
		// Vertical separator
		let calendar = getChildByName(Main.panel.statusArea.dateMenu.menu.box, 'calendarArea');
		this.addSeparator(calendar);
		
		// Main box
		this.mainBox = new St.BoxLayout();
		this.mainBox.set_vertical(true);
		this.mainBox.add_style_class_name("mainBox");
		calendar.add_actor(this.mainBox);
		
		// Scroll view
		this.scrollView = new St.ScrollView({style_class: 'vfade',
                                          hscrollbar_policy: Gtk.PolicyType.NEVER,
                                          vscrollbar_policy: Gtk.PolicyType.ALWAYS});
		this.scrollView.add_actor(this.mainBox);
		this.mainBox.add_actor(this.scrollView, {expand: true});
		
		// Tasks box
		this.tasksBox = new St.BoxLayout();
		this.tasksBox.set_vertical(true);
		this.scrollView.add_actor(this.tasksBox);
		
		// Gtg button
		this.gtgButton = new PopupMenu.PopupMenuItem(_("Open GTG"));
		this.mainBox.add(this.gtgButton.actor,
			{y_align: St.Align.END,
		        expand: true,
		        y_fill: false});
		this.gtgButton.connect('activate', this.openGTG);
		
		// New date selected
		Main.panel.statusArea.dateMenu._calendar.connect('selected-date-changed', Lang.bind(this,
		function(calendar, date) {
			this.dateChanged(date);
        	}));
        	
        	// Menu opened - closed
        	Main.panel.statusArea.dateMenu.menu.connect('open-state-changed', Lang.bind(this,
		function(menu, isOpen) {
			if (isOpen)
				this.dateChanged(new Date());
        	}));
        	
        	
	},
	
	addSeparator : function(calendar)
	{
		this.separator = new St.DrawingArea({style_class: 'calendar-vertical-separator',
		pseudo_class: 'highlighted' });
		this.separator.connect('repaint', Lang.bind(this, onVertSepRepaint));
		calendar.add_actor(this.separator);
	},
	
	// New date selected in the calendar
	dateChanged: function(d)
	{
		// Remove hour
		let day = new Date(d.getFullYear(),d.getMonth(),d.getDate());
	
		this.removeActors();
		
		this.displayTasksForDay(day);
	
		let today = new Date();
		if (this.sameDay(day,today))
		{
			let tomorrow = new Date(day.getTime() + 86400000);
			this.displayTasksForDay(tomorrow);
		}
	},
	
	// Display tasks for given day
	displayTasksForDay: function(day)
	{
		// Title
		let isToday = false;
		let isTomorrow = false;
		let strTitle = "";
		let today = new Date();
		let tomorrow = new Date(today.getTime() + 86400000);
		let title;
		if (this.sameDay(day,today))
		{
			strTitle = _("Today");
			isToday = true;
		}
		else if (this.sameDay(day,tomorrow))
		{
			strTitle = _("Tomorrow")
			isTomorrow = true;
		}
		else
		{
			dateFormat = _("%A, %B %d");
        		strTitle = day.toLocaleFormat(dateFormat);
        	}
        	title = new PopupMenu.PopupMenuItem(strTitle, {reactive: false});
        	title.actor.set_style("padding-top : 10px");
        	// Check preferences
        	if (prefs.SystemTheme)
			title.actor.add_style_class_name("dayTitle");
		
		this.tasksBox.add(title.actor,{y_align: St.Align.START,y_fill: false});
		actors.push(title);
		
		// Day tasks
		if (!running)
		{
			this.displayBlockedItem(_("GTG is closed"));
		}
		else
		{
			var nbTasks = 0;
			// First block
			for (i=0; i<allTasks.length; i++)
			{
				let ret = allTasks[i].startdate.split('-');
				let startDate = new Date(ret[0],ret[1]-1,ret[2]);

				// If start date == day selected, display on first block
				// Display also if keywords "now"
				if (this.compareDays(day,startDate) == 0 
					|| (isToday && allTasks[i].duedate == "now"))
				{
					nbTasks++;
					this.displayTask(allTasks[i],false);
				}
				
				// Keyword "soon"
				if (allTasks[i].startdate == "" || this.compareDays(startDate,day) == -1)
				{
					if ((isToday || isTomorrow) && allTasks[i].duedate == "soon")
					{
						nbTasks++;
						this.displayTask(allTasks[i],false);
					}
				}
			}			
			
			// Second block
			for (i=0; i<allTasks.length; i++)
			{
				let ret = allTasks[i].startdate.split('-');
				let startDate = new Date(ret[0],ret[1]-1,ret[2]);
				ret = allTasks[i].duedate.split('-');
				let dueDate = new Date(ret[0],ret[1]-1,ret[2]);
				
				// Check preferences and hide long tasks if needed
				if (prefs.DisplayLong || ( !this.longTask(day,startDate) && !this.longTask(day,dueDate)))	
				{
					// Display multiple days tasks with start date
					if (this.compareDays(startDate,day) == -1)
					{
						if (allTasks[i].duedate == "someday")
						{
							nbTasks++;
							this.displayTask(allTasks[i],true);
						}
						if (!this.validDay(dueDate) && allTasks[i].duedate != "soon" && allTasks[i].duedate != "someday")
						{
							nbTasks++;
							this.displayTask(allTasks[i],true);
						}
						else if (this.validDay(dueDate)
							&& this.compareDays(dueDate,day) != -1)
						{
							nbTasks++;
							this.displayTask(allTasks[i],true);
						}
					}
					
					// If keyword "someday"
					else if (allTasks[i].startdate == "" && allTasks[i].duedate == "someday")
					{
						nbTasks++;
						this.displayTask(allTasks[i],true);
					}
				
					// Display multiple days tasks without start date
					else if (!this.validDay(startDate))
					{
						if (this.validDay(dueDate)
							&& this.compareDays(dueDate,day) != -1)
						{
							nbTasks++;
							this.displayTask(allTasks[i],true);
						}
					}
				}
			}
			
			if (nbTasks < 1)
				this.displayBlockedItem(_("Nothing Scheduled"));
		}		
	},
	
	// Display a task on the menu
	displayTask: function(task,multipleDayTask)
	{
		var strTask = task.title;
		// Adjust length
		if (strTask.length > LENGTHMAX)
			strTask = strTask.substr(0,LENGTHMAX) + "..."
		
		let taskItem = new PopupMenu.PopupMenuItem(strTask);
		taskItem.actor.set_style("padding-left:50px;");
		
		taskItem.connect('activate', function() {
			GTGDBus.openTaskEditor(task.id);
			Main.panel.statusArea.dateMenu.menu.close();
		});		
		
		// Check preferences
		if (multipleDayTask)
			if (prefs.SystemTheme)
				taskItem.actor.add_style_class_name("multipleDayTask");
		else
			if (prefs.SystemTheme)
				taskItem.actor.add_style_class_name("task");
		
		this.tasksBox.add(taskItem.actor,{y_align: St.Align.START,y_fill: false});
		actors.push(taskItem);
	},
	
	// Display a blocked item (non-clickable) with given string
	displayBlockedItem: function(title)
	{
		let item = new PopupMenu.PopupMenuItem(title,{reactive:false});
		item.actor.set_style("padding-left:50px");
		
		// Check preferences
		if (prefs.SystemTheme)
			item.actor.add_style_class_name("task");
		
		this.tasksBox.add(item.actor,{y_align: St.Align.START,y_fill: false});		
		actors.push(item);
	},
	
	// Compare two days
	sameDay: function(day1,day2)
	{
		return (day1.getDate() == day2.getDate() &&
		    	day1.getMonth() == day2.getMonth() &&
		    	day1.getYear() == day2.getYear());
	},

	// Compare two days : 0 if ==, 1 if >, -1 if <	  
	compareDays: function (day1, day2)
	{
		var diff = day1.getTime()-day2.getTime();
		return (diff==0?diff:diff/Math.abs(diff));
	},
	
	// Determines if the given day is a day of a long task (true if long task, else false)
	longTask: function (selectedDay,taskDay)
	{
		// Check preferences
        	var longTaskDays = prefs.DaysLongTask;
        	let dayA = new Date(selectedDay.getFullYear(),selectedDay.getMonth(),selectedDay.getDate());
		let dayB = new Date(taskDay.getFullYear(),taskDay.getMonth(),taskDay.getDate());
		// Get number of days between them
		var diff = Math.abs(Math.ceil((dayA.getTime() - dayB.getTime())/(1000*60*60*24)));
		if (diff > longTaskDays)
			return true;
		else
			return false;
	},
	
	// true if valid day, false if not
	validDay: function(day)
	{
		return !isNaN(day.getTime());
	},
	
	// Remove existings actors from the menu
	removeActors: function()
	{
		for (let i=0; i<actors.length; i++)
		{
			this.tasksBox.remove_actor(actors[i].actor);
		}
	},
	
	// Open GTG if it's closed
	openGTG: function()
	{
		if (running)
			GTGDBus.GTGProxy.ShowTaskBrowserRemote();
		else
			Util.spawn(['gtg']);
		
		Main.panel.statusArea.dateMenu.menu.close();
	},
	
	// Destroy calendar menu
	destroy: function()
	{
		this.mainBox.destroy();
		this.separator.destroy();
		GTGDBus.GTGProxy.disconnect(this.addedSignal);
		GTGDBus.GTGProxy.disconnect(this.modifiedSignal);
		GTGDBus.GTGProxy.disconnect(this.deletedTask);
		this.monitor.cancel();
		
		// Show existing menu
		showSystemTasksList();
	}
});

// Get child with given parent and name
function getChildByName (a_parent, name) 
{
	return a_parent.get_children().filter(
	function(elem)
	{
		return elem.name == name
	})[0];
}

// Show existing calendar menu
function showSystemTasksList()
{
	let planning = Main.panel.statusArea.dateMenu._eventList.actor.get_parent();
	let items = planning.get_parent().get_children();
	let index = items.indexOf(planning);
	items[index].show()
	items[(index == 0) ? index+1 : index-1].show()
}

// Hide existing calendar menu
function hideSystemTasksList()
{
	let planning = Main.panel.statusArea.dateMenu._eventList.actor.get_parent();
	let items = planning.get_parent().get_children();
	let index = items.indexOf(planning);
	items[index].hide();
	items[(index == 0) ? index+1 : index-1].hide();
}

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

// Load preferences in "prefs"
function loadPreferences()
{
	prefs = Preferences.readPreferences();
	if (prefs.HideExisting)
		hideSystemTasksList();
	else
		showSystemTasksList();
}
