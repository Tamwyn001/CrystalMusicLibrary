const express = require("express");

const JobCD = require("../jobs/jobCD");
const { JobStatus, Job } = require("../jobs/jobBase");
const JobFFT = require("../jobs/jobFFT");
const bodyParser = require("body-parser");
const { getMulterInstance } = require("../multerConfig");
const LibraryConfig = require("./libraryConfig");
const JobLyrics = require("../jobs/jobLyrics");

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
     * @param {boolean} inPlace Should we input the an exisiting job? If false creates a new one.
     * @returns 
     */
    registerNewJob (jobKey, payload, inPlace) {
        // Escpade cases
        switch(jobKey){
            case 'JOB_FFT':
                if(!this.libraryConfig.currentConfig.ServerFFT.useServerFFT) return;
                break;
        };

        if(inPlace){
            const existingJob = this.jobs.find(job => job.jobKey === jobKey);
            if(existingJob) {
                existingJob.addNewTask(payload);
                return;
            }
        }
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
            this.registerNewJob(req.params.id, payload, false);
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