import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'mobx-react';
import Home from './Home';
import dataStore from './store/dataStore.js';

//允许接受后端热更请求
if (module.hot) {
    module.hot.accept();
}

class Root extends React.Component{
    render(){
        return (
            <Provider
                dataStore={dataStore}
            >
                <Home/>
            </Provider>
        )
    }
}
ReactDOM.render((<Root/>), document.getElementById('main'));
