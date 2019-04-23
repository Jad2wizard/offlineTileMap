/**
 * Created by Jad on 2017/8/24.
 */
import React from 'react';
import {inject,observer} from 'mobx-react';
import Info from './../component/Info.jsx';
import Map from './../component/Map.js';
import styles from './index.less';

@inject('dataStore')
@observer
export default class extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        const {dataStore} = this.props;
        return (
            <div className={styles.container}>
                <div className={styles.left}>
                    <Info/>
                </div>
                <div className={styles.right}>
                    <Map
                        tileUrlTemplate={dataStore.tileUrlTemplate}
                    />
                </div>
            </div>
        )
    }
}