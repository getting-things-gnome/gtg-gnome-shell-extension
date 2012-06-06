const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const GTGSearchProvider = Extension.imports.gtgsearchprovider;
const GTGCalendarMenu = Extension.imports.gtgcalendarmenu;

// Search provider instance
var GTGSPInstance = null;
var GTGCMInstance = null;

function init(meta) {}

function enable() 
{
	global.log("GTG extension enabled.");
	// Create the search provider
	if (GTGSPInstance==null)
	{
		GTGSPInstance = new GTGSearchProvider.GTGSearchProvider();
		Main.overview.addSearchProvider(GTGSPInstance);
		
		GTGCMInstance = new GTGCalendarMenu.GTGCalendarMenu();
	}
}

function disable()
{
	global.log("GTG extension disabled.");
	// Destroy the search provider
	if (GTGSPInstance!=null)
	{
		Main.overview.removeSearchProvider(GTGSPInstance);
		GTGSPInstance.destroy();
		GTGSPInstance = null;
		
		GTGCMInstance = null;
	}
}
