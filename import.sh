#!/bin/bash

FILENAME=all_latest.tar.bz2
ARCHIVE_DIRECTORY=tmp/archives
REL_PATH=${ARCHIVE_DIRECTORY}/${FILENAME}

get_timestamp() {  # $1 = name of the file
    if [[ "$_system_name" == "OSX" ]]
    then
        stat -f %Sm $1
    else
        stat -c %y $1
    fi
}

create_directory() { # $1 = path of the directory to create
    if [[ "$_system_name" == "OSX" ]]
    then
        mkdir -p $1
    else
        mkdir --parents $1
    fi
}

create_directory $ARCHIVE_DIRECTORY
create_directory tmp/json/communes
create_directory tmp/json/organismes
LATEST_TIMESTAMP=$(get_timestamp $REL_PATH)
echo $LATEST_TIMESTAMP

wget --directory-prefix=$ARCHIVE_DIRECTORY --timestamping http://lecomarquage.service-public.fr/donnees_locales_v2/$FILENAME

if [[ "$LATEST_TIMESTAMP" == `get_timestamp $REL_PATH` ]]
then
    echo NOTHING TO DO
else
    echo EXTRACT!
    create_directory tmp/cache
    tar xf $REL_PATH -C tmp/cache --strip-components=1
fi
