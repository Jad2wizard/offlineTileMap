/**
 * Created by Jad on 2017/7/26.
 */
const fs = require('fs');
const resolve = require('path').resolve;
const ws = require(resolve(__dirname, './../models/webSock'));
const moment = require('moment');
let {generateZip, getLocalIP, getFilesCount} = require(resolve(__dirname, './../utils/index.js'));

const delay = (time = 1000) => new Promise(resolve => {
    setTimeout(resolve, time)
});
const urlReg = /(\/\d+)+/g;
const localIP = getLocalIP();
//本地所有tile图片离线路径
const imgFolder = resolve(__dirname, './../../public/img');
//某个url下的tile图片的本地离线路径
let resourceFolder = null;
let resourceFolderName = null;
//某次下载图片的本地离线路径
let zipFolder = null;

if(!fs.existsSync(resolve(imgFolder, 'resource'))){
    fs.mkdirSync(resolve(imgFolder, 'resource'));
}

/**
 * 前端获取到远程服务器的图片后讲图片的base64编码发送到本地服务器进行离线缓存
 * @param ctx
 * @returns {Promise.<void>}
 */
let postTileImg = async (ctx) => {
    let z = ctx.request.body.z;
    let x = ctx.request.body.x;
    let y = ctx.request.body.y;
    let data = ctx.request.body.data;
    let dataBuffer = new Buffer(data, 'base64');

    let imgFileName = resolve(zipFolder, `${z}_${x}_${y}.png`);
    let srcFileName = resolve(resourceFolder, `${z}_${x}_${y}.png`);
    fs.writeFileSync(imgFileName, dataBuffer, function(err){
        if(err){
            console.error(err);
        }
    });

    fs.writeFileSync(srcFileName, dataBuffer, function(err){
        if(err){
            console.error(err);
        }
    });
    ctx.body = '1';
};

/**
 * 开启下载，后端获取到总共需要下载的tile图片数量以及tileUrl模板
 * @param ctx
 * @returns {Promise.<void>}
 */
let startLoad = async (ctx) => {
    let totalImgNum = ctx.query.downloadNum || 0;
    let urlTemplate = ctx.query.urlTemplate;
    let blockTime = 0;
    let imgNum = 0;
    let timer = null;
    let currTime = moment().format('YYYY-MM-DD-HH-mm-ss');

    zipFolder = resolve(imgFolder, currTime);
    fs.mkdirSync(zipFolder);
    imgNum = getFilesCount(zipFolder);

    resourceFolderName = urlTemplate.match(/(\/\/.*?(\/\{))/g)[0].replace(/[\/\.]/g, '');
    resourceFolder = resolve(imgFolder, 'resource', resourceFolderName);
    if(!fs.existsSync(resourceFolder)) {
        fs.mkdirSync(resourceFolder);
    }

    timer = setInterval(() => {
        let tmp = getFilesCount(zipFolder);
        if(imgNum == tmp){
            if(
                tmp===Number(totalImgNum) ||
                blockTime++ > 10 * 60
            ){
                generateZip(zipFolder, resolve(imgFolder, `${currTime}.zip`));
                ws.send(`http://${localIP}:3000/img/${currTime}.zip`);
                clearInterval(timer);
            }
        } else {
            blockTime = 0;
            imgNum = tmp;
            ws.send(imgNum);
        }
    }, 1000);
    ctx.body = '0';
};

/**
 * Return the requested tile's url to the frontend,
 * If the tile's image has been loaded, return a localhost url
 * If not, return the origin url
 * @param ctx
 * @returns {Promise.<void>}
 */
let getTileUrl = async (ctx) => {
    let url = ctx.query.url;
    let x   = ctx.query.x;
    let y   = ctx.query.y;
    let z   = ctx.query.z;

    let imgFileName = resolve(zipFolder, `${z}_${x}_${y}.png`);
    let srcFileName = resolve(resourceFolder, `${z}_${x}_${y}.png`);
    //如果前端请求的tile图片已经在本地离线，则直接从resource中拷贝到目标文件夹
    if(fs.existsSync(srcFileName)){
        let data = fs.readFileSync(srcFileName);
        fs.writeFileSync(imgFileName, data);
        ctx.body = {
            isCached: '1',
            url: `http://${localIP}:3000/img/resource/${resourceFolderName}/${z}_${x}_${y}.png`
        };
    }else{
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