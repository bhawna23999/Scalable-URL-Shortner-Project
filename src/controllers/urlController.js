const urlModel = require("../model/urlModel");
const shortid = require("shortid")
const redis = require("redis");


const { promisify } = require("util")

//Connect to redis
const redisClient = redis.createClient(
    10982,
    "redis-10982.c246.us-east-1-4.ec2.cloud.redislabs.com",
    { no_ready_check: true}
);
redisClient.auth("dGdtGmV1L3V2lEW8itMmqlPLuVWFr4Et", function (err){
    if (err) throw err;
})

redisClient.on("connect", async function(){
    console.log("Connected to Redis..")
})

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)


const shorten = async function(req,res){

    try
    {
        // Extract Param
        const {longUrl} = req.body 

        if(!longUrl){
            return res.status(400).send({status:false, message:'Long-Url is Required'})
        }

        if(!/^(http(s)?:\/\/)?(www.)?([a-zA-Z0-9])+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(:[0-9]{1,5})?(\/[^\s]*)?$/gm.test(longUrl)){
            return res.status(400).send({status:false, message:'Plese enter valid Url'})
        }

        let cachedUrlData = await GET_ASYNC(`${longUrl}`)

        if(cachedUrlData){
            return res.status(200).send({status:false, message:'This Url is already in Cache', redisData: JSON.parse(cachedUrlData)})
        }

        const findUrl = await urlModel.findOne({longUrl:longUrl}).select({_id:0, longUrl:1, shortUrl:1, urlCode:1})

        if(findUrl){
            await SET_ASYNC(`${longUrl}`, JSON.stringify(findUrl))
            return res.status(200).send({status:false, message:"This Url is already Registered in DB", data:findUrl})
        }

        const baseUrl = 'http://localhost:3000'

        if(!/^(ftp|http|https):\/\/[^ "]+$/.test(baseUrl)){
            return res.status(400).send({status:false, message:"Please send valid base url"})
        }

        let urlCode = shortid.generate()

        let shortUrl = baseUrl + "/" + urlCode

        let newObj = {
            longUrl : longUrl,
            shortUrl : shortUrl,
            urlCode : urlCode
        }
 
        await urlModel.create(newObj)
        res.status(201).send({status:true, data:newObj})

    }
    catch(err)
    {
        console.log(err.message)
        res.status(500).send({status:false, Error:err.message})
    }   
}
    

const getUrlCode = async function(req,res){

    try
    {
        let urlCode = req.params.urlCode

        let cachedUrlData = await GET_ASYNC(`${urlCode}`)
    
        if(cachedUrlData){
            // console.log(cachedUrlData)
            return res.status(302).redirect(JSON.parse(cachedUrlData))
        }
   
        let findUrl = await urlModel.findOne({urlCode:urlCode}) 
    
        if(!findUrl){
            return res.status(404).send({status:false, message:`This ${req.params.urlCode} Url Code is not found.`})
        }
    
        await SET_ASYNC(`${urlCode}`, JSON.stringify(findUrl.longUrl))
        res.status(302).redirect( findUrl.longUrl)

    }
    catch(err)
    {
        console.log(err.message)
        res.status(500).send({status:false, Error:err.message})

    } 
}

module.exports = {shorten, getUrlCode}