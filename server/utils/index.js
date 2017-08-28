/**
 * Created by Jad on 2017/7/28.
 */
const fs = require('fs');
const os = require('os');
const zipper = require('zip-local');
const resolve = require('path').resolve;

/**
 * 获取目录中所有文件及其所有子目录中的文件数量
 * @param path
 * @returns {number}
 */
let getFilesCount = (path) => {
    let res = 0;
    if(fs.existsSync(path)){
        let files = fs.readdirSync(path);
        for(let f of files){
            if(fs.statSync(resolve(path, f)).isFile()){
                res += 1;
            } else {
                res += getFilesCount(resolve(path, f));
            }
        }
    }
    return  res;
};

let generateZip = (path, zipFilename) => {
    if(!fs.existsSync(path)){
        return;
    }
    zipper.sync.zip(path).compress().save(zipFilename);
};

/**
 * 获取本地IPv4地址，若没有连接网络则返回127.0.0.1
 * @returns {string}
 */
let getLocalIP = () => {
    try {
        let platform = os.platform();
        let networkInterface = os.networkInterfaces();
        if (platform.startsWith('win')) {
            return networkInterface['本地连接'][1].address;
        }
        if (platform.startsWith('lin')) {
            return networkInterface.eth0[0].address;
        }
        return '127.0.0.1';
    } catch(e) {
        return '127.0.0.1';
    }
};

module.exports = {
    generateZip,
    getLocalIP,
    getFilesCount
};
