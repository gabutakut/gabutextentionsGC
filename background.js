/*
* Copyright (c) {2021} torikulhabib (https://github.com/torikulhabib)
*
* This program is free software; you can redistribute it and/or
* modify it under the terms of the GNU General Public
* License as published by the Free Software Foundation; either
* version 2 of the License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* General Public License for more details.
*
* You should have received a copy of the GNU General Public
* License along with this program; if not, write to the
* Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
* Boston, MA 02110-1301 USA
*
* Authored by: torikulhabib <torik.habib@Gmail.com>
*/

let GabutDownload, result;
let CustomPort = false;
let interruptDownloads = true;
let PortSet = "2021";
let HostDownloader = "http://127.0.0.1:"+PortSet;

if (typeof browser !== 'undefined') {
    GabutDownload = browser;
} else if (typeof chrome !== 'undefined') {
    GabutDownload = chrome;
}

alwawscheck ();
async function alwawscheck () {
    setTimeout(function () {
        if (result == "OK" && interruptDownloads) {
            GabutDownload.browserAction.setIcon({path: "./icons/icon_32.png"});
        } else {
            GabutDownload.browserAction.setIcon({path: "./icons/icon_disabled_32.png"});
        }
        var xmlrequest = new XMLHttpRequest ();
        xmlrequest.open ("GET", HostDownloader, true);
        xmlrequest.setRequestHeader ("Content-type", "application/x-www-form-urlencoded");
        xmlrequest.send ("");
        xmlrequest.onreadystatechange = function () {
            result = xmlrequest.statusText;
        }
        alwawscheck ();
    }, 2000);
}

GabutDownload.downloads.onCreated.addListener(function (downloadItem) {
    if (!interruptDownloads) {
        return;
    }
    if (result != "OK") {
        return;
    }
});

GabutDownload.downloads.onDeterminingFilename.addListener((downloadItem)=> {
    if (!interruptDownloads) {
        return;
    }
    if (result != "OK") {
        return;
    }
    setTimeout (()=> {
        GabutDownload.downloads.cancel (downloadItem.id);
    });
    SendToOniDM (downloadItem);
});

function SendToOniDM (downloadItem) {
    var xmlrequest = new XMLHttpRequest ();
    var content = "link:" + (downloadItem['finalUrl']||downloadItem['url']);
    content += ",filename:" + downloadItem['filename'];
    content += ",referrer:" + downloadItem['referrer'];
    content += ",mimetype:" + downloadItem['mime'];
    content += ",filesize:" + downloadItem['fileSize'];
    content += ",resumable:" + downloadItem['canResume'] + ",";
    xmlrequest.open ("POST", HostDownloader, true);
    xmlrequest.setRequestHeader ("Content-type", "application/x-www-form-urlencoded");
    xmlrequest.send (content);
}

async function chromeStorageGetter (key) {
    return new Promise (resolve => {
        GabutDownload.storage.local.get (key, (obj)=> {
            return resolve(obj[key] || '');
        })
    });
}

async function GetConfig (key, default_value = '') {
    let configValue = default_value;
    try {
        configValue = await chromeStorageGetter (key);
    } catch {}
    if (["true", "false"].includes(configValue)) {
        return configValue == "true";
    }
    return configValue;
}

async function getConfigure (callback) {
    callback (interruptDownloads, CustomPort, PortSet);
    return {
        'interrupt-download': await GetConfig ('interrupt-download', interruptDownloads),
        'port-custom':  await GetConfig ('port-custom', CustomPort),
        'port-input': await GetConfig ('port-input', PortSet),
    }
}

async function setPortCustom (interrupt, callback) {
    await SavetoStorage('port-custom', interrupt);
    CustomPort = interrupt;
    callback (CustomPort);
}

async function setPortInput (interrupt, callback) {
    if (CustomPort) {
        await SavetoStorage('port-input', interrupt);
        PortSet = interrupt;
        HostDownloader = "http://127.0.0.1:"+PortSet;
        callback (PortSet);
    }
}

async function setInterruptDownload (interrupt) {
    await SavetoStorage('interrupt-download', interrupt);
    interruptDownloads = interrupt;
    if (interrupt && result == "OK") {
        GabutDownload.browserAction.setIcon({path: "./icons/icon_32.png"});
    } else {
        GabutDownload.browserAction.setIcon({path: "./icons/icon_disabled_32.png"});
    }
}

async function SavetoStorage(key, value) {
    return new Promise(resolve => {
        GabutDownload.storage.local.set({[key]: value}, resolve);
    });
}

GabutDownload.commands.onCommand.addListener((command) => {
    if (command == "Ctrl+Shift+Y") {
        setInterruptDownload (!interruptDownloads);
        GabutDownload.runtime.sendMessage({
            message: command
        });
    } else if (command == "Ctrl+Shift+E") {
        setPortCustom (!CustomPort, ()=>{});
        GabutDownload.runtime.sendMessage({
            message: command
        });
    }
});