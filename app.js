/**
 * Created by yaojia7 on 2017/7/26.
 */
if(!process.env.NODE_ENV){
    process.env.NODE_ENV = true;
}

const Koa = require('koa');
const path = require('path');
const fs = require('fs');
const ws = require(path.resolve(__dirname, './server/models/webSock'));
const koaStatic = require('koa-static');
const bodyParser = require('koa-bodyparser');
const routers = require(path.resolve(__dirname, './server/routers/index'));
const app = new Koa();

if(!fs.existsSync(path.resolve(__dirname, 'public', 'img'))){
    fs.mkdirSync(path.resolve(__dirname, 'public', 'img'));
}
// 配置热加载
if(JSON.parse(process.env.NODE_ENV)) {
    const webpackHotMiddleware = require('koa-webpack-hot-middleware');
    const webpackDevMiddleware = require('koa-webpack-dev-middleware');
    const webpack = require('webpack');
    const webpackConfig = require(path.resolve(__dirname, './webpack.config'));
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler, {
        noInfo: false,
        quiet: false,
        publicPath: webpackConfig.output.publicPath
    }));
    app.use(webpackHotMiddleware(compiler, {}));
}

app.use(bodyParser({
    formLimit: '5000kb'
}));
app.use(koaStatic(
    path.join(__dirname , './public')
));

app.use(routers.routes()).use(routers.allowedMethods());

process.on('uncaughtException', (err) => {
    console.log(err);
})

// app.use(async (ctx) => {
//     ctx.response.body = env.render('index.html');
// });

let server = app.listen(3000);
ws.createWS(server);

console.log('Listening...');