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

async function RunScript (tabId, callback) {
    let existid = false;
    let scripts = await chrome.scripting.getRegisteredContentScripts();
    for (let scrid of scripts.map((script) => script.id)) {
        if (`${tabId}` == scrid) {
            existid = true;
        }
    }
    callback (existid);
}

async function StopScript (tabId) {
    await chrome.scripting.unregisterContentScripts ({ids: [`${tabId}`],}).catch(function() {});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab)=> {
    if (DownloadVideo) {
        if (changeInfo.status == 'loading') {
            chrome.webRequest.onResponseStarted.addListener (WebContent, {urls: ['<all_urls>']}, ['responseHeaders']);
            RunScript (tabId, function (existid) {
                if (!existid) {
                    chrome.scripting.registerContentScripts([{id: `${tabId}`, allFrames: false, matches: ['<all_urls>'], js: ['content-script.js'], css: ['content-script.css']}]);
                }
            });
            chrome.webRequest.onResponseStarted.removeListener (WebContent);
            chrome.tabs.sendMessage(tabId, {message: 'gdmclean'}).then (function () {}).catch(function() {});
            chrome.webRequest.onResponseStarted.addListener (WebContent, {urls: ['<all_urls>']}, ['responseHeaders']);
        }
    } else {
        StopScript (tabId);
        chrome.webRequest.onResponseStarted.removeListener (WebContent);
    }
});

function WebContent (content) {
    if (content.tabId === -1) {
        return;
    }
    let length = content.responseHeaders.filter (cont => cont.name.toUpperCase () === 'CONTENT-LENGTH').map (lcont => lcont.value).shift ();
    if (length > 1) {
        let gdmtype = content.responseHeaders.filter (cont => cont.name.toUpperCase () === 'CONTENT-TYPE')[0].value;
        if (gdmtype.startsWith ('video')) {
            if (length > 10000000) {
                chrome.tabs.sendMessage(content.tabId, {message: 'gdmvideo', urls: content.url, size: length, mimetype: gdmtype}).then (function () {}).catch(function() {});
            }
        } else if (gdmtype.startsWith ('audio')) {
            chrome.tabs.sendMessage(content.tabId, {message: 'gdmaudio', urls: content.url, size: length, mimetype: gdmtype}).then (function () {}).catch(function() {});
        }
    }
}

chrome.downloads.onCreated.addListener (function (downloadItem) {
    if (!InterruptDownloads || ResponGdm) {
        return;
    }
    if(chrome.runtime.lastError) {
        if (!downloadItem['finalUrl'].includes ("blob:")) {
            chrome.downloads.cancel (downloadItem.id);
        }
    } else {
        console.clear ();
    }
});

chrome.downloads.onDeterminingFilename.addListener (function (downloadItem) {
    if (!InterruptDownloads || ResponGdm) {
        return;
    }
    if (downloadItem['finalUrl'].includes ("blob:")) {
        return;
    }
    SendToOniDM (get_downloader (downloadItem));
    queueMicrotask (function () {
        chrome.downloads.cancel (downloadItem.id, function () {
            chrome.downloads.erase ({ id: downloadItem.id });
        });
    });
});

SendToOniDM = function (downloadItem) {
    fetch (get_host (), { method: 'post', body: downloadItem }).then (function (r) { return r.text (); }).catch (function () {});
}

function get_downloader (downloadItem) {
    return`link:${downloadItem['finalUrl']},filename:${downloadItem['filename']},referrer:${downloadItem['referrer']},mimetype:${downloadItem['mime']},filesize:${downloadItem['fileSize']},resumable:${downloadItem['canResume']},`;
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
            downloadchrome (request.message);
            return;
        }
        SendToOniDM (request.message);
    }
});

async function downloadchrome (urls) {
    let url = urls.substring (5, urls.lastIndexOf(",filename:"));
    await chrome.downloads.download({url: url});
}

get_host = function () {
    if (CustomPort) {
        return `http://127.0.0.1:${PortSet}`;
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