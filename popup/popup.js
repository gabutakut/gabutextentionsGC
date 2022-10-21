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

let PortInput = $('#port-input');
let DownloadIntrupt = $('#interrupt-download');
let DownloadVideo = $('#video-download');
let PortCustom = $('#port-custom');

chrome.runtime.sendMessage({ extensionId: "interuptopen" }).catch(function() {});
chrome.runtime.sendMessage({ extensionId: "customopen" }).catch(function() {});
chrome.runtime.sendMessage({ extensionId: "portopen" }).catch(function() {});
chrome.runtime.sendMessage({ extensionId: "videoopen" }).catch(function() {});

DownloadIntrupt.on("change", dwinterupt);
PortCustom.on("change", customchecked);
DownloadVideo.on("change", videocase);
PortInput.on("change paste keyup", portinput);

function dwinterupt () {
     chrome.runtime.sendMessage({  message: DownloadIntrupt.prop ('checked'), extensionId: "interuptchecked" }).catch(function() {});
}
function videocase () {
     chrome.runtime.sendMessage({  message: DownloadVideo.prop ('checked'), extensionId: "videochecked" }).catch(function() {});
}

function customchecked () {
     chrome.runtime.sendMessage({ message: PortCustom.prop ('checked'), extensionId: "customchecked" }).catch(function() {});
     hide_popin ();
}

function portinput () {
     chrome.runtime.sendMessage({ message: PortInput.val (), extensionId: "portval" }).catch(function() {});
}

chrome.runtime.onMessage.addListener((request, callback) => {
     if (request.extensionId == "Ctrl+Shift+Y") {
          DownloadIntrupt.prop('checked', request.message);
     } else if (request.extensionId == "Ctrl+Shift+E") {
          DownloadVideo.prop('checked', request.message);
     } else if (request.extensionId == "popintrup") {
          DownloadIntrupt.prop('checked', request.message);
     } else if (request.extensionId == "popvideo") {
          DownloadVideo.prop('checked', request.message);
     } else if (request.extensionId == "popcust") {
          PortCustom.prop('checked', request.message);
          hide_popin ();
     } else if (request.extensionId == "popport") {
          PortInput.val(request.message);
     }
});

function hide_popin () {
     if (PortCustom.prop ('checked')) {
          PortInput.removeClass ('hidden');
     } else {
          PortInput.addClass ('hidden');
     }
}

setInterval(function () {
     chrome.runtime.sendMessage({ extensionId: "interuptopen" }).catch(function() {});
     chrome.runtime.sendMessage({ extensionId: "customopen" }).catch(function() {});
     chrome.runtime.sendMessage({ extensionId: "videoopen" }).catch(function() {});
}, 1000);