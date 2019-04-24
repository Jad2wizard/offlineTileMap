/**
 * Created by Jad on 2017/7/27.
 */

/**
 * 通过经纬度和缩放度计算GoogleTile坐标系下的tile的xyz编号
 * @param lon_deg
 * @param lat_deg
 * @param zoom
 */
let computeTileXYZ = (lon_deg, lat_deg, zoom, isReverseY = false) => {
    const lon = Number(lon_deg);
    const lat = Number(lat_deg);
    const z = Number(zoom);
    let n = Math.pow(2, z);
    let lat_rad = lat * Math.PI / 180;
    let x = (lon + 180) / 360 * n;
    let y = (isReverseY)
        ? (1.0 + (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad))) / Math.PI) * n / 2
        : (1.0 - (Math.log(Math.tan(lat_rad) + 1/Math.cos(lat_rad))) / Math.PI) * n / 2;
    return {
        x: Math.floor(x),
        y: Math.floor(y)
    }
};

export default computeTileXYZ;

console.log(computeTileXYZ(180, 0, 0));