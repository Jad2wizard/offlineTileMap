/**
 * Created by Jad on 2017/8/24.
 */

async function getUrl({x, y, z, orgUrl}) {
    const res = await fetch(
        `/api/checkTileUrl?url=${orgUrl}&x=${x}&y=${y}&z=${z}`
    )
        .then(data => data.json());
    if (res.isCached != '1')
        sendImgBase64({x, y, z, url: res.url});
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
        };
        img.src = url;
    });
}

export {getUrl};
