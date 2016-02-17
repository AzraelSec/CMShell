#!/bin/sh
# Utility for a faster development of commands used into CMShell system.

function help
{
    echo "usage: $0 [FILENAME]"
}

if [ $# != 1 ] || ! [ -f $1 ];then
    help;
    exit 1;
fi

source=$(cat $1);
echo ${source//[$'\t\r\n']};
exit 0;