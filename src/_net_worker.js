const https = require("https");
const net = require("net");
const path = require("path");
const { app } = require("electron");
const geolite2 = require("geolite2-redist");
const maxmind = require("maxmind");

let geoLookup = null;

geolite2.downloadDbs(path.join(app.getPath("userData"), "geoIPcache")).then(() => {
    geolite2.open('GeoLite2-City', dbPath => {
        return maxmind.open(dbPath);
    }).then(lookup => {
        geoLookup = lookup;
    }).catch(e => {
        console.error("Could not load GeoIP database:", e);
    });
});

function getExternalIp(localAddress) {
    return new Promise((resolve, reject) => {
        const options = {
            host: "myexternalip.com",
            port: 443,
            path: "/json",
            localAddress: localAddress,
            agent: new https.Agent({ keepAlive: false, maxSockets: 10 })
        };

        https.get(options, res => {
            let rawData = "";
            res.on("data", chunk => { rawData += chunk; });
            res.on("end", () => {
                try {
                    const data = JSON.parse(rawData);
                    const ipInfo = {
                        ip: data.ip,
                        geo: geoLookup ? geoLookup.get(data.ip).location : null
                    };
                    resolve(ipInfo);
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", e => {
            reject(e);
        });
    });
}

function ping(target, port, local) {
    // Validate target to prevent SSRF
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target);
    const isLoopback = target === 'localhost' || target.startsWith('127.') || target === '::1';
    const isPrivate = isIp && /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(target);

    if (isLoopback || isPrivate) {
        return Promise.reject(new Error("Ping to loopback or private network ranges is disallowed for security reasons."));
    }

    return new Promise((resolve, reject) => {
        const s = new net.Socket();
        const start = process.hrtime();

        s.connect({ port, host: target, localAddress: local, family: 4 }, () => {
            const time_arr = process.hrtime(start);
            const time = (time_arr[0] * 1e9 + time_arr[1]) / 1e6;
            resolve(time);
            s.destroy();
        });
        s.on('error', e => {
            s.destroy();
            reject(e);
        });
        s.setTimeout(1900, () => {
            s.destroy();
            reject(new Error("Socket timeout"));
        });
    });
}

module.exports = {
    getExternalIp,
    ping
};