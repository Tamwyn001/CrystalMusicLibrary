const dns = require('dns');
const { Router } = require('express');
const util = require('util');
const resolveSrv = util.promisify(dns.resolveSrv);
const icy = require('icy');
const { getMulterInstance } = require('../multerConfig');
const { getUserKnownRadios, addUserKnowRadio, getRadioInfos, toogleUserLikesRadio } = require('../db-utils');
const jwt = require("jsonwebtoken");
const { Readable } = require('stream');
const _ = require("lodash");
const verify = require('./verify');
const { LIBRARY_AGENT } = require('../statics');

const uploadPath = process.env.CML_DATA_PATH_RESOLVED; // Assume your main file resolves it
const upload = getMulterInstance(uploadPath);

/**
 * This class handles the router for the radio metadata fecthing at:
 * https://www.radio-browser.info/
 * This open source service stores radio stations metadatas and can be fetched
 * on different servers.
 * Some servers: 
 *  https://fi1.api.radio-browser.info,
 *  https://de1.api.radio-browser.info,
 *  https://de2.api.radio-browser.info
 * The servers are fetched and stored on startup.
 */
class RadioRouter{
    /** @type {import('express').Router} */
    router;
    /** @type {Array<string>} */
    radioServers = [];
    
    constructor() {
        this.router = Router();
        this.get_radiobrowser_base_urls().then(hosts => {
            this.radioServers = hosts;
            }
        ).catch( (err) => {
            console.log("Error while trying to resolve a radio-browser server. Is the terminal connected to the internet? Code:", err.code);
        });

        this.registerRoutes();
    }

    getRouter() {
        return this.router;
      }

    GetServersList ()  {
        return this.radioServers;
    } 

    // From https://api.radio-browser.info/examples/serverlist_fast.js
    /**
     * Get a list of base urls of all available radio-browser servers
     * @Returns array of strings - base urls of radio-browser servers
     */
    async get_radiobrowser_base_urls () {
        return resolveSrv("_api._tcp.radio-browser.info").then(hosts => {
            hosts.sort();
            return hosts.map(host => "https://" + host.name);
        });
    }
    
    registerRoutes () {
        this.router.get("/stations", async (req, res) =>{
            const stations = await this.getRandomRecusrive(0).catch((err) => {
                console.log(err);
                return res.status(500).send("Error while fetching radios");
            });
            res.json(JSON.stringify(stations));
        })
        // Route to get the radio name and image, works with icy
        this.router.get("/metadata/:url", async (req,res) => {
           const metadata = await this.getMetadataRecursive(0, req.params.url);
           res.json(metadata);
           
        });

        // Route to get the stream title and name, work with radio-browser
        // SSE endpoint for continuous metadata
        //@ts-ignore        
        this.router.get("/trackStream/:url", async (req, res) => {
            const streamURL = decodeURIComponent(req.params.url);
        
            if (!/^https?:\/\/.+/.test(streamURL)) {
                return res.status(400).json({ valid: false, reason: "Invalid URL format" });
            }
        
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
        
            try {
                //@ts-ignore
                const reqStream = icy.get(streamURL, (icyRes) => {
                    icyRes.on("metadata", (metadata) => {
                        const parsed = icy.parse(metadata);
                        const data = JSON.stringify({ metadata: parsed });
                        res.write(`data: ${data}\n\n`);
                    });
        
                    icyRes.on("error", (err) => {
                        console.log(err);
                        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                    });
                });
        
                reqStream.on("error", (err) => {
                    console.log(err);
                    // Catches ENOTFOUND, ECONNREFUSED, etc.
                    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
                });
        
                reqStream.end(); // Very important!
        
                req.on("close", () => {
                    res.end(); // Clean up on client disconnect
                    reqStream.destroy(); // stop the request if still running
                });
        
            } catch (err) {
                console.log(err);
                res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
            }
        });
        this.router.post("/addToFavs/:uuid", verify.token, async (req,res)=>{
            const metadata = await this.getMetadataRecursiveUUID(0, req.params.uuid);
            if(!metadata) return res.status(404).json({message:"No radio found", added : false});
            if(metadata?.length == 0) return res.status(404).json({message:"No radio found", added : false});
            const added = toogleUserLikesRadio(req.decoded.email, 
                {uuid : metadata[0].stationuuid , name: metadata[0].name,
                url: metadata[0].url_resolved, favicon: metadata[0].favicon});
            res.json({message: added ? "Radio added." : "Radio removed.", added });
        });
        this.router.get("/favicon-proxy", async (req, res) => {
            const url = req.query.url;
            
            // Basic whitelist check — make sure it's a valid URL
            try {
              new URL(url);
            } catch (err){
                return res.status(400).send("Invalid URL");
            }
          
            try {
              const response = await fetch(url);
              if (!response.ok) return res.status(500).send("Error fetching image");;
              const buffer = Buffer.from(await response.arrayBuffer());
              res.set("Content-Type", response.headers.get("content-type") || "image/png");
              res.send(buffer);
            } catch (err) {

                res.status(500).send("Error fetching image");
            }
          });


        // Route to get the user's known radios
        this.router.get("/radios", (req,res) => {
            const token =req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
            // @ts-ignore
            res.json(getUserKnownRadios(decoded.email));
        });

        this.router.get("/:id", (req,res) => {
            // @ts-ignore
            res.json(getRadioInfos(req.params.id));
        });

        // Route to create new user's known radio.
        this.router.post("/newRadio", verify.token, upload.none(), (req, res) => {
            const radioData = JSON.parse(req.body.radioData);
            // @ts-ignore
            addUserKnowRadio(req.decoded.email, radioData);
            res.json({message : "Radio successfly added."});
        });

        // @ts-ignore
        // If the radios are not expected to be played in browser, we spoof with a custom
        // user agent.. hehe
        this.router.get('/spoof/:url', async (req, res) => {
            try{
                const response = await fetch(`${decodeURIComponent(req.params.url)}`, {
                headers: { 'User-Agent': 'VLC media player' }
                });
            
                if (!response.ok) {
                return res.sendStatus(response.status);
                }
            
                res.set({
                'Content-Type': response.headers.get('Content-Type') || 'audio/aac',
                'Transfer-Encoding': 'chunked'
                });
            
                // Convert Web stream to Node stream
                // @ts-ignore
                const nodeStream = Readable.fromWeb(response.body);
                nodeStream.pipe(res);
            }
            catch (err){
                console.log(err);
            }
          });
    }

    async getRandomRecusrive(id){
        if(!this.radioServers[id]) return null;
        try {
            const response = await fetch(`${this.radioServers[id]}/json/stations`,
                {
                    headers: LIBRARY_AGENT,
                    method : "POST",
                    body : new URLSearchParams(
                        { offset: `${Math.floor(Math.random()*100000)}`,
                         limit: "50",
                         order: "random",
                         hidebroken : "true" })
                }
            );
            const json = await response.json();

            if (json && json.length > 0) {
                const total = _.shuffle(json);
                return total.slice(0,6);
            } else {
                return this.getRandomRecusrive(id + 1); // ✅ Return the recursive call
            }
        } catch (e) {
            console.log(e);
            // If fetch fails (network, etc.), try next server
            return this.getRandomRecusrive(id + 1);
        }
    }

        


    /**
     * @param {number} id The current index of the radio server
     * @param {string} UUID The station UUID to check, comma-separated list of UUIDs 
     * @returns {Promise<Object|null>} The metadata JSON or null if not found
     */
    async getMetadataRecursiveUUID(id, UUID) {
        if (this.radioServers.length <= id) return null;

        try {
            const response = await fetch(`${this.radioServers[id]}/json/stations/byuuid?uuids=${UUID}`,
                {
                    headers: { 'User-Agent': 'Crystal Music Library/3.0.0' }
                }
            );
            const json = await response.json();

            if (json && json.length > 0) {
                return json;
            } else {
                return this.getMetadataRecursive(id + 1, UUID); // ✅ Return the recursive call
            }
        } catch (err) {
            console.log(err);
            // If fetch fails (network, etc.), try next server
            return this.getMetadataRecursive(id + 1, UUID);
        }
    }
        
    /**
     * @param {number} id The current index of the radio server
     * @param {string} URL The station URL to check, URI encoded
     * @returns {Promise<Object|null>} The metadata JSON or null if not found
     */
    async getMetadataRecursive(id, URL) {
        if (this.radioServers.length <= id) return null;

        try {
            const response = await fetch(`${this.radioServers[id]}/json/stations/byurl?url=${URL}`,
                {
                    headers: { 'User-Agent': 'Crystal Music Library/3.0.0' }
                }
            );
            const json = await response.json();

            if (json && json.length > 0) {
                return json;
            } else {
                return this.getMetadataRecursive(id + 1, URL); // ✅ Return the recursive call
            }
        } catch (err) {
            console.log(err);
            // If fetch fails (network, etc.), try next server
            return this.getMetadataRecursive(id + 1, URL);
        }
    }

    

} 




module.exports = RadioRouter;
/**
 * Get a random available radio-browser server.
 * Returns: string - base url for radio-browser api
 */
// function get_radiobrowser_base_url_random() {
//     return get_radiobrowser_base_urls().then(hosts => {
//         var item = hosts[Math.floor(Math.random() * hosts.length)];
//         return item;
//     });
// }

// get_radiobrowser_base_urls().then(hosts => {
//     console.log("All available urls")
//     console.log("------------------")
//     for (let host of hosts) {
//         console.log(host);
//     }
//     console.log();

//     return get_radiobrowser_base_url_random();
// }).then(random_host => {
//     console.log("Random base url")
//     console.log("------------------")
//     console.log(random_host);
// });

