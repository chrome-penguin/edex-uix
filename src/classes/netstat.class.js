class Netstat {
    constructor(parentId) {
        if (!parentId) throw "Missing parameters";

        const { ipcRenderer } = window.electron;

        // Create DOM
        this.parent = document.getElementById(parentId);
        this.parent.innerHTML += `<div id="mod_netstat">
            <div id="mod_netstat_inner">
                <h1>NETWORK STATUS<i id="mod_netstat_iname"></i></h1>
                <div id="mod_netstat_innercontainer">
                    <div>
                        <h1>STATE</h1>
                        <h2>UNKNOWN</h2>
                    </div>
                    <div>
                        <h1>IPv4</h1>
                        <h2>--.--.--.--</h2>
                    </div>
                    <div>
                        <h1>PING</h1>
                        <h2>--ms</h2>
                    </div>
                </div>
            </div>
        </div>`;

        this.offline = false;
        this.iface = null;
        this.runsBeforeGeoIPUpdate = 0;

        // Init updaters
        this.updateInfo();
        this.infoUpdater = setInterval(() => {
            this.updateInfo();
        }, 2000);
    }

    async updateInfo() {
        try {
            const data = await window.si.networkInterfaces();
            let net = data[0];
            let netID = 0;

            if (typeof window.settings.iface === "string") {
                while (net.iface !== window.settings.iface) {
                    netID++;
                    if (data[netID]) {
                        net = data[netID];
                    } else {
                        window.settings.iface = false;
                        return;
                    }
                }
            } else {
                while (net.operstate !== "up" || net.internal === true || net.ip4 === "" || net.mac === "") {
                    netID++;
                    if (data[netID]) {
                        net = data[netID];
                    } else {
                        this.iface = null;
                        document.getElementById("mod_netstat_iname").innerText = "Interface: (offline)";
                        this.offline = true;
                        this.updateOfflineStatus();
                        return;
                    }
                }
            }

            if (net.ip4 !== this.internalIPv4) this.runsBeforeGeoIPUpdate = 0;

            this.iface = net.iface;
            this.internalIPv4 = net.ip4;
            document.getElementById("mod_netstat_iname").innerText = "Interface: " + net.iface;

            if (net.ip4 === "127.0.0.1") {
                this.offline = true;
                this.updateOfflineStatus();
                return;
            }

            if (this.runsBeforeGeoIPUpdate === 0) {
                try {
                const ipInfo = await window.eDEX.ipcRenderer.invoke('get-external-ip', net.ip4);
                    if (ipInfo && ipInfo.ip) {
                        this.ipinfo = ipInfo;
                        document.querySelector("#mod_netstat_innercontainer > div:nth-child(2) > h2").innerHTML = window._escapeHtml(ipInfo.ip);
                        window.mods.globe.addTemporaryConnectedMarker(ipInfo.ip);
                    }
                    this.runsBeforeGeoIPUpdate = 10;
                } catch (e) {
                    console.warn("Could not get external IP:", e);
                }
            } else {
                this.runsBeforeGeoIPUpdate--;
            }

            try {
            const pingTime = await window.eDEX.ipcRenderer.invoke('ping', window.settings.pingAddr || "1.1.1.1", 80, net.ip4);
                this.offline = false;
                document.querySelector("#mod_netstat_innercontainer > div:first-child > h2").innerHTML = "ONLINE";
                document.querySelector("#mod_netstat_innercontainer > div:nth-child(3) > h2").innerHTML = Math.round(pingTime) + "ms";
            } catch (e) {
                this.offline = true;
                this.updateOfflineStatus();
            }

        } catch (e) {
            console.error("Error updating network info:", e);
            this.offline = true;
            this.updateOfflineStatus();
        }
    }

    updateOfflineStatus() {
        document.querySelector("#mod_netstat_innercontainer > div:first-child > h2").innerHTML = "OFFLINE";
        document.querySelector("#mod_netstat_innercontainer > div:nth-child(2) > h2").innerHTML = "--.--.--.--";
        document.querySelector("#mod_netstat_innercontainer > div:nth-child(3) > h2").innerHTML = "--ms";
    }
}

window.Netstat = Netstat;