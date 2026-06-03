const express = require("express");

const JobCD = require("./jobCD");
const { JobStatus, Job } = require("./jobBase");
const JobFFT = require("./jobFFT");
const bodyParser = require("body-parser");
const { getMulterInstance } = require("../multerConfig");
const LibraryConfig = require("../routes/libraryConfig");
const JobLyrics = require("./jobLyrics");

class JobsManager {
    /** @type {Job[]} */
    jobs = [];
    router = express.Router(); 
    upload = getMulterInstance();
    /**@type {LibraryConfig} */
    libraryConfig = null;
    constructor(){
        this.registerRoutes();
    }
    getAlljobs () {
        return this.jobs;
    }
    /**
     * 
     * @param {string} jobKey The key to identify the job
     * @param {*} payload The content to pass to the job
     * @returns 
     */
    registerNewJob (jobKey, payload) {
        // Escpade cases
        switch(jobKey){
            case 'JOB_FFT':
                if(!this.libraryConfig.currentConfig.ServerFFT.useServerFFT) return;
                break;
        };

        var newJob = null;
        switch(jobKey){
            case 'JOB_CD':
                newJob = new JobCD("JOB_CD", this, payload);
                break;
            case 'JOB_FFT':
                newJob = new JobFFT("JOB_FFT", this, payload);
                break;
            case 'JOB_LYRICS':
                newJob = new JobLyrics("JOB_LYRICS", this, payload);
                break;
        }
        if(!newJob) return;
        this.jobs.push(newJob);        

    }

    supplyJob(jobKey, payload){
        const existingJob = this.jobs.find(job => job.jobKey === jobKey);
        if(existingJob) {
            existingJob.addNewTask(payload);
            return;
        }
        // If no job found, we need to create one.
        this.registerNewJob(jobKey, payload);
    };
    pauseJob (jobKey) {
        const existingJob = this.jobs.find(job => job.jobKey === jobKey);
        if(!existingJob) return;
        existingJob.pauseJob();
    }

    resumeJob (jobKey) {
        const existingJob = this.jobs.find(job => job.jobKey === jobKey);
        if(!existingJob) return;
        existingJob.resumeJob();
    }

    stopJob (jobKey) {
        const existingJobId = this.jobs.findIndex(job => job.jobKey === jobKey);
        if(existingJobId === -1) return;
        this.jobs[existingJobId].stopJob();
        this.jobs.splice(existingJobId, 1);
    }

    registerRoutes () {
        this.router.get("/status/:id", (req,res) =>{
            const job = this.getAlljobs().find(job => job.jobKey === req.params.id);
            res.json({status : job? job.status : JobStatus.INACTIVE
                , progress : job ? job.progress : null});
        });
         
        this.router.post("/run/:id", this.upload.none(), (req,res) =>{
            const payload = JSON.parse(req.body.payload);
            this.registerNewJob(req.params.id, payload);
            res.json({message:""});
         });

        this.router.post("/supply/:id", this.upload.none(), (req,res) =>{
            
            const payload = JSON.parse(req.body.payload);
            console.log(payload);
            this.supplyJob(req.params.id, payload);
            res.json({message:""});
         });

         
        this.router.get("/pause/:id", (req,res) =>{
            this.pauseJob(req.params.id);
            res.json({message:""});
         });

         this.router.get("/resume/:id", (req,res) =>{
            this.resumeJob(req.params.id);
            res.json({message:""});
         });
         
        this.router.get("/stop/:id", (req,res) =>{
            this.stopJob(req.params.id);
            res.json({message:""});
         });
    }
}


module.exports = JobsManager;