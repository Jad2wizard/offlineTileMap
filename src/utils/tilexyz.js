/**
 * Created by Jad on 2017/7/27.
 */

/**
 * 通过经纬度和缩放度计算GoogleTile坐标系下的tile的xyz编号
 * @param lon_deg
 * @param lat_deg
 * @param zoom
 */
let computeTileXYZ = (lon_deg, lat_deg, zoom) => {
    let isReverseY = false;
    if(lon_deg < -180 || lon_deg > 180 || lat_deg > 85.05 || lat_deg < -85.05 || zoom < 0 || zoom >19){
        return null;
    }
    let n = Math.pow(2, zoom);
    let lat_rad = lat_deg * Math.PI / 180;
    let x = (lon_deg + 180) / 360 * n;
    let y = (isReverseY)?(1.0 + (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad))) / Math.PI) * n / 2
        :(1.0 - (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad))) / Math.PI) * n / 2;
    return {
        x: Math.floor(x),
        y: Math.floor(y)
    }
};

export default computeTileXYZ;

console.log(computeTileXYZ(180, 0, 0));