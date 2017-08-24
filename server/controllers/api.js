/**
 * Created by Jad on 2017/7/26.
 */
const fs = require('fs');
const resolve = require('path').resolve;
const ws = require(resolve(__dirname, './../models/webSock'));
const moment = require('moment');
let {generateZip, getFilesCount} = require(resolve(__dirname, './../utils/index.js'));

const imgFolder = resolve(__dirname, './../../public/img');
let zipFolder = null;
let postTileImg = async (ctx) => {
    let url = ctx.request.body.url;
    let data = ctx.request.body.data;
    let dataBuffer = new Buffer(data, 'base64');

    // let zxy = url.split('/blackmarble/')[1].split('.')[0].split('/');
    let zxy = url.split('/256/')[1].split('@')[0].split('/');
    let z = zxy[0];
    let x = zxy[1];
    let y = zxy[2];
    let imgFileName = resolve(zipFolder, z, x, `${y}.png`);
    let srcFileName = resolve(imgFolder, 'resource', z, x, `${y}.png`);
    fs.writeFile(imgFileName, dataBuffer, function(err){
        if(err){
            console.error(err);
        }
    });

    fs.writeFile(srcFileName, dataBuffer, function(err){
        if(err){
            console.error(err);
        }
    });
    ctx.body = '1';
};

let startLoad = async (ctx) => {
    let totalImgNum = ctx.query.downloadNum || 0;
    let timer = null;
    let blockTime = 0;
    let currTime = moment().format('YYYY-MM-DD-HH-mm-ss');
    zipFolder = resolve(imgFolder, currTime);
    fs.mkdirSync(zipFolder);
    let imgNum = getFilesCount(zipFolder);

    timer = setInterval(()=>{
        let tmp = getFilesCount(zipFolder);
        if(imgNum == tmp){
            if(tmp===Number(totalImgNum) || blockTime++ > 10){
                clearInterval(timer);
                generateZip(zipFolder, resolve(imgFolder, `${currTime}.zip`));
                ws.send(`http://127.0.0.1:3000/img/${currTime}.zip`);
            }
        } else {
            blockTime = 0;
            imgNum = tmp;
            ws.send(imgNum);
        }
    }, 1000);
    ctx.body = '0';
};

let getTileUrl = async (ctx) => {
    let url = ctx.query.url;

    // let zxy = url.split('/blackmarble/')[1].split('.')[0].split('/');
    let zxy = url.split('/256/')[1].split('@')[0].split('/');
    let z = zxy[0];
    let x = zxy[1];
    let y = zxy[2];
    if(!fs.existsSync(resolve(zipFolder, z))){
        fs.mkdirSync(resolve(zipFolder, z))
    }
    if(!fs.existsSync(resolve(zipFolder, z, x))){
        fs.mkdirSync(resolve(zipFolder, z, x))
    }
    let imgFileName = resolve(zipFolder, z, x, `${y}.png`);
    let srcFileName = resolve(imgFolder, 'resource', z, x, `${y}.png`);
    if(fs.existsSync(srcFileName)){
        let data = fs.readFileSync(srcFileName);
        fs.writeFileSync(imgFileName, data);
        ctx.body = {
            isCached: '1',
            url: `http://127.0.0.1:3000/img/${z}/${x}/${y}.png`
        };
    }else{
        if(!fs.existsSync(resolve(imgFolder, 'resource'))){
            fs.mkdirSync(resolve(imgFolder, 'resource'));
        }
        if(!fs.existsSync(resolve(imgFolder, 'resource', z))){
            fs.mkdirSync(resolve(imgFolder, 'resource', z));
        }
        if(!fs.existsSync(resolve(imgFolder, 'resource', z, x))){
            fs.mkdirSync(resolve(imgFolder, 'resource', z, x));
        }
        ctx.body = {
            isCached: '0',
            url
        };
    }
};

module.exports = {
    getTileUrl,
    startLoad,
    postTileImg
};