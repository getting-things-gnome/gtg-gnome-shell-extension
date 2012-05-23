const Mainloop = imports.mainloop;
const Search = imports.ui.search;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const GLib = imports.gi.GLib;
const Process = GLib.Process;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const GTGDBus = Extension.imports.gtgdbus;

const SP_NAME = "GTG TASKS";
let allTasks; 		// array : Contains all the tasks
let running;		// bool : GTG is running

const GTGSearchProvider = new Lang.Class({
	Name: 'GTGSearchProvider',
	Extends: Search.SearchProvider,

	_init: function(name)
	{
		Search.SearchProvider.prototype._init.call(this, SP_NAME);
		running = false;
		
		// Create tasks list
		allTasks = new Array();
		loadTasks();
		
		// Signals
		this.addedSignal = GTGDBus.GTGProxy.connect('TaskAdded',
			function(sender, tid) { loadTasks(); });
		this.modifiedSignal = GTGDBus.GTGProxy.connect('TaskModified',
			function(sender, tid) { loadTasks(); });
    		this.deletedTask = GTGDBus.GTGProxy.connect('TaskDeleted',
    			function(sender, tid) { loadTasks(); });
		
		// Watch GTG state
		GTGDBus.DBus.session.watch_name("org.gnome.GTG", false,
			function() { global.log('apparait'); running=true; loadTasks(); },
			function() { running=false; loadTasks(); });
		
		return true;
	},

	getResultMetas: function(resultIds)
	{	
		let appSys = Shell.AppSystem.get_default();
		let app = appSys.lookup_app("gtg.desktop");
		var results = new Array();
		for (let i=0; i<resultIds.length; i++)
		{
			results.push({'id': resultIds[i][0],
			'name': resultIds[i][1],
			'createIcon': function(size) {return app.create_icon_texture(size);}});
		}
		return results;
	},

	activateResult: function(id)
	{
		GTGDBus.openTaskEditor(id);
	},

	getInitialResultSet: function(terms)
	{
		sTerms = terms.toString().replace(',','');
		pattern = new RegExp(sTerms,"gi");
	
		results = new Array();
		for (var i in allTasks)
		{
			// Search in title and text
			var s = allTasks[i].title + " " + allTasks[i].text;
			s = s.replace('<content>','').replace('</content>','').replace(/\s/g,'');
		
			if (s.match(pattern))
			{
				result = [allTasks[i].id, allTasks[i].title];
				results.push(result);
			}
		}
		return results;
	},

	getSubsearchResultSet: function(previousResults, terms)
	{
		return this.getInitialResultSet(terms);
	},
	
	destroy: function()
	{
		GTGDBus.GTGProxy.disconnect(this.addedSignal);
		GTGDBus.GTGProxy.disconnect(this.modifiedSignal);
		GTGDBus.GTGProxy.disconnect(this.deletedTask);
	}
});

// load all the tasks in "allTasks"
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
