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

let interruptDownloads, CustomPort, GabutDownload;
if (typeof browser !== 'undefined') {
     GabutDownload = browser;
} else if (typeof chrome !== 'undefined') {
     GabutDownload = chrome;
}
let PortInput = $('#port-input');
let DownloadIntrupt = $('#interrupt-download');
let PortCustom = $('#port-custom');

GabutDownload.runtime.sendMessage({ extensionId: "interuptopen" });
GabutDownload.runtime.sendMessage({ extensionId: "customopen" });
GabutDownload.runtime.sendMessage({ extensionId: "portopen" });
DownloadIntrupt.on("change", dwinterupt);
PortCustom.on("change", customchecked);
PortInput.on("change paste keyup", portinput);

function dwinterupt () {
     GabutDownload.runtime.sendMessage({  message: DownloadIntrupt.prop ('checked'), extensionId: "interuptchecked" });
}

function customchecked () {
     GabutDownload.runtime.sendMessage({ message: PortCustom.prop ('checked'), extensionId: "customchecked" });
     hide_popin ();
}

function portinput () {
     GabutDownload.runtime.sendMessage({ message: PortInput.val (), extensionId: "portval" });
}

GabutDownload.runtime.onMessage.addListener((message, callback) => {
     if (message.extensionId == "Ctrl+Shift+Y") {
          interruptDownloads = message.message;
          DownloadIntrupt.prop('checked', interruptDownloads);
     } else if (message.extensionId == "Ctrl+Shift+E") {
          CustomPort = message.message;
          PortCustom.prop('checked', CustomPort);
          hide_popin ();
     } else if (message.extensionId == "popintrup") {
          interruptDownloads = message.message;
          DownloadIntrupt.prop('checked', interruptDownloads);
     } else if (message.extensionId == "popcust") {
          CustomPort = message.message;
          PortCustom.prop('checked', CustomPort);
          hide_popin ();
     } else if (message.extensionId == "popport") {
          PortInput.val(message.message);
     }
});

function hide_popin () {
     if (PortCustom.prop ('checked')) {
          PortInput.removeClass ('hidden');
     } else {
          PortInput.addClass ('hidden');
     }
}