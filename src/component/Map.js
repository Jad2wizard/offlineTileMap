/**
 * Created by yaojia7 on 2017/8/24.
 */
import React from 'react';
import {inject} from 'mobx-react';
import {autorunAsync, observable} from 'mobx';
import styles from './Map.less';

Cesium = window.Cesium;

@inject('dataStore')
export default class extends React.Component{
    constructor(props){
        super(props);
        /**
         *第一个tile图片截取点，根据两个点的位置取地球上最小面积的矩形区域作为需要下载的tile图片范围
         * 由dataStore(lon1, lat1)生成该点位置
         * @type Entity
             */
        this.firstPoint = null;
        /**
         *第二个tile图片截取点
         * 由dataStore(lon2, lat2)生成该点位置
         * @type Entity
         */
        this.secondPoint = null;
        this.dataStore = this.props.dataStore;
        this.viewer = null;
        //调整摄像机对准东半球
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
            20,
            85,
            180,
            -35
        );

        //展示鼠标所在位置的经纬度信息
        this.overlay = document.createElement('div');

        //由 firstPoint和secondPoint画出的矩形区域实体
        this.rectangle = null;

        //监听矩形区域位置发生变化后自动重绘矩形区域
        autorunAsync(() => {
            if(
                !this.dataStore.isFirstPointNull &&
                !this.dataStore.isSecondPointNull &&
                this.dataStore.coordValidate
            ) {
                let pointA = new Cesium.Cartesian3.fromDegrees(this.dataStore.lon1, this.dataStore.lat1);
                let pointB = new Cesium.Cartesian3.fromDegrees(this.dataStore.lon2, this.dataStore.lat2);
                this.drawRect(pointA, pointB);
            } else {
                this.removeRect();
            }
        })

        /**
         * 检测到矩形经纬度发生变化后更改点的位置
         */
        autorunAsync(() => {
            this.modifyPointPosition('1', this.dataStore.lon1, this.dataStore.lat1);
            this.modifyPointPosition('2', this.dataStore.lon2, this.dataStore.lat2);
        })
    }

    componentDidMount(){
        this.initViewer();
    }

    componentDidUpdate(){
        //props有更新时，先删除以前的viewer
        this.viewer.destroy();
        this.viewer = null;
        this.initViewer();
    }

    initViewer = () => {
        if(!this.viewer){
            this.viewer = new Cesium.Viewer('container', {
                terrainProviderViewModels: [], //取消地形切换
                baseLayerPicker: false, //取消默认的图层切换，使用默认图层和用户提供的url图层
                infoBox: false,
                selectionIndicator: false,
                navigationHelpButton: false,
                geocoder: false,
                sceneModelPicker: false,
                //默认图层
                imageryProvider: new Cesium.UrlTemplateImageryProvider({
                    url: this.props.tileUrlTemplate,
                    style: 'defalut',
                    format: 'image/png',
                    tileMatrixSetID: 'GoogleMapsCompatible',
                    show: true
                })
            });

            window.viewer = this.viewer;

            this.firstPoint = this.drawPoint(new Cesium.Cartesian3.fromDegrees(this.dataStore.lon1, this.dataStore.lat1));
            this.secondPoint = this.drawPoint(new Cesium.Cartesian3.fromDegrees(this.dataStore.lon2, this.dataStore.lat2));

            //添加overlay到viewer中，并设置overlay样式
            this.viewer.container.appendChild(this.overlay);
            let overlay = this.overlay;
            overlay.className = styles.backdrop;
            overlay.style.display = 'none';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.padding = '4px';
            overlay.style.color = 'white';
            overlay.style.backgroundColor = 'black';

            //删除鼠标左键双击事件
            this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            let scene = this.viewer.scene;
            //将默认的zoom事件触发方式改为鼠标滚轮
            scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL];
            //将默认的倾斜地图事件触发方式改为鼠标右键
            scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.RIGHT_DRAG];

            //设置鼠标悬浮事件，显示当前鼠标处的经纬度信息
            let viewer = this.viewer
            viewer.screenSpaceEventHandler.setInputAction(function (movement) { //movement: 事件参数，取值由事件类型决定
                let cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid); //将鼠标的屏幕位置转换为球面笛卡尔坐标系
                if (cartesian) {
                    let cartographic = Cesium.Cartographic.fromCartesian(cartesian); //笛卡尔坐标转换为经纬度
                    let lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4);
                    let lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4);
                    overlay.style.display = 'block';
                    overlay.style.top = `${movement.endPosition.y - 30}px`;
                    overlay.style.left = `${movement.endPosition.x + 15}px`;
                    overlay.textContent = `${lon} ${lat}`;
                } else {
                    overlay.style.display = 'none';
                }
            }.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            //设置鼠标点击事件，点击某点选取或取消tile图片截取点。地图上最多存在两个截取点，点击第三个截取点后第一个截取点删除
            viewer.screenSpaceEventHandler.setInputAction(function (movement) {
                let pick = scene.pick(movement.position);
                let clickPosition = viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
                //判断点击处是否有实体存在，若存在实体，且实体为两个截取点之一，则删除该点
                if (Cesium.defined(pick)) {
                    let clickedEntity = pick.id;
                    if(
                        //说明点击了区域Entity，此时删除两个点和区域
                        !clickedEntity.position ||
                        this.isPointOverlap(clickedEntity, this.firstPoint)
                        && this.isPointOverlap(clickedEntity, this.secondPoint)
                    ) {
                        //如果鼠标点击点事两个点的重合点，则将两个点位置都置零，地图上显示效果为删除两个点
                        this.dataStore.modifyLonLat('1', 0, 0);
                        this.dataStore.modifyLonLat('2', 0, 0);
                    } else if (this.isPointOverlap(clickedEntity, this.firstPoint)) {
                        //点击第一个点，则将第一个点移到第二个点处，地图上显示效果为删除第一个点
                        this.dataStore.modifyLonLat('1', this.dataStore.lon2, this.dataStore.lat2);
                    } else if (this.isPointOverlap(clickedEntity, this.secondPoint)) {
                        //点击第二个点，则将第二个点移到第一个点出，地图上显示效果为删除第二个点
                        this.dataStore.modifyLonLat('2', this.dataStore.lon1, this.dataStore.lat1);
                    }
                } else if(
                    this.dataStore.isFirstPointNull ||
                    this.dataStore.isSecondPointNull ){
                    //点击地图空白处，则根据点击点改变连个点位置
                    this.changePointsPosition(clickPosition);
                }
            }.bind(this), Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    }

    /**
     * 判断两个点是否重合
     * @param en1
     * @param en2
     */
    isPointOverlap = (en1, en2) => {
        return en1.position._value.equals(en2.position._value);
    }

    /**
     * 移动第一个点到第二个点位置，移动第二点到clickPosition处
     * @param clickPosition | Cartesian3
     */
    changePointsPosition = (clickPosition) => {
        clickPosition = new Cesium.Cartographic.fromCartesian(clickPosition);
        let lon = Cesium.Math.toDegrees(clickPosition.longitude);
        let lat = Cesium.Math.toDegrees(clickPosition.latitude);
        if(this.dataStore.isFirstPointNull){
            this.dataStore.modifyLonLat('1', lon, lat);
        } else if(this.dataStore.isSecondPointNull || this.dataStore.isTwoPointOverap){
            this.dataStore.modifyLonLat('2', lon, lat);
        } else {
            this.dataStore.modifyLonLat('1', this.dataStore.lon2, this.dataStore.lat2);
            this.dataStore.modifyLonLat('2', lon, lat);
        }
    }

    /**
     * 根据给定的位置绘制一个点
     * @param position | Cartesian3
     */
    drawPoint = (position) => {
        let entity = this.viewer.entities.add({ //插入实体
            position: position,
            point: {
                pixelSize: 8,
                color: Cesium.Color.RED
            },
        });
        return entity;
    };

    /**
     * 根据两个实体的位置画出一个矩形区域
     * @param pointA | Cartesian3
     * @param pointB | Cartesian3
     */
    drawRect = (pointA, pointB) => {
        pointA = new Cesium.Cartographic.fromCartesian(pointA); //将笛卡尔坐标转换为经纬度
        pointB = new Cesium.Cartographic.fromCartesian(pointB);
        let west = Math.min(pointA.longitude, pointB.longitude);
        let east = Math.max(pointA.longitude, pointB.longitude);
        let south = Math.min(pointA.latitude, pointB.latitude);
        let north = Math.max(pointA.latitude, pointB.latitude);
        //如果矩形区域已经存在，则从viewer的实体中删除矩形实体
        this.removeRect();

        this.rectangle = this.viewer.entities.add({
            rectangle: {
                coordinates: Cesium.Rectangle.fromRadians(west, south, east, north),
                material: Cesium.Color.fromAlpha(Cesium.Color.RED, 0.5),
                outline: true,
                outlineColor: Cesium.Color.RED
            }
        })
    };

    removeRect = () => {
        if(this.rectangle)
            this.viewer.entities.remove(this.rectangle);
    }

    /**
     * 设置第一个点或者第二个点的位置
     * @param flag | '1' '2'
     * @param lon | Number
     * @param lat | Number
     */
    modifyPointPosition = (flag, lon, lat) => {
        let entity = null;
        if(flag === '1'){
            entity = this.firstPoint;
        } else if (flag === '2'){
            entity = this.secondPoint;
        }
        if(entity){
            entity.position = new Cesium.Cartesian3.fromDegrees(lon, lat, 0);
        }
    }

    render(){
        return (
            <div className={styles.container} id="container"></div>
        )
    }
}
