# CMShell

CMShell is a simple, highly customizable and easily extensible static content managment system
that allows you to share contents in a very original way.

<table>
    <tr>
        <th>Version</th>
        <td>
            1.0
        </td>
    </tr>
    <tr>
        <th>GitHub</th>
        <td>https://github.com/AzraelSec/CMShell</td>
    </tr>
    <tr>
        <th>Author</th>
        <td>Federico Gerardi aka AzraelSec</td>
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

##System Organizzation
The whole system organizes data and options statically using a tree structure.

* ->CMShell
  * ->core
     * ->commands
  * ->content
  * ->js
  * ->style
  * ->index.html

There are two (just for now) type of files:

* **files**: Normal ASCII file, which we want to show over terminal.  
* **links**: Metadata useful to link important web pages.

####System Configuration
CMShell is quite completely customizable in a lot of different ways. In particular, There is a simple configuration file named `system-config.json` in which is implemented a
dictionary that collects all the information we want to make available to the system.
Here's an example to make it clear (I commented the most important lines):  

    {  
        "username" : "AzraelSec",
        "hostname" : "DarkNet",  
        "banner" : "Hello Azrael, my old friend",  
        "show-help" : true,  
        "shell-title" : "Testing page",    
        "allowed-commands" : [  
            "ls", "echo", "help", "clear", "man", "cat"  
        ],
        "avaiable-files" : [  
            { "filename" : "file1", "type" : "file"},
            { "filename" : "link", "type" : "link", "destination" : "www.google.it" },  
            { "filename" : "standard" }  
        ]
    }

* **banner**: Used as a "motto" and showed ad the beginning of session.
* **show-help**: Flag that enable a simple help message.
* **allowed-commands**: List of the commands we want to make avaiable during navigation.
* **allowed-files**: List of all files and metadata we want to make available and their relative types.

####Adding new commands
Commands list is completely extensible: You have only to implement their relative `json` file.
Here's an example of a command core implementation file:

    {
            "name" : "echo",
            "description" : "echo [string(s)]",
            "source" : "function(env, params){ env.push_output(params.join('  ')) }"
    }

* **name**: Command name and string used to call function within the shell.
* **description**: Description useful for other important commands like `man`.
* **source**: Function executed when shell recalls the command. Receives the reference to the shell environment (`env`)
, that allow you to use its methods and properties, and the list of arguments passed.

*TO BE CONTINUED*

#Coming Soon
* Temporary variables
* User authentication and sessions
* Back-end for CRUD operation on files
* Pipe implementation
* Directory implementation

