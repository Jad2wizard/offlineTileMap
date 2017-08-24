/**
 * Created by Jad on 2017/7/26.
 */
const routers = require('koa-router')();
const apiRouters = require('koa-router')();
let {getTileUrl, postTileImg, startLoad} = require('./../controllers/api');
const nunjucks = require('nunjucks');

function createEnv(path, opts) {
    var
        autoescape = opts.autoescape && true,
        noCache = opts.noCache || false,
        watch = opts.watch || false,
        throwOnUndefined = opts.throwOnUndefined || false,
        env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader('templates', {
                noCache: noCache,
                watch: watch,
            }), {
                autoescape: autoescape,
                throwOnUndefined: throwOnUndefined
            });
    if (opts.filters) {
        for (var f in opts.filters) {
            env.addFilter(f, opts.filters[f]);
        }
    }
    return env;
}

var env = createEnv('templates', {
    watch: true,
    filters: {
        hex: function (n) {
            return '0x' + n.toString(16);
        }
    }
});

apiRouters
    .get('/checkTileUrl', getTileUrl)
    .get('/startLoad', startLoad)
    .post('/mapTile', postTileImg);

routers.use('/api', apiRouters.routes(), apiRouters.allowedMethods())
routers.get('/', async (ctx) => {
    ctx.response.body = env.render('index.html');
});

module.exports = routers;