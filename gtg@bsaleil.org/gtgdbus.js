const DBus = imports.dbus; // imports DBus

// Interface
const GTGIFace = 
{
    name: 'org.gnome.GTG',
    methods: 
    [
    	{ name: 'GetActiveTasks', inSignature: 'as', outSIgnature: 'aa{sv}' },
	{ name: 'OpenTaskEditor', inSignature: 's', outSignature: '' },
	{ name: 'ShowTaskBrowser', inSignature: '', outSignature: ''}
    ],
    signals:
    [
    	{ name: 'TaskAdded', inSignature: 's'},
	{ name: 'TaskModified', inSignature: 's'},
        { name: 'TaskDeleted', inSignature: 's'}
    ]
};

// Proxy
const GTGDbus = DBus.makeProxyClass(GTGIFace);
const GTGProxy = new GTGDbus(DBus.session, 'org.gnome.GTG', '/org/gnome/GTG');

//
// Functions
//

// Open the task editor with the given task
function openTaskEditor(id) { GTGProxy.OpenTaskEditorRemote(id); }

// Call the "GetActiveTasks" method in DBus interface
function getActiveTasks(tags, callback)
{
    function handler(results, error)
    {
        if (error != null)
            global.logError("Error retrieving GTG tasks: "+error);
        else
            callback(results);
    }
    GTGProxy.GetActiveTasksRemote(tags, handler);
}
