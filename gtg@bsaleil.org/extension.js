const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const GTGSearchProvider = Extension.imports.gtgsearchprovider;

// Search provider instance
var GTGSPInstance = null;

function init(meta) {}

function enable() 
{
	global.log("GTG extension enabled.");
	// Create the search provider
	if (GTGSPInstance==null)
	{
		GTGSPInstance = new GTGSearchProvider.GTGSearchProvider();
		Main.overview.addSearchProvider(GTGSPInstance);
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
	}
}
