# offlineTileMap

用途：
用于下载地图Tile图片
为了绕开https认证，offlineTileMap采用前端Canvas加载图片发送给后端服务器存储的方式来下载图片。

使用步骤:
1. 安装node(node7以上)
2. npm install --production
2. npm start
3. 浏览器打开 http://127.0.0.1:3000
4. 在tileUrl模版中输入需要下载的地图tile图片的URL模版，默认为mapbox官网提供的tileUrl模版
5. 在右侧Cesium地图中点击两点确定一个矩形区域后，左侧会给出该矩形区域的经纬度范围，
6. 左侧输入需要下载的tile图片的zoom层级，一般为0到19。之后会计算出需要下载的Tile图片总数
7. 点击下载后，开始下载tile图片，前端实时更新已下载的图片总数
8. 下载完后会讲压缩文件发送到前端。