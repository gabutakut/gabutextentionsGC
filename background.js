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
var DetectedFiles = []; // List untuk menyimpan file yang terdeteksi

load_conf();

setInterval(function() {
    fetch(get_host(), { requiredStatus: 'ok' }).then(function() {
        ResponGdm = false;
    }).catch(function() {
        ResponGdm = true;
    });
    icon_load();
}, 2000);

async function RunScript(tabId, callback) {
    let existid = false;
    let scripts = await chrome.scripting.getRegisteredContentScripts();
    for (let scrid of scripts.map((script) => script.id)) {
        existid = true;
    }
    callback(existid);
}

async function StopScript(tabId) {
    let scripts = await chrome.scripting.getRegisteredContentScripts();
    for (let scrid of scripts.map((script) => script.id)) {
        await chrome.scripting.unregisterContentScripts({ ids: [scrid], }).catch(function() {});
    }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (DownloadVideo) {
        if (changeInfo.status == 'loading') {
            // Jangan clear list saat loading - user bisa di refresh manual
            // List akan persist sampai user klik reload button di popup
            
            chrome.webRequest.onResponseStarted.removeListener(WebContent);
            chrome.webRequest.onResponseStarted.addListener(WebContent, { urls: ['<all_urls>'] }, ['responseHeaders']);
        }
    } else {
        StopScript(tabId);
        chrome.webRequest.onResponseStarted.removeListener(WebContent);
    }
});

function WebContent(content) {
    if (content.tabId === -1) {
        return;
    }
    
    let length = content.responseHeaders.filter(cont => cont.name.toUpperCase() === 'CONTENT-LENGTH').map(lcont => lcont.value).shift();
    let gdmtype = content.responseHeaders.filter(cont => cont.name.toUpperCase() === 'CONTENT-TYPE').map(lcont => lcont.value).shift();
    
    if (!gdmtype || gdmtype === 'undefined') {
        return;
    }

    let fileInfo = null;
    let fileType = null;

    // Filter untuk Video (MP4, WebM, dll) - min 1MB
    if (gdmtype.startsWith('video')) {
        if (length > 1000000) { // 1MB = 1000000 bytes
            fileInfo = {
                type: 'video',
                url: content.url,
                size: length,
                mimetype: gdmtype,
                filename: extractFilename(content.url, gdmtype)
            };
            fileType = 'video';
        }
    } 
    // Filter untuk Audio
    else if (gdmtype.startsWith('audio')) {
        fileInfo = {
            type: 'audio',
            url: content.url,
            size: length,
            mimetype: gdmtype,
            filename: extractFilename(content.url, gdmtype)
        };
        fileType = 'audio';
    }
    // Filter untuk Streaming (M3U8, M3U, txt)
    else if (gdmtype.includes('application/vnd.apple.mpegurl') || 
             gdmtype.includes('application/x-mpegurl') ||
             (gdmtype.includes('text/plain') && isStreamingFile(content.url))) {
        fileInfo = {
            type: 'streaming',
            url: content.url,
            size: length,
            mimetype: gdmtype,
            filename: extractFilename(content.url, gdmtype)
        };
        fileType = 'streaming';
    }

    // Jika file terdeteksi, tambahkan ke list dan kirim ke popup
    if (fileInfo) {
        // Hindari duplikat
        const isDuplicate = DetectedFiles.some(f => f.url === fileInfo.url);
        if (!isDuplicate) {
            DetectedFiles.push(fileInfo);
            
            // Update badge di chrome action icon
            updateActionBadge();
            
            // Kirim update ke popup
            chrome.runtime.sendMessage({
                extensionId: "fileListUpdate",
                files: DetectedFiles
            }).catch(function() {});
        }
    }
}

function extractFilename(url, mimetype) {
    try {
        const urlObj = new URL(url);
        let filename = urlObj.pathname.split('/').pop();
        
        if (!filename || filename === '') {
            filename = 'download';
        }
        
        // Jika tidak ada extension, tambahkan berdasarkan mimetype
        if (!filename.includes('.')) {
            const ext = getExtensionFromMimetype(mimetype);
            filename += ext;
        }
        
        return filename;
    } catch (e) {
        return 'download';
    }
}

function getExtensionFromMimetype(mimetype) {
    const mimeMap = {
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/x-msvideo': '.avi',
        'video/quicktime': '.mov',
        'video/x-matroska': '.mkv',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg',
        'audio/aac': '.aac',
        'application/vnd.apple.mpegurl': '.m3u8',
        'application/x-mpegurl': '.m3u8',
        'text/plain': '.txt'
    };
    return mimeMap[mimetype] || '';
}

function isStreamingFile(url) {
    const streamingExtensions = ['.m3u8', '.m3u', '.mpd'];
    const lowerUrl = url.toLowerCase();
    return streamingExtensions.some(ext => lowerUrl.includes(ext));
}

// Fungsi untuk update badge di chrome action icon
function updateActionBadge() {
    const count = DetectedFiles.length;
    if (count > 0) {
        chrome.action.setBadgeText({ text: String(count) });
        chrome.action.setBadgeBackgroundColor({ color: '#dd4b39' }); // Merah
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

chrome.downloads.onCreated.addListener(async function(downloadItem) {
    if (!InterruptDownloads || ResponGdm) {
        return;
    }
    if (chrome.runtime.lastError) {
        if (!downloadItem['finalUrl'].includes("blob:")) {
            chrome.downloads.cancel(downloadItem.id);
        }
    } else {
        console.clear();
    }
});

chrome.downloads.onDeterminingFilename.addListener(async function(downloadItem) {
    if (!InterruptDownloads || ResponGdm) {
        return;
    }
    if (downloadItem['finalUrl'].includes("blob:")) {
        return;
    }

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTabUrl = tab ? tab.url : downloadItem.referer;
    queueMicrotask(function() {
        chrome.downloads.cancel(downloadItem.id, function() {
            SendToOniDM(downloadItem, currentTabUrl);
            chrome.downloads.erase({ id: downloadItem.id });
        });
    });
});

SendToOniDM = async function(downloadItem, tabUrl) {
    const cookies = await chrome.cookies.getAll({ url: tabUrl });
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    let strurl = `link:${downloadItem.finalUrl};,filename:${downloadItem.filename};,referrer:${tabUrl};,mimetype:${downloadItem.mime};,filesize:${downloadItem.fileSize};,resumable:${downloadItem.canResume};,useragent:${navigator.userAgent};,header:${cookieStr};,`;
    fetch(get_host(), { method: 'post', body: strurl }).then(function(r) { return r.text(); }).catch(function() {});
}

async function chromeStorageGetter(key) {
    return new Promise(resolve => {
        chrome.storage.sync.get(key, (obj) => {
            return resolve(obj[key] || '');
        })
    });
}

async function load_conf() {
    InterruptDownloads = await chromeStorageGetter('interrupt-download');
    DownloadVideo = await chromeStorageGetter('video-download');
    CustomPort = await chromeStorageGetter('port-custom');
    PortSet = await chromeStorageGetter('port-input');
    icon_load();
}

async function setPortCustom(interrupt) {
    await SavetoStorage('port-custom', interrupt);
}

async function setVideoMenu(download) {
    await SavetoStorage('video-download', download);
}

async function setPortInput(interrupt) {
    if (CustomPort) {
        await SavetoStorage('port-input', interrupt);
    }
}

async function setInterruptDownload(interrupt) {
    await SavetoStorage('interrupt-download', interrupt);
}

async function SavetoStorage(key, value) {
    return new Promise(resolve => {
        chrome.storage.sync.set({ [key]: value }, resolve);
    });
}

chrome.commands.onCommand.addListener((command) => {
    if (command == "Ctrl+Shift+Y") {
        setInterruptDownload(!InterruptDownloads);
        load_conf();
    } else if (command == "Ctrl+Shift+E") {
        DownloadVideo = !DownloadVideo;
        chrome.tabs.query({}, function(tab) {
            chrome.tabs.reload(tab.Id, null, function() {});
        });
        setVideoMenu(DownloadVideo);
        load_conf();
    }
});

chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    if (request.extensionId == "interuptopen") {
        chrome.runtime.sendMessage({ message: InterruptDownloads, extensionId: "popintrup" }).catch(function() {});
    } else if (request.extensionId == "customopen") {
        chrome.runtime.sendMessage({ message: CustomPort, extensionId: "popcust" }).catch(function() {});
    } else if (request.extensionId == "portopen") {
        chrome.runtime.sendMessage({ message: PortSet, extensionId: "popport" }).catch(function() {});
    } else if (request.extensionId == "videoopen") {
        chrome.runtime.sendMessage({ message: DownloadVideo, extensionId: "popvideo" }).catch(function() {});
    } else if (request.extensionId == "videochecked") {
        if (DownloadVideo != request.message) {
            DownloadVideo = request.message;
            chrome.tabs.query({}, function(tab) {
                chrome.tabs.reload(tab.Id, null, function() {});
            });
        }
        setVideoMenu(request.message);
        load_conf();
    } else if (request.extensionId == "interuptchecked") {
        setInterruptDownload(request.message);
        load_conf();
    } else if (request.extensionId == "customchecked") {
        setPortCustom(request.message);
        load_conf();
    } else if (request.extensionId == "portval") {
        setPortInput(request.message);
        load_conf();
    } else if (request.extensionId == "requestFileList") {
        // Update badge dan kirim list file terbaru ke popup
        updateActionBadge();
        chrome.runtime.sendMessage({
            extensionId: "fileListUpdate",
            files: DetectedFiles
        }).catch(function() {});
    } else if (request.extensionId == "downloadFile") {
        // Handle download dari popup
        if (!InterruptDownloads || ResponGdm) {
            downloadchrome(request.fileUrl);
            return;
        }
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const cookies = await chrome.cookies.getAll({ url: tab.url });
        const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join("; ");
        // Untuk HLS/M3U8, gunakan title page sebagai filename
        let filename = request.filename;
        if (request.mimetype.includes('application/vnd.apple.mpegurl') || 
            request.mimetype.includes('application/x-mpegurl') ||
            request.filename.endsWith('.m3u8') || request.filename.endsWith('.m3u')) {
            // Get page title sebagai nama file
            const pageTitle = tab.title || 'download';
            filename = pageTitle.replace(/[<>:"/\\|?*]/g, '').trim() + '.m3u8';
        }

        let strurl = `link:${request.fileUrl};,filename:${filename};,referrer:${tab.url};,mimetype:${request.mimetype};,filesize:${request.filesize};,resumable:false;,useragent:${navigator.userAgent};,header:${cookieStr};,`;
        fetch(get_host(), { method: 'post', body: strurl }).then(function(r) { return r.text(); }).catch(function() {});
    } else if (request.extensionId == "clearFileList") {
        // Handle clear list dari popup
        DetectedFiles = [];
        updateActionBadge(); // Clear badge icon
        chrome.runtime.sendMessage({
            extensionId: "fileListUpdate",
            files: DetectedFiles
        }).catch(function() {});
    }
});

async function downloadchrome(urls) {
    let url = urls.substring(5, urls.lastIndexOf(",filename:"));
    await chrome.downloads.download({ url: url });
}

get_host = function() {
    if (CustomPort) {
        return `http://127.0.0.1:${PortSet}`;
    } else {
        return "http://127.0.0.1:2021";
    }
}

icon_load = function() {
    if (InterruptDownloads && !ResponGdm) {
        chrome.action.setIcon({ path: "./icons/icon_32.png" });
    } else {
        chrome.action.setIcon({ path: "./icons/icon_disabled_32.png" });
    }
}