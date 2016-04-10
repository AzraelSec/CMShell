/*
  CMShell
  Author : Federico Gerardi aka 'AzraelSec'
  Email  : federicogerardi94@gmail.com
  
  This project is released under the GPL 3 license.

*/

/*INSTANCE CLASS*/
var instance = null;

/*SHELL CLASS ABSTRACTION*/
var shell = function()
{
    console.log("Shell instance created");
    
    //Verify that the configuration has been loaded;
    this.already_init = false; 

    //Keep configuration tracks;
    this.configuration = [];
    
    //Keep command name list tracks;
    this.command_names = [];
    
    //Keep associations between command names and their bodies;
    this.command_bodies = {};
    
    //Keep associations between command names and their descriptions;
    this.command_descriptions = {};
    
    //Keep track of the readable file list;
    this.file_informations = [];
    
    //Keep track of the actual position in directory tree;
    this.directory_position = "/";
    
    //Keep track of last commands executed;
    this.history = [];
    
    //Keep track of last history item grubbed;
    this.history_index = -1;
    
    //Keep track of all plugins information structures;
    this.plugins_informations = {};
    
    //Output field reference;
    this.output_field = $('#shell-output-field');
    
    //Input field reference;
    this.input_field = $('#shell-input-field');
    
    //Method for plugin source code execution (Usefull for plugins interaction!);
    this.execute_plugin_source = function(plugin_name, args)
    {
        var handler = eval('(' + this.plugins_informations[plugin_name]['source'].join('\n') + ')');
        handler(instance, args);
    };
    
    //Method for head file path filtering and retriving;
    this.filter_head_path = function(path_string)
    {
        return path_string.replace(/^.*[\\\/]/, '');
    };
    
    //Method for parent file path filtering and retriving;
    this.filter_parent_path = function(path_string)
    {
        var matched = path_string.match(/^(\/*.*\/)/);
        return matched[matched.length - 1];
    }
    
    //Method for actual directory path crafting;
    this.get_actual_directory_path = function()
    {
        return this.directory_position;
    };
    
    //Method for directory full path reconstruction considering actual path and relative expressions;
    this.directory_eval = function(expression)
    {
        //Delete './' chars;
        var del_same_path = function(path)
        {
            if(path.match(/(^|\/)\.\)/)) return path.replace(/(^|\/)\.\)/, '/');
            else return path;
        };
        
        //Nested function for relative-absolute path shifting;
        var make_absolute = function(relative_path)
        {
            if(relative_path.match(/^[^\/]/))
                return instance.get_actual_directory_path() + '/' + relative_path;
            else return relative_path;
        };
        
        //Nested function for null path removing;
        var del_null_path = function(path)
        {
            return path.replace(/\/+/g, '/');
        };
        
        //Nested function for ending slashes removing;
        var del_end_slashes = function(path)
        {
            if(path == '/') return path;
            else return path.replace(/\/*$/g, '');
        };
        
        //Nested function for recursively backtracking (..) interpretation;
        var expand_backtracking = function(path)
        {
            var external;
            while((external = path.match(/^(.+?\/?\.\.)/)))
            {
                var rel = external[external.length - 1];
                var internal;
                if((internal = path.match(/^(.+?)\/?\.\./)))
                {
                    if(internal[internal.length - 1] == '/')
                        path = path.replace(rel, '/');
                    else
                    {
                        matched = rel.match(/^(.*)\/[^\/]*\/\.\..*$/)
                        var nop = matched[matched.length - 1];
                        
                        path = path.replace(rel, nop);
                        if(path.length == 0) return '/';
                    }
                }
            }
            
            return path;
        };
        
        //If void expression, return null indicating error situation;
        if(expression.length == 0)
            return '/';
        
        //Applying all defined path expression inflating;
        expression = del_same_path(expression);
        expression = make_absolute(expression);
        expression = del_null_path(expression);
        expression = del_end_slashes(expression);
        expression = expand_backtracking(expression);
        
        //Reapplying del_null_path because expanding backtracking could produce null paths;
        expression = del_null_path(expression);
        
        return expression;
    };
    
    //Method for file (or directory) interpretation and object reconstruction;
    this.file_eval_obj = function(expression)
    {        
        expression = this.directory_eval(expression);
        var inode = this.filter_head_path(expression);
        var path = this.filter_parent_path(expression);
        
        if(inode == '' && path == '/')
            return instance.file_informations;
        else
            for(var i in instance.file_informations)
                if(inode == instance.file_informations[i]['filename'] && path == instance.file_informations[i]['path'])
                    return instance.file_informations[i];
    };
    
    //Method for prompt string array retriving;
    this.get_prompt_string = function()
    {
        return ['<span>' + instance.configuration['username'] + '</span>',
                '<span class=\'red\'>@</span>' + 
                '<span>' + instance.configuration['hostname'] + '</span>',
                '> '];
    }
    
    //Method to print new content within output-box;
    this.output_produce = function(text)
    {
        this.output_field.append('<br>');
        this.output_field.append(text);
        this.output_field.append('<br>');
    }
    
    //Method for user prompt printing;
    this.print_prompt = function()
    {
        var prompt_field = $('#shell-prompt-field');
        var elements = this.get_prompt_string();

        for(elem in elements)
            prompt_field.append(elements[elem]);
    }
    
    //Method for message input interaction;
    this.push_output = function(output)
    {
        var elements = this.get_prompt_string();
        elements.push(" ", instance.input_field.val());
        
        for(elem in elements)
            this.output_field.append(elements[elem]);
               
        this.output_produce(output);
    }
    
    //Method for terminal clearing;
    this.clear_terminal = function()
    {
        this.output_field.empty();
        this.input_field.empty();
    }
    
    //Method for command completition searching;
    this.find_command = function(partial_string)
    {
        //Initially the array of possible values is empty;
        var valid_values = [];
        var size = partial_string.length;
        
        for(var i in instance.command_names)
        {            
            if(partial_string == instance.command_names[i].substring(0, size))
                valid_values.push(instance.command_names[i]);
        }
        
        return valid_values;
    }
    
    //Method fot file completition searching;
    this.find_files = function(partial_string)
    {
        //Initially the array of possible values is empty;
        var valid_values = [];
        
        //Informations filtering;
        if(partial_string.match(/^.*\/$/))
        {
            partial_string = this.directory_eval(partial_string);
            partial_string += '/';
        }
        else partial_string = this.directory_eval(partial_string);
        
        var partial_name = this.filter_head_path(partial_string);
        var parent_path = this.filter_parent_path(partial_string);
        var size = partial_name.length;
        
        for(var i in instance.file_informations)
        {
            if(partial_name == instance.file_informations[i]['filename'].substring(0, size))
                if(parent_path == instance.file_informations[i]['path'])
                    if(instance.file_informations[i]['type'] == 'directory')
                        valid_values.push(parent_path + instance.file_informations[i]['filename'] + '/');
                    else
                        valid_values.push(parent_path + instance.file_informations[i]['filename']);
        }
        
        return valid_values;
    }
    
    //Method for command calling and executing;
    this.call_command = function(command, environment, args)
    {
        //Checking if command exists;
        if($.inArray(command, instance.command_names) < 0)
        {
            console.log('Command ' + command + ' not found.');
            this.push_output('Error: command ' + command + ' not found.');
        }
        else
        {
            //If exists ~> execute the command;
            console.log('Executing command ' + command + '.');
            var function_to_call = eval( '(' + instance.command_bodies[command] + ')');
            function_to_call(environment, args);
        }
        
        //History management and input cleaning;
        if((this.history.length == 0 || this.history[0] != this.input_field.val()) && this.input_field.val() != '')
            this.history.unshift(this.input_field.val());
        
        //Reset for history and input field;
        this.history_index = -1;
        this.input_field.val('');
    }
    
    //Method for history previous element grubbing;
    this.history_backwards = function()
    {
        if(instance.history_index < instance.history.length - 1)
        {
            instance.history_index++;
            instance.input_field.val(instance.history[instance.history_index]);
        }
    }
    
    //Method for history next element grubbing;
    this.history_forwards = function()
    {
        if(instance.history_index > -1)
        {
            instance.history_index--;
            
            if(instance.history_index == -1)
                instance.input_field.val('');
            else
                instance.input_field.val(instance.history[instance.history_index]);
        }
    }
    
    //Method for bindings creation;
    this.makeBindings = function()
    {
        //Bindings for input field;
        this.input_field.keydown(
            function(event)
            {
                //Handler for TAB completition;
                if(event.which == 9 || event.keyCode == 9)
                {
                    event.preventDefault(); //Preventing tab focus switching;
                    if(instance.input_field.val().split(' ').length == 1)
                    {
                        var result = instance.find_command(instance.input_field.val());
                        if(result.length == 1)
                            instance.input_field.val(result[0]);
                        else if(result.length > 1)
                        {
                            var save = instance.input_field.val();
                            instance.push_output(result.join(' '));
                            instance.input_field.val(save);
                        }
                    }
                    else
                    {
                        var big_set = instance.input_field.val().split(' ');
                        var target = big_set[big_set.length - 1];
                        var result = instance.find_files(target);
                        
                        if(result.length == 1)
                        {
                            //Replace last word
                            var last_white = instance.input_field.val().lastIndexOf(' ');
                            instance.input_field.val(
                                instance.input_field.val().substring(
                                    0, last_white
                                ) + ' ' + result[0]
                            );
                        }
                        else if(result.length > 1)
                        {
                            var save = instance.input_field.val();
                            instance.push_output(result.join(' '));
                            instance.input_field.val(save);
                        }
                    }
                }
                
                //Handler for ARROW_UP and previous history lookup;
                if(event.which == 38 || event.keyCode == 38)
                {
                    event.preventDefault(); //Preventing tab focus switching;
                    instance.history_backwards();
                }
                
                //Handler for ARROW_DOWN and fallowing history lookup;
                
                if(event.which == 40 || event.keyCode == 40)
                {
                    event.preventDefault(); //Preventing tab focus switching;
                    instance.history_forwards();
                }
                
                //Handler for ENTER and command execution;
                if(event.which == 13 || event.keyCode == 13)
                {
                    event.preventDefault(); //Preventing tab focus switching;
                    var string_splitted = instance.input_field.val().split(' ');
                    
                    var command = string_splitted[0];
                    var params = string_splitted.slice(1, string_splitted.length);
                    
                    //Calling command and execute it;
                    instance.call_command(command, instance, params);
                    instance.input_field.focus(); //Input field must take the focus;
                }
            }
        );
        
        this.input_field.keyup(
            function () {
                instance.input_field.focus();//Input field must take the focus;
            }
        );
    }
    
    //Method for configuration loading;
    this.init = function()
    {
        //Nested function to load all commands from configuration;
        var commands_load = function(commands_array)
        {
            //Commands loading;
            for (var i in commands_array){
                $.ajax(
                    {
                        url: 'core/commands/' + commands_array[i] + '.json',
                        dataType: 'json',
                        success: function(data)
                        {
                            //Updating source code and function names references;
                            instance.command_names.push(data['name']);
                            instance.command_bodies[data['name']] = data['source'].join('\n');
                            instance.command_descriptions[data['name']] = data['description'];
                        }
                    }
                ).fail(
                    function (xhr, status, error) {
                        
                        console.log("Error during command loading: " + 'core/commands/' + commands_array[i] + '.json' + "\nInfo: " + error);
                    }
                );
            }
        };
        
        //Nested function to load all file informations from configuration;
        var files_load  = function(file_metadata_array, path)
        {
            //File metadata loading;
            for (i in file_metadata_array)
            {
                if('filename' in file_metadata_array[i]) //Filename key presence checking;
                {
                    //Path location assignment;
                    file_metadata_array[i]['path'] = path; //Used like hash string;
                    
                    if('type' in file_metadata_array[i]) //Type key presence checking;
                    {                        
                        if(file_metadata_array[i]['type'] == 'file')
                            instance.file_informations.push(file_metadata_array[i]);
                        
                        if(file_metadata_array[i]['type'] == 'link')
                        {
                            //Destination link key presence checking;
                            if('destination' in file_metadata_array[i])
                            {
                                if(file_metadata_array[i]['destination'].substring(0, 7) != 'http://' &&
                                   file_metadata_array[i]['destination'].substring(0, 8) != 'https://')
                                    file_metadata_array[i]['destination'] = 'http://' + file_metadata_array[i]['destination'];
                                
                                instance.file_informations.push(file_metadata_array[i]);
                            }
                            else
                                console.log('Error during loading link: ' + file_metadata_array[i]['filename']);
                        }
                        
                        if(file_metadata_array[i]['type'] == 'directory')
                        {
                            //If file is a directory one ~> Load files re
                            if('within' in file_metadata_array[i])
                            {
                                instance.file_informations.push(file_metadata_array[i]);
                                files_load(file_metadata_array[i]['within'], path + file_metadata_array[i]['filename'] + '/');
                            }
                            else
                                console.log('Error during loading directory: ' + file_metadata_array[i]['filename']);
                        }
                    }
                    else //If type isn't specified, i assume it's a regular file;
                    {
                        var push_out = file_metadata_array[i];
                        push_out['type'] = 'file';
                        
                        instance.file_informations.push(push_out);
                    }
                }
                else
                    console.log('Error during loading metadata: ' + JSON.stringify(file_metadata_array[i]));
            }
        };
        
        /*
         * NOTE: I assume that all plugins are composed only by a main 'source' function, but they'll have a more complex structure in the future;
         *
         * NOTE: Algorithm for dependency management in testing phase;
         */
        //Nested function to activate plugin metadata;
        var activate_plugins = function(enabled_functions, metadata_pool)
        {
            //Already executed plugin references;
            var executed = [];
            
            //Nested function to call main callable plugins function;
            var plugin_execute = function(pool, resolved, plugin_name)
            {
                if ($.inArray(name, resolved) == -1)
                {
                    //Call plugin only if it's not a functional one;
                    if (pool[plugin_name]['callable'] == false)
                    {
                        var handler = eval('(' + pool[plugin_name]['source'].join('\n') + ')');
                        handler(instance);
                    }
                    resolved.push(plugin_name);
                }
                
                return true;
            };
            
            //Nested function that checks plugins dependencies and execute it in a smart way;
            var plugins_examination = function(resolved, pool, node)
            {
                if (node in pool)
                {
                    //BASE CASE;
                    if(pool[node]['dependencies'].length == 0)
                        return plugin_execute(pool, resolved, node);
                    else
                    {
                        //RECURSIVE CASE;
                        var correct = true;
                        
                        for(var i in pool[node]['dependencies'])
                            correct = correct && plugins_examination(resolved, pool, pool[node]['dependencies'][i])
                        
                        if (correct == true)
                            return plugin_execute(pool, resolved, node);
                        else
                            console.log('Dependency unmet for module: ' + pool[node]['name']);
                    }
                }
                else console.log('Plugin non-existent or not loaded: ' + node);
                
                return false;
            };
            
            //Big loop for plugins metadata loading;
            for(var i = 0; i < enabled_functions.length; i++)
            {
                //Functional closure for looping correctly;
                (function(i, metadata_pool)
                {
                    $.ajax(
                            {
                                url: 'core/plugins/' + enabled_functions[i] + '.json',
                                dataType: 'json',
                                async: false, //Async call is so uncomfortable...!;
                                success: function(data)
                                {
                                    //Checking plugin structure consistency;
                                    if ('name' in data && 'description' in data && 'source' in data && 'dependencies' in data && 'callable' in data)
                                        metadata_pool[data['name']] = data;
                                    else
                                        console.log('Error during loading metadata: ' + JSON.stringify(data));  
                                },
                                error: function()
                                {
                                    console.log('Error during retriving plugin source from url: core/plugins/' + enabled_functions[i] + '.json');
                                }
                            })
                        .always(
                            function()
                            {
                                //If processed all correct plugins ~> examinate it all;
                                if (i == enabled_functions.length - 1)
                                {
                                    //Big loop for plugins recursive execution;
                                    $.each(metadata_pool, function(key, value)
                                    {
                                        plugins_examination(executed, metadata_pool, key);
                                    });
                                }
                            })
                }
                )(i, metadata_pool);
            }
        };
        
        //Nested function to print banner set in system configuration;
        var print_banner = function(banner_string)
        {
            var external = $('div#shell-output-container');
            var newdiv = $('<div id=\'shell-banner-container\'></div>');
            var newparagraph = $('<p></p>');
            
            //Div banner and paragraph construction;
            newparagraph.html( '~>[' + banner_string + ']<~' );
            newdiv.append(newparagraph);
            external.prepend(newdiv);
        };
        
        //Nested function to print help message enabled in system configuration;
        var print_help = function()
        {
            var external = $('div#shell-output-container');
            var newdiv = $('<div id=\'shell-help-container\'></div>');
            var newparagraph = $('<p></p>');
            
            var help_message = 'Type \'help\' for a complete command list summary. <br>' +
                                'Use command \'man\' to have a usage message about single commands. <br>' +
                                'Have fun with CMShell platform. <br>' +
                                'Credits to Federico Gerardi aka AzraelSec';
            
            
            newparagraph.html(help_message);
            newdiv.append(newparagraph);
            external.prepend(newdiv);
        };
        
        //Nested function to set new shell title from system configuration;
        var set_title = function(title)
        {
            document.title = 'CMShell - ' + title;
        };
        
        $.ajax(
            {
                url: "core/system-config.json",
                dataType: "json",
                success: function (data)
                {
                    //Configuration loading and environment creating;
                    instance.configuration = data;
                    instance.already_init = true;
                    
                    console.log('Commands and files loading started');
                    commands_load(instance.configuration['allowed-commands']);
                    files_load(instance.configuration['avaiable-files'], instance.directory_position);
                    
                    //Opening graphical construction;
                    set_title(instance.configuration['shell-title']);
                    
                    if(instance.configuration['show-help'] == true)
                        print_help();
                    
                    if(instance.configuration['banner'] != '')
                        print_banner(instance.configuration['banner']);
                        
                    //Binding establishment and ready to go;                    
                    instance.makeBindings();
                    instance.print_prompt();
                    
                    //Plugins loading and executing;
                    activate_plugins(instance.configuration['active-plugins'], instance.plugins_informations);
                }
            }
        ).fail(
            function (xhr, status, error)
            {
                console.log("Error during configuration loading.");
                instance.output_produce("[ERROR] Shell init configuration error! Please, check config and refresh the page.");
            }
        );
    };
}

//onLoad event handler;
$(document).ready(
    function (){
        instance = new shell();
        instance.init();
    }
);

//Helper for html escaping;
function html_strip(string) {
    return string.replace(/(<([^>]+)>)/ig,"");
}