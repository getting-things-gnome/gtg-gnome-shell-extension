#GTG integration with GNOME Shell

The integration of GTG with GNOME Shell was a 2012 Summer of Code project realized by [Baptiste Saleil](https://github.com/bsaleil).

 - [extension page](https://extensions.gnome.org/extension/409/gtg-integration/)
 - [Summer of Code project page](https://wiki.gnome.org/Outreach/SummerOfCode/2012/Projects/BaptisteSaleil_GTG_GNOME_Shell)
 - created by [Baptiste Saleil](https://github.com/bsaleil)

##Installation

Automatically from extensions repository:

 1. Visit [GTG Integration](https://extensions.gnome.org/extension/409/gtg-integration/) extension page
 2. Change the switch button to `ON` and accept download.

### Manuall installation

Extension can be installed from git:

```
mkdir ~/code
git clone https://github.com/getting-things-gnome/gtg-gnome-shell-extension.git ~/code/gtg-gnome-shell-extension
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s ~/code/gtg-gnome-shell-extension/gtg@bsaleil.org ~/.local/share/gnome-shell/extensions/gtg@bsaleil.org
```

Afterwards restart GNOME Shell by pressing `ALT+F2` and running command `r`.

##Usage

###Search in overview

![Search in overview](https://raw.githubusercontent.com/getting-things-gnome/gtg-gnome-shell-extension/master/documents/guadec/search.png "Search in overview")

This feature is simple to use.
Open the overview by pressing "super" key or move your mouse on top left corner or click on "Activities" button, type some letters to search in your tasks, and the extension will displays results.
The task editor will be open if you click on a task.

###Calendar menu

![Calendar Menu](https://raw.githubusercontent.com/getting-things-gnome/gtg-gnome-shell-extension/master/documents/guadec/calendar.png "Calendar Menu")

The second feature bring with the extension is the calendar menu which can be open by clicking on the date in the topbar.
For now, the GTG calendar menu will replace the existing, synchornization of both is planned for the future.
This menu can be split in two others, tasks menu and todo list.

####Tasks menu

This menu shows GTG's tasks to do for selected day in calendar menu, on the left.
You can see two different colors for your tasks.
The first one (Grey) displays tasks which has start date identic to the day selected and the second one (Dark grey) displays only tasks with a start date before the day selected and/or a due date after the day selected.

####Todo list

On the right side of the calendar menu is the todo list.
This menu displays only tasks without start date AND without due date.
By this way, every tasks are listed to user.

###Preferences

![Preferences](https://raw.githubusercontent.com/getting-things-gnome/gtg-gnome-shell-extension/master/documents/guadec/prefs.png "Preferences")
