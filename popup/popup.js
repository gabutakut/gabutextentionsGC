let GabutDownload, PortInput, DownloadIntrupt, PortCustom;
if (typeof browser !== 'undefined') {
     GabutDownload = browser;
} else if (typeof chrome !== 'undefined') {
     GabutDownload = chrome;
}

function SeveChange () {
     GabutDownload.runtime.getBackgroundPage(async (backgroundPage) => {
         await backgroundPage.setInterruptDownload (DownloadIntrupt.prop ('checked'));
         await backgroundPage.setPortCustom (PortCustom.prop ('checked'), (CustomPort)=>{
              if (CustomPort == true) {
                    PortInput.removeClass ('hidden');
               } else {
                    PortInput.addClass ('hidden');
               }
         }); 
         await backgroundPage.setPortInput (PortInput.val (), (PortSet)=>{
              document.getElementById ("home").href="http://127.0.0.1:"+PortSet;
         });
     });
}

GetSettings ();
function GetSettings () {
     GabutDownload.runtime.getBackgroundPage(async (backgroundPage) => {
          PortInput = $('#port-input');
          DownloadIntrupt = $('#interrupt-download');
          PortCustom = $('#port-custom');
          let config = await backgroundPage.getConfigure ((interruptDownloads, CustomPort, PortSet)=> {
               if (CustomPort == true) {
                    PortInput.removeClass ('hidden');
               } else {
                    PortInput.addClass ('hidden');
               }
               document.getElementById ("home").href="http://127.0.0.1:"+PortSet;
          });
          DownloadIntrupt.prop('checked', config['interrupt-download']);
          PortCustom.prop('checked', config['port-custom']);
          PortInput.val(config['port-input']);
          DownloadIntrupt.on("change", SeveChange);
          PortInput.on("change paste keyup", SeveChange);
          PortCustom.on("change", SeveChange);
     });
}

GabutDownload.runtime.onMessage.addListener((message, callback) => {
     if (message.message == "Ctrl+Shift+Y") {
          GetSettings ();
     } else if (message.message == "Ctrl+Shift+E") {
          GetSettings ();
     }
});