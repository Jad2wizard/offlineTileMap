/**
 * Created by yaojia7 on 2017/8/24.
 */
import React from 'react';
import {inject} from 'mobx-react';
import {autorunAsync, observable} from 'mobx';
import styles from './Map.scss';

Cesium = window.Cesium;

@inject('dataStore')
export default class extends React.Component{
    /**
     *第一个tile图片截取点，根据两个点的位置取地球上最小面积的矩形区域作为需要下载的tile图片范围
     * @type string
     */
    @observable firstPoint = null;
    /**
     *第二个tile图片截取点
     * @type string
     */
    @observable secondPoint = null;
    constructor(props){
        super(props);
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

        //监听firstPoint或secondPoint变化后自动重绘矩形区域
        autorunAsync(() => {
            //如果地图上已有两个点则根据两个点绘制矩形区域，若无则删除矩形区域
            if(this.firstPoint && this.secondPoint) {
                this.drawRect(this.firstPoint, this.secondPoint);
            } else{
                this.viewer.entities.remove(this.rectangle);
            }
        })

        autorunAsync(() => {
            if(this.firstPoint){
                let position = new Cesium.Cartographic.fromCartesian(this.firstPoint.position._value);
                this.dataStore.lon1 = Cesium.Math.toDegrees(position.longitude); //将经度由Radians(-pi, pi)转为degree(-180, 180)
                this.dataStore.lat1 = Cesium.Math.toDegrees(position.latitude);
            }
            if(this.secondPoint){
                let position = new Cesium.Cartographic.fromCartesian(this.secondPoint.position._value);
                this.dataStore.lon2 = Cesium.Math.toDegrees(position.longitude); //将经度由Radians(-pi, pi)转为degree(-180, 180)
                this.dataStore.lat2 = Cesium.Math.toDegrees(position.latitude);
            }
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
            viewer.screenSpaceEventHandler.setInputAction(function (movement) {
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
                    if(clickedEntity === this.firstPoint){
                        this.viewer.entities.remove(this.firstPoint);
                        this.firstPoint = this.secondPoint;
                        this.secondPoint = null;
                    } else if(clickedEntity === this.secondPoint){
                        this.viewer.entities.remove(this.secondPoint);
                        this.secondPoint = null;
                    } else {
                        this.drawPoint(clickPosition);
                    }
                } else {
                    this.drawPoint(clickPosition);
                }
            }.bind(this), Cesium.ScreenSpaceEventType.LEFT_CLICK);

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

        if(!this.firstPoint){//当前地图零个点，则绘制的点赋值给firstPoint
            this.firstPoint = entity;
        } else if(!this.secondPoint){//当前地图一个点，则绘制的点赋值给secondPoint
            this.secondPoint = entity;
        } else { //当前地图两个点，则删除firstPoint，secondPoint赋值给firstPoint，绘制的点再赋值给secondPoint
            this.viewer.entities.remove(this.firstPoint);
            this.firstPoint = this.secondPoint;
            this.secondPoint = entity;
        }
    };

    /**
     * 根据两个实体的位置画出一个矩形区域
     * @param entityA | entity
     * @param entityB | entity
     */
    drawRect = (entityA, entityB) => {
        let pointA = entityA.position._value;
        let pointB = entityB.position._value;
        pointA = new Cesium.Cartographic.fromCartesian(pointA); //将笛卡尔坐标转换为经纬度
        pointB = new Cesium.Cartographic.fromCartesian(pointB);
        let west = Math.min(pointA.longitude, pointB.longitude);
        let east = Math.max(pointA.longitude, pointB.longitude);
        let south = Math.min(pointA.latitude, pointB.latitude);
        let north = Math.max(pointA.latitude, pointB.latitude);
        //如果矩形区域已经存在，则从viewer的实体中删除矩形实体
        if(this.rectangle){
            this.viewer.entities.remove(this.rectangle);
        }
        this.rectangle = this.viewer.entities.add({
            rectangle: {
                coordinates: Cesium.Rectangle.fromRadians(west, south, east, north),
                material: Cesium.Color.fromAlpha(Cesium.Color.RED, 0.5),
                outline: true,
                outlineColor: Cesium.Color.RED
            }
        })
    };
    render(){
        return (
            <div className={styles.container} id="container"></div>
        )
    }
}
