// 引入express模块
const express = require('express')
// 引入路由器模块
const router = require('./router')
// 创建app应用对象
const app = express()
// 配置模板资源目录
app.set('views','./views')
// 模板引擎
app.set('view engine','ejs')

app.use(router)

// 监听端口
app.listen(5000,()=>console.log('服务器启动成功'))
