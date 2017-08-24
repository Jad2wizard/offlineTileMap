/**
 * Created by Jad on 2017/8/24.
 */

let xhr = new XMLHttpRequest();

function getUrl(tileUrl) {
    let tileCached = false;
    xhr.open('GET', `/api/checkTileUrl?url=${tileUrl}`, false);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let res = JSON.parse(xhr.responseText);
            if (res['isCached'] === '1') {
                tileCached = true;
            }
            tileUrl = res.url;
        }
    };
    xhr.send();
    if (!tileCached) {
        sendImgBase64(tileUrl);
    }
}

function sendImgBase64(url){
    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width =img.width;
        canvas.height =img.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var dataURL = canvas.toDataURL("image/png");
        var data = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        xhr.open('POST', '/api/mapTile');
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4 && xhr.status === 200){
                console.log(xhr.responseText);
            }
        };
        xhr.send(`url=${encodeURIComponent(url)}&data=${encodeURIComponent(data)}`);
    };
    img.src = url;
}

export {getUrl};
