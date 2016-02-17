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
    
    //Keep track of last commands executed;
    this.history = [];
    
    //Keep track of last history item grubbed;
    this.history_index = -1;
    
    //Output field reference;
    this.output_field = $('#shell-output-field');
    
    //Input field reference;
    this.input_field = $('#shell-input-field');
    
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
        var size = partial_string.length;
        
        for(var i in instance.file_informations)
        {
            if(partial_string == instance.file_informations[i]['filename'].substring(0, size))
                valid_values.push(instance.file_informations[i]['filename']);
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
                        
                        if(result.length > 1)
                            instance.push_output(result.join(' '));
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
                        else
                            instance.push_output(result.join(' '));
                    }
                }
                
                //Handler for ARROW_UP and previous history lookup;
                if(event.which == 38 || event.keyCode == 38)
                {
                    instance.history_backwards();
                }
                
                //Handler for ARROW_DOWN and fallowing history lookup;
                
                if(event.which == 40 || event.keyCode == 40)
                {
                    instance.history_forwards();
                }
                
                //Handler for ENTER and command execution;
                if(event.which == 13 || event.keyCode == 13)
                {
                    var string_splitted = instance.input_field.val().split(' ');
                    
                    var command = string_splitted[0];
                    var params = string_splitted.slice(1, string_splitted.length);
                    
                    //Calling command and execute it;
                    instance.call_command(command, instance, params);
                    instance.input_field.focus(); //Input field must take the focus;
                }
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
                            instance.command_bodies[data['name']] = data['source'];
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
        var files_load  = function(file_metadata_array)
        {
            //File metadata loading;
            for (i in file_metadata_array)
            {
                if('filename' in file_metadata_array[i]) //Filename key presence checking;
                {
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
                                console.log('Error during loading metadata: ' + file_metadata_array[i]);
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
                    console.log('Error during loading metadata: ' + file_metadata_array[i]);
            }
        }
        
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
        }
        
        //Nested function to print help message enabled in system configuration;
        var print_help = function()
        {
            var external = $('div#shell-output-container');
            var newdiv = $('<div id=\'shell-help-container\'></div>');
            var newparagraph = $('<p></p>');
            
            var help_message = 'Type \'help\' for a complete command list summary. <br>' +
                                'Use command \'man\' to have a usage message about single commands. <br>' +
                                'Have fun with CMShell platform. <br>' +
                                'Credits to Federico Gerardi aka AzraelSec (VoidSec Team)';
            
            
            newparagraph.html(help_message);
            newdiv.append(newparagraph);
            external.prepend(newdiv);
        }
        
        //Nested function to set new shell title from system configuration;
        var set_title = function(title)
        {
            document.title = 'CMShell - ' + title;
        }
        
        console.log("Configuration requested");
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
                    files_load(instance.configuration['avaiable-files']);
                    
                    //Opening graphical construction;
                    set_title(instance.configuration['shell-title']);
                    
                    if(instance.configuration['show-help'] == true)
                        print_help();
                    
                    if(instance.configuration['banner'] != '')
                        print_banner(instance.configuration['banner']);
                        
                    //Binding establishment and ready to go;                    
                    instance.makeBindings();
                    instance.print_prompt();
                }
            }
        ).fail(
            function (xhr, status, error)
            {
                console.log("Error during configuration loading.");
                shell.output_produce("[ERROR] Shell init configuration error! Please, refresh the page.");
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