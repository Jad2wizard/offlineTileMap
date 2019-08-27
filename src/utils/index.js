/**
 * Created by Jad on 2017/8/24.
 */

const MAX_FETCH_NUM = 10
const waitArray = [];
let fetchingCount = 0;

const timeout = (time = 10) => new Promise(resolve => {
    setTimeout(() => resolve({timeout: true}), time * 1000);
});

async function getUrl({x, y, z, orgUrl}) {
    const res = await fetch(
        `/api/checkTileUrl?url=${orgUrl}&x=${x}&y=${y}&z=${z}`
    )
        .then(data => data.json());
    if (res.isCached != '1')
        waitArray.push({x, y, z, url: res.url});
}

function sendImgBase64({x, y, z, url}){
    return new Promise((resolve) => {
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
            Promise.race([
                timeout(10),
                fetch('/api/mapTile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        x,
                        y,
                        z,
                        data
                    })
                })
            ]).then((res) => {
                console.log(url);
                if(res.timeout)
                    console.log('timeout !!!!')
                resolve();
            }).finally(() => {
                fetchingCount--
            })
        };

        img.onerror = e => {
            console.warn(e)
            fetchingCount--
        }
        img.src = url;
    });
}

(async function(){
    while (true) {
        if(waitArray.length === 0)
            await timeout(10)
        else if(fetchingCount <= MAX_FETCH_NUM){
            sendImgBase64(waitArray.shift());
            fetchingCount++
        } else {
            await timeout(1)
        }
    }
})()

export {getUrl};
