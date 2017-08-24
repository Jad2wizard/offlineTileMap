/**
 * Created by yaojia7 on 2017/7/28.
 */
const fs = require('fs');
// const archiver = require('archiver');
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
    // const arch = archiver('zip');
    // let output = fs.createWriteStream(resolve(path, 'test.zip'))
    // arch.pipe(output);
    // let files = [];
    // let fetchFilePath = (currPath) => {
    //     if(fs.statSync(currPath).isFile()){
    //         files.push(currPath);
    //     } else {
    //         for(let f of fs.readdirSync(currPath)){
    //             fetchFilePath(resolve(currPath, f));
    //         }
    //     }
    // };
    // fetchFilePath(path);
    // for(let f of files){
    //     let filename = f.split(splitStr);
    //     filename = filename[filename.length - 1];
    //     if(filename !== 'test.zip') {
    //         arch.append(fs.createReadStream(f), {name: filename});
    //     }
    // }
    // arch.finalize();
};
module.exports = {
    generateZip,
    getFilesCount
};
