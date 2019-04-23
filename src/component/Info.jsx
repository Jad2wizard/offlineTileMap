/**
 * Created by Jad on 2017/7/27.
 */
import React from 'react';
import {Input, message, Button } from 'antd';
import {inject, observer} from 'mobx-react';

import styles from './Info.less';

@inject('dataStore')
@observer
export default class extends React.Component{
    constructor(props){
        super(props);
        this.dataStore = this.props.dataStore;
        this.state = {
            message: '',
            tileLoadedCount: 0,
        };

        //websocket用于实时更新下载数量
        this.ws = new WebSocket(`ws://${location.host}/`);
        this.ws.onmessage = (msg) => {
            if(Number.isNaN(Number(msg.data))){
                message.success('Download Complete!!');
                setTimeout(() => {
                    this.setState({
                        tileLoadedCount: 0
                    });
                    let a = document.createElement('a');
                    document.body.appendChild(a);
                    a.href = msg.data;
                    a.click();
                }, 1000);
                this.dataStore.loadEnable = true;
            } else {
                this.setState({
                    tileLoadedCount: msg.data
                });
            }
        };

    }

    render(){
        return (
            <div className={styles.container}>
                <div className={styles.item}>
                    <span>tileUrl模板</span>
                    <div className={styles.input}>
                        <Input
                            size='small'
                            value={this.dataStore.tileUrlTemplate}
                            onChange={(evt)=>{
                                    this.dataStore.tileUrlTemplate = evt.target.value;
                            }}
                        />
                    </div>
                </div>
                <div className={styles.item}>
                    <span>经度1</span>
                    <Input
                        size='small'
                        key='lon1'
                        value={this.dataStore.lon1}
                        onChange={
                            this.dataStore.handleChange.bind(
                                this.dataStore,
                                'lon1',
                                [this.dataStore.lonMin, this.dataStore.lonMax]
                            )
                        }
                    />
                </div>
                <div className={styles.item}>
                    <span>经度2</span>
                    <Input
                        size='small'
                        key='lon2'
                        value={this.dataStore.lon2}
                        onChange={
                            this.dataStore.handleChange.bind(
                                this.dataStore,
                                'lon2',
                                [this.dataStore.lonMin, this.dataStore.lonMax]
                            )
                        }
                    />
                </div>
                <div className={styles.item}>
                    <span>纬度1</span>
                    <Input
                           size='small'
                           key='lat1'
                           value={this.dataStore.lat1}
                           onChange={
                               this.dataStore.handleChange.bind(
                                   this.dataStore,
                                   'lat1',
                                   [this.dataStore.latMin, this.dataStore.latMax]
                               )
                           }
                    />
                </div>
                <div className={styles.item}>
                    <span>纬度2</span>
                    <Input
                           size='small'
                           key='lat2'
                           value={this.dataStore.lat2}
                           onChange={
                               this.dataStore.handleChange.bind(
                                   this.dataStore,
                                   'lat2',
                                   [this.dataStore.latMin, this.dataStore.latMax]
                               )
                           }
                    />
                </div>
                <div className={styles.item}>
                    <span>zoom1</span>
                    <Input
                           size='small'
                           key='zoom1'
                           onChange={
                               this.dataStore.handleChange.bind(
                                   this.dataStore,
                                   'zoom1',
                                   [this.dataStore.zoomMin, this.dataStore.zoomMax]
                               )
                           }
                    />
                </div>
                <div className={styles.item}>
                    <span>zoom2</span>
                    <Input
                           size='small'
                           key='zoom2'
                           onChange={
                               this.dataStore.handleChange.bind(
                                   this.dataStore,
                                   'zoom2',
                                   [this.dataStore.zoomMin, this.dataStore.zoomMax]
                               )
                           }
                    />
                </div>
                <div className={styles.item}>
                    <span>Tile总数为</span><span>{this.dataStore.tileCount}</span>
                </div>
                <div className={styles.item}>
                    <span>已下载数量</span><span>{this.state.tileLoadedCount}</span>
                </div>
                <div className={styles.item}>
                    <Button
                        disabled={!this.dataStore.loadEnable}
                        type='primary'
                        onClick={this.dataStore.handleClick}
                    >点击下载</Button>
                </div>
            </div>
        )
    }
}
