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
chrome.runtime.sendMessage({ extensionId: "requestFileList" }).catch(function() {});

// Tab navigation
$('.nav-link').click(function(e) {
    e.preventDefault();
    const tabIndex = $(this).data('tab');
    
    $('.nav-link').removeClass('active');
    $(this).addClass('active');
    
    $('.tab-pane').removeClass('active');
    $('#tab-' + tabIndex).addClass('active');
});

DownloadIntrupt.on("change", dwinterupt);
PortCustom.on("change", customchecked);
DownloadVideo.on("change", videocase);
PortInput.on("change paste keyup", portinput);

function dwinterupt() {
    chrome.runtime.sendMessage({ message: DownloadIntrupt.prop('checked'), extensionId: "interuptchecked" }).catch(function() {});
}

function videocase() {
    chrome.runtime.sendMessage({ message: DownloadVideo.prop('checked'), extensionId: "videochecked" }).catch(function() {});
}

function customchecked() {
    chrome.runtime.sendMessage({ message: PortCustom.prop('checked'), extensionId: "customchecked" }).catch(function() {});
    hide_popin();
}

function portinput() {
    chrome.runtime.sendMessage({ message: PortInput.val(), extensionId: "portval" }).catch(function() {});
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
        hide_popin();
    } else if (request.extensionId == "popport") {
        PortInput.val(request.message);
    } else if (request.extensionId == "fileListUpdate") {
        // Update list file ketika ada file baru terdeteksi
        updateFileList(request.files);
        switchToListView(request.files && request.files.length > 0);
    }
});

function hide_popin() {
    if (PortCustom.prop('checked')) {
        PortInput.removeClass('hidden');
    } else {
        PortInput.addClass('hidden');
    }
}

// Update file list setiap 1 detik
setInterval(function() {
    chrome.runtime.sendMessage({ extensionId: "interuptopen" }).catch(function() {});
    chrome.runtime.sendMessage({ extensionId: "customopen" }).catch(function() {});
    chrome.runtime.sendMessage({ extensionId: "videoopen" }).catch(function() {});
    chrome.runtime.sendMessage({ extensionId: "requestFileList" }).catch(function() {});
}, 1000);

// Dynamic Home Tab View Switching
function switchToListView(hasFiles) {
    if (hasFiles) {
        $('#home-view').hide();
        $('#list-view').show();
    } else {
        $('#home-view').show();
        $('#list-view').hide();
    }
}

// Fungsi untuk update list file di popup
function updateFileList(files) {
    const container = document.getElementById('file-list-container');
    
    if (!files || files.length === 0) {
        container.innerHTML = '<p>No files detected</p>';
        return;
    }

    let html = '<div>';
    
    files.forEach((file, index) => {
        const icon = getFileTypeIcon(file.type);
        const sizeStr = formatFileSize(file.size);
        
        html += `
            <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i style="font-size: 20px; color: ${getColorByType(file.type)}" class="${icon}"></i>
                    <div style="flex: 1; text-align: left;">
                        <div style="font-weight: bold; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(file.filename)}
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            ${sizeStr} • ${file.type.toUpperCase()}
                        </div>
                    </div>
                </div>
                <button class="download-btn" data-index="${index}" data-url="${escapeHtml(file.url)}" data-filename="${escapeHtml(file.filename)}" data-mimetype="${file.mimetype}" data-size="${file.size}">
                    Download
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;

    // Attach event listeners ke tombol download
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const fileUrl = this.getAttribute('data-url');
            const filename = this.getAttribute('data-filename');
            const mimetype = this.getAttribute('data-mimetype');
            const filesize = this.getAttribute('data-size');
            
            chrome.runtime.sendMessage({
                extensionId: "downloadFile",
                fileUrl: fileUrl,
                filename: filename,
                mimetype: mimetype,
                filesize: filesize
            }).catch(function() {});
        });
    });
}

function getFileTypeIcon(type) {
    switch(type) {
        case 'video':
            return 'fa fa-film';
        case 'audio':
            return 'fa fa-music';
        case 'streaming':
            return 'fa fa-stream';
        default:
            return 'fa fa-file';
    }
}

function getColorByType(type) {
    switch(type) {
        case 'video':
            return '#FF6B6B';
        case 'audio':
            return '#4ECDC4';
        case 'streaming':
            return '#FFD93D';
        default:
            return '#999';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear list button handler
function initClearButton() {
    const clearBtn = document.getElementById('clear-list-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            chrome.runtime.sendMessage({
                extensionId: "clearFileList"
            }).catch(function() {});
            document.getElementById('file-list-container').innerHTML = '<p>No files detected</p>';
            switchToListView(false);
        });
    }
}

// Init clear button
document.addEventListener('DOMContentLoaded', function() {
    initClearButton();
}, false);

// Juga init saat popup pertama dibuka
initClearButton();