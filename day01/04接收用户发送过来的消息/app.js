// 引入express模块
const express = require('express')
// 引入auth模块
const auth = require('./wechat/auth')
// 创建app应用对象
const app = express()
app.use(auth())
// 监听端口
app.listen(5000,()=>console.log('服务器启动成功'))
