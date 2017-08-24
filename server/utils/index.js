/**
 * Created by Jad on 2017/7/28.
 */
const fs = require('fs');
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
module.exports = {
    generateZip,
    getFilesCount
};
