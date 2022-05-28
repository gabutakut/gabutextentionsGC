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

let GabutDownload, frfx;
let result = true;
let interruptDownloads = true;
let PortSet = "2021";
let CustomPort = false;
let HostDownloader = "http://127.0.0.1:";

if (typeof browser !== 'undefined') {
    GabutDownload = browser;
    frfx = true;
} else if (typeof chrome !== 'undefined') {
    GabutDownload = chrome;
}

load_conf ();
function load_conf () {
    getConfigure ((interruptDownload, CustomP, PortS)=> {
        interruptDownloads = interruptDownload;
        CustomPort = CustomP;
        PortSet = PortS;
    });
}

setInterval(function () {
    if (interruptDownloads && !result) {
        GabutDownload.action.setIcon({path: "./icons/icon_32.png"});
    } else {
        GabutDownload.action.setIcon({path: "./icons/icon_disabled_32.png"});
    }
    result = true;
    fetch(get_host ()).then((response) => { return response.bodyUsed; }).then((data) => { result = data; });
}, 1000);

if (frfx) {
    GabutDownload.downloads.onCreated.addListener (function (downloadItem) {
        if (!interruptDownloads || result) {
            return;
        }
        setTimeout (()=> {
            GabutDownload.downloads.cancel (downloadItem.id);
            GabutDownload.downloads.erase({ id: downloadItem.id });
        });
        SendToOniDM (downloadItem);
    });
}

if (!frfx) {
    GabutDownload.downloads.onDeterminingFilename.addListener (function (downloadItem) {
        if (!interruptDownloads || result) {
            return;
        }
        setTimeout (()=> {
            GabutDownload.downloads.cancel (downloadItem.id);
            GabutDownload.downloads.erase({ id: downloadItem.id });
        });
        SendToOniDM (downloadItem);
    });
}

function SendToOniDM (downloadItem) {
    var content = "link:${finalUrl},filename:${filename},referrer:${referrer},mimetype:${mime},filesize:{filesize},resumable:${canResume},";
    var urlfinal = content.replace ("${finalUrl}", (downloadItem['finalUrl']||downloadItem['url']));
    var filename = urlfinal.replace ("${filename}", downloadItem['filename']);
    var referre = filename.replace ("${referrer}", downloadItem['referrer']);
    var mime = referre.replace ("${mime}", downloadItem['mime']);
    var filseize = mime.replace ("${filesize}", downloadItem['fileSize']);
    var resume = filseize.replace ("${canResume}", downloadItem['canResume']);
    fetch(get_host (), { method: 'post', body: resume }).then(function(r) { return r.text(); });
}

async function chromeStorageGetter (key) {
    return new Promise (resolve => {
        GabutDownload.storage.sync.get (key, (obj)=> {
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

async function setPortCustom (interrupt) {
    await SavetoStorage('port-custom', interrupt);
    CustomPort = interrupt;
}

async function setPortInput (interrupt) {
    if (CustomPort) {
        await SavetoStorage('port-input', interrupt);
        PortSet = interrupt;
    }
}

async function setInterruptDownload (interrupt) {
    await SavetoStorage('interrupt-download', interrupt);
    interruptDownloads = interrupt;
    if (interrupt && result == false) {
        GabutDownload.action.setIcon({path: "./icons/icon_32.png"});
    } else {
        GabutDownload.action.setIcon({path: "./icons/icon_disabled_32.png"});
    }
}

async function SavetoStorage(key, value) {
    return new Promise(resolve => {
        GabutDownload.storage.sync.set({[key]: value}, resolve);
    });
}

GabutDownload.commands.onCommand.addListener((command) => {
    if (command == "Ctrl+Shift+Y") {
        setInterruptDownload (!interruptDownloads);
        GabutDownload.runtime.sendMessage({ message: command });
    } else if (command == "Ctrl+Shift+E") {
        setPortCustom (!CustomPort);
        GabutDownload.runtime.sendMessage({ message: command });
    }
});

GabutDownload.runtime.onMessage.addListener((message, callback) => {
    if (message.message == "interuptopen") {
        GabutDownload.runtime.sendMessage({ message: "popintrup" + interruptDownloads });
    } else if (message.message == "customopen") {
        GabutDownload.runtime.sendMessage({ message: "popcust" + CustomPort });
    } else if (message.message == "portopen") {
        GabutDownload.runtime.sendMessage({ message: "popport" + PortSet });
    } else if (message.message.includes("interuptchecked")) {
        setInterruptDownload (str_to_bool (message.message));
        load_conf ();
    } else if (message.message.includes("customchecked")) {
        setPortCustom (str_to_bool (message.message), ()=>{});
        load_conf ();
    } else if (message.message.includes("portval")) {
        setPortInput (message.message.replace ("portval", ""));
        load_conf ();
    }
});

function str_to_bool (inputs) {
    if (inputs.includes ("true")) {
        return true;
    } else {
        return false;
    }
}

function get_host () {
    return HostDownloader + PortSet;
}