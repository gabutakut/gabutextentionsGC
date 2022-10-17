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

var ResponGdm = false;
var InterruptDownloads = true;
var PortSet = "";
var CustomPort = false;
var DownloadVideo = false;

load_conf ();

setInterval (function () {
    fetch (get_host (), {requiredStatus: 'ok'}).then(function() {
        ResponGdm = false;
    }).catch(function() {
        ResponGdm = true;
    });
    icon_load ();
}, 2000);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab)=> {
    if (DownloadVideo) {
        if (changeInfo.status == 'loading') {
            chrome.webRequest.onResponseStarted.removeListener (WebContent);
            chrome.tabs.sendMessage(tabId, {message: 'gdmclean'}).then (function () {}).catch(function() {});
        }
        chrome.webRequest.onResponseStarted.addListener (WebContent, {urls: ['<all_urls>']}, ['responseHeaders']);
        if (tab.url?.startsWith("chrome://")) {
            return undefined;
        }
        if (changeInfo.status === "complete") {
            chrome.scripting.executeScript({target: {tabId: tabId}, files: ['content-script.js'],});
            chrome.scripting.insertCSS({target: { tabId: tabId }, files: ["content-script.css"]});
        }
    }
});

function WebContent (content) {
    if (content.tabId === -1) {
        return;
    }
    const length = content.responseHeaders.filter (cont => cont.name.toUpperCase () === 'CONTENT-LENGTH').map (lcont => lcont.value).shift ();
    if (length > 1) {
        let gdmtype = content.responseHeaders.filter (cont => cont.name.toUpperCase () === 'CONTENT-TYPE')[0].value;
        if (gdmtype.startsWith ('video')) {
            chrome.tabs.sendMessage(content.tabId, {message: 'gdmvideo', urls: content.url, size: length, mimetype: gdmtype}).then (function () {}).catch(function() {});
        } else if (gdmtype.startsWith ('audio')) {
            chrome.tabs.sendMessage(content.tabId, {message: 'gdmaudio', urls: content.url, size: length, mimetype: gdmtype}).then (function () {}).catch(function() {});
        }
    }
}

chrome.downloads.onCreated.addListener (function (downloadItem) {
    if (!InterruptDownloads || ResponGdm) {
        return;
    }
    setTimeout (()=> {
        chrome.downloads.cancel (downloadItem.id);
        chrome.downloads.erase ({ id: downloadItem.id });
    }, 1);
});

chrome.downloads.onDeterminingFilename.addListener (function (downloadItem) {
    if (!InterruptDownloads || ResponGdm) {
        return;
    }
    setTimeout (()=> {
        chrome.downloads.cancel (downloadItem.id);
        chrome.downloads.erase ({ id: downloadItem.id });
    }, SendToOniDM (downloadItem));
});

SendToOniDM = function (downloadItem) {
    fetch (get_host (), { method: 'post', body: get_downloader (downloadItem) }).then (function (r) { return r.text (); }).catch (function () {});
    return 2;
}

function get_downloader (downloadItem) {
    let gdmurl = 'link:';
    gdmurl += downloadItem['finalUrl'];
    gdmurl += ',';
    gdmurl += 'filename:';
    gdmurl += downloadItem['filename'];
    gdmurl += ',';
    gdmurl += 'referrer:';
    gdmurl += downloadItem['referrer'];
    gdmurl += ',';
    gdmurl += 'mimetype:';
    gdmurl += downloadItem['mime'];
    gdmurl += ',';
    gdmurl += 'filesize:';
    gdmurl += downloadItem['fileSize'];
    gdmurl += ',';
    gdmurl += 'resumable:';
    gdmurl += downloadItem['canResume'];
    gdmurl += ',';
    return gdmurl;
}

async function chromeStorageGetter (key) {
    return new Promise (resolve => {
        chrome.storage.sync.get (key, (obj)=> {
            return resolve (obj[key] || '');
        })
    });
}

async function load_conf () {
    InterruptDownloads = await chromeStorageGetter ('interrupt-download');
    DownloadVideo = await chromeStorageGetter ('video-download');
    CustomPort = await chromeStorageGetter ('port-custom');
    PortSet = await chromeStorageGetter ('port-input');
    icon_load ();
}

async function setPortCustom (interrupt) {
    await SavetoStorage('port-custom', interrupt);
}

async function setVideoMenu (download) {
    await SavetoStorage('video-download', download);
}

async function setPortInput (interrupt) {
    if (CustomPort) {
        await SavetoStorage('port-input', interrupt);
    }
}

async function setInterruptDownload (interrupt) {
    await SavetoStorage('interrupt-download', interrupt);
}

async function SavetoStorage(key, value) {
    return new Promise(resolve => {
        chrome.storage.sync.set({[key]: value}, resolve);
    });
}

chrome.commands.onCommand.addListener((command) => {
    if (command == "Ctrl+Shift+Y") {
        setInterruptDownload (!InterruptDownloads);
        load_conf ();
    } else if (command == "Ctrl+Shift+E") {
        setVideoMenu (!DownloadVideo);
        load_conf ();
    }
});

chrome.runtime.onMessage.addListener((request, sender, callback) => {
    if (request.extensionId == "interuptopen") {
        chrome.runtime.sendMessage({ message: InterruptDownloads, extensionId: "popintrup" }).catch(function() {});
    } else if (request.extensionId == "customopen") {
        chrome.runtime.sendMessage({ message: CustomPort, extensionId: "popcust" }).catch(function() {});
    } else if (request.extensionId == "portopen") {
        chrome.runtime.sendMessage({ message: PortSet, extensionId: "popport" }).catch(function() {});
    } else if (request.extensionId == "videoopen") {
        chrome.runtime.sendMessage({ message: DownloadVideo, extensionId: "popvideo" }).catch(function() {});
    } else if (request.extensionId == "videochecked") {
        setVideoMenu (request.message);
        load_conf ();
    } else if (request.extensionId == "interuptchecked") {
        setInterruptDownload (request.message);
        load_conf ();
    } else if (request.extensionId == "customchecked") {
        setPortCustom (request.message);
        load_conf ();
    } else if (request.extensionId == "portval") {
        setPortInput (request.message);
        load_conf ();
    } else if (request.extensionId == "gdmurl") {
        if (!InterruptDownloads || ResponGdm) {
            return;
        }
        fetch (get_host (), { method: 'post', body: request.message }).then (function (r) { return r.text (); }).catch (function () {});
    }
});

get_host = function () {
    if (CustomPort) {
        return "http://127.0.0.1:" + PortSet;
    } else {
        return "http://127.0.0.1:2021";
    }
}

icon_load = function () {
    if (InterruptDownloads && !ResponGdm) {
        chrome.action.setIcon({path: "./icons/icon_32.png"});
    } else {
        chrome.action.setIcon({path: "./icons/icon_disabled_32.png"});
    }
}