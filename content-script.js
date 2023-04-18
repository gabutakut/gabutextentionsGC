var videourl = '';
var audiourl = '';
var input = document.createElement('input');
input.id = 'menu-open-gdm';
input.className = 'menu-open-gdm';
input.type = 'checkbox';
var label = document.createElement('label');
label.className = 'menu-open-button-gdm';
label.setAttribute ("for", "menu-open-gdm");
var span1 = document.createElement('span');
span1.className = 'linemenu-gdm linemenu-gdm-1';
var span2 = document.createElement('span');
span2.className = 'linemenu-gdm linemenu-gdm-2';
var span3 = document.createElement('span');
span3.className = 'linemenu-gdm linemenu-gdm-3';
label.append (span1);
label.append (span2);
label.append (span3);
var vbutton = document.createElement('button');
vbutton.className = 'menu-item-gdm dmvideo';
vbutton.style.position = 'absolute';
vbutton.addEventListener ('click', videoLink);
var abutton = document.createElement('button');
abutton.className = 'menu-item-gdm dmaudio';
abutton.style.position = 'absolute';
abutton.addEventListener ('click', audioLink);
var div = document.createElement('div');
div.className = 'btcontainer-gdm';
div.append (input);
div.append (label);
div.append (vbutton);
div.append (abutton);
document.body.append (div);
function removeCharacters(input) {
  let forbiddenC = ['/', '?', '&','=','.','"', '|']
  for (let char of forbiddenC) {
    input = input.split(char).join('');
  }
  return input
}
function videoLink () {
  if (videourl != '') {
    chrome.runtime.sendMessage({ message: videourl, extensionId: 'gdmurl'}).catch(function() {});
  }
}
function audioLink () {
  if (audiourl != '') {
    chrome.runtime.sendMessage({ message: audiourl, extensionId: 'gdmurl'}).catch(function() {});
  }
}
chrome.runtime.onMessage.addListener (function(request, sender, sendResponse) {
  if (request.message == 'gdmvideo') {
    videourl = get_downloader (request, 'Video');
    vbutton.style.backgroundImage = vdbgred ('white');
    vbutton.setAttribute('title', 'Available');
  } else if (request.message == 'gdmaudio') {
    audiourl = get_downloader (request, 'Audio');
    abutton.style.backgroundImage = adbgred ('white');
    abutton.setAttribute('title', 'Available');
  } else if (request.message == 'gdmclean') {
    vbutton.style.backgroundImage = vdbgred ('red');
    abutton.style.backgroundImage = adbgred ('red');
    vbutton.setAttribute('title', 'Not Available');
    abutton.setAttribute('title', 'Not Available');
    videourl = audiourl = '';
  }
});

function get_downloader (request, filesource) {
  return `link:${request.urls.replace (/&range=\d+-\d+/, '')},filename:${removeCharacters (document.title)} ${filesource}.${request.mimetype.split ('/')[1]},referrer:${document.URL},mimetype:${request.mimetype},filesize:${request.size},resumable:false,`;
}

function vdbgred (color) {
  return `url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'38\' height=\'38\' fill=\'${color}\' class=\'bi bi-film\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h8V1H4zm8 8H4v6h8V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z\'/%3E%3C/svg%3E\")`;
}
function adbgred (color) {
  return `url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='38' height='38' fill=\'${color}\' class='bi bi-music-note-beamed' viewBox='0 0 16 16'%3E%3Cpath d='M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z\'/%3E%3Cpath fill-rule=\'evenodd\' d=\'M14 11V2h1v9h-1zM6 3v10H5V3h1z\'/%3E%3Cpath d=\'M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z\'/%3E%3C/svg%3E\")`;
}