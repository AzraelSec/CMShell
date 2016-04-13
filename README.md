# CMShell

> Why not?

CMShell is a simple, highly customizable and easily extensible static content managment system
that allows you to share contents in a very original way.

<table>
    <tr>
        <th>Version</th>
        <td>
            1.8
        </td>
    </tr>
    <tr>
        <th>GitHub</th>
        <td>https://github.com/AzraelSec/CMShell</td>
    </tr>
    <tr>
        <th>Project Home</th>
        <td>http://www.azraelsec.it/CMShell
    </tr>
    <tr>
        <th>Author</th>
        <td>Federico Gerardi aka AzraelSec</td>
    </tr>
    <tr>
        <th>Author Website</th>
        <td>http://www.azraelsec.it</td>
    </tr>
    <tr>
        <th>Copyright</th>
        <td>2016 Federico Gerardi</td>
    </tr>
    <tr>
        <th>License</th>
        <td>GPL v3.0 - (see LICENSE file)</td>
    </tr>
</table>

#Introduction
##Why should I use It?
"Content Managment Shell": that's simple! Sometimes We only need to manage static contents and the nature
of the data we want to share just does not justify the use of power and heavy platforms like Wordpress.
Sometimes We only want to show contents and organize informations in a endearing way and to entice friends to
read what we published.
What about the use of a shell?

##Why couldn't I use It?
* You need a back-end that allow You to modify data in your website dynamically (Coming Soon)
* You need a forum-type platform with threads, comments and replies: that's not the project's goal
* You need an authenticated system that allows you to identify the users that accessed the website (Coming Soon)
* You want an eye candy noob system and You don't like the shells (Hope You're joking!)

#Documentation
##Dependencies
* jQuery (Any Version)

##Cool Features
* Commands and files completition
* History management
* Expandable list of commands
* Directory (absolute and relative path interpretation)
* Plug-in System (with dependency management) **NEW**

##System Organizzation
The whole system organizes data and options statically using a tree structure.

* ->CMShell
  * ->core
     * ->commands
     * ->plugins 
  * ->content
  * ->js
  * ->style
  * ->index.html

There are two (just for now) type of files:

* **files**: Normal ASCII file, which we want to show over terminal.  
* **links**: Metadata useful to link important web pages.

####System Configuration
CMShell is quite completely customizable in a lot of different ways. In particular, There is a simple configuration file named `system-config.json` in which is implemented a
dictionary that collects all the informations we want to make available to the system.
Here's an example to make it clear (I commented the most important lines):  

    {
        "username" : "AzraelSec",
        "hostname" : "DarkNet",
        "banner" : "Hello Azrael, my old friend",
        "show-help" : true,
        "shell-title" : "Testing page",
        "allowed-commands" : [
            "ls", "echo", "help", "clear", "man", "cat", "cd", "pwd", "call_plugin"
        ],
        
        "avaiable-files" : [
            { "filename" : "file1", "type" : "file"},
            
            { "filename" : "google_link", "type" : "link", "destination" : "www.google.it" },
            
            { "filename" : "standard" },
            
            { "filename" : "example_directory",
                "type" : "directory",
                "within" : [
                        { "filename" : "file2", "type" : "file" },
                        { "filename" : "AzraelSec_Home", "type" : "link", "destination" : "www.azraelsec.it" },
                        { "filename" : "inner_dir", "type" : "directory",
                            "within" : [
                                    { "filename" : "LinkedIn", "type" : "link", "destination" : "https://it.linkedin.com/in/azraelsec" }
                                ]
                        }
                    ]
            }
        ],
        
        "active-plugins" : [
             "test", "switch-light-on"
        ]
    }

* **banner**: Used as a "motto" and showed ad the beginning of session.
* **show-help**: Flag that enable a simple help message.
* **allowed-commands**: List of the commands we want to make avaiable during navigation.
* **allowed-files**: List of all files and metadata we want to make available and their relative types.
* **active-plugins**: List of all active plugins.

####Adding new commands
Commands list is completely extensible: You must only implement their relative `json` files.
Here's an example of a command core implementation file:

    {
            "name" : "echo",
            "description" : "echo [string(s)]",
            "source" : [
                    "function(env, params)",
                    "{",
                        "env.push_output(params.join('  '));",
                    "}"
                   ]
    }

* **name**: Command name and string used to call function within the shell.
* **description**: Description useful for other important commands like `man`.
* **source**: Function executed when shell recalls the command (Splitted in array for indentation). Receives the reference to the shell environment (`env`)
, that allows you to use its methods and properties, and the list of arguments passed.

Commands can interact with CMShell through an environment reference and a list of all the arguments passed
 in input during command calling.

*TO BE CONTINUED*

####Create your own plugin
Plugins are simple `json` file very similar to command one, that provide a unique and formal schema to make the system aware of the
actions to do.

There are two plugin types:

* **not callable**: Plugin that must be called at system start-up that usually modify the system behavior or appearance.
* **callable**: Plugin that must not be called at system start-up, but define new functions callable through `call_plugin` command.

I've made two example plugins that could help you to understand the way they must be written:

* **Example 1: Not Callable** => *switch-light-on*
* **Example 2: Callable** => *test*

Plugins are characterized by `dependencies` property that is a list of all other modules needed for correct execution. If one of these cannot be loaded,
then the system doesn't set up the target.
At the moment the system cannot resolve conflicts for cyclic dependency, but this feature will be implemeted in the next version of CMShell.

to call and a list of parameters to communicate.
Plugins can interact each other (with callable plugins) using the API function `execute_plugin_source(plugin_name, args)`, passing the plugin name we want
to call and the list of parameters to pass.

#Coming Soon
* Fix all (complex) directory management issues
* Full documentation for adding new commands
* Point out CMShell APIs
* Temporary variables
* User authentication and sessions
* Back-end for CRUD operation on files
* Pipe implementation