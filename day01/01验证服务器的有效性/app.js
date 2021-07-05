// 引入express模块
const express = require('express')
// 引入sha1模块
const sha1 = require('sha1')
// 创建app应用对象
const app = express()
// 验证服务器的有效性
/**
 * 1.微信服务器知道开发者服务器是哪个
 *  测试号管理页面上填写url开发者服务器地址
 *    使用ngrok内网穿透,将本地端口号开启的服务映射外网跨域访问一个网址
 *    ngrok http 3000
 *  填写token
 *    参与微信名加密的一个参数
 * 2.开发者服务器 - 验证消息是否来自于微信服务器
 *  目的: 计算得出signature微信加密签名,和微信传递过来的signature进行对比,如果一样,说明消息来源于微信服务器,
 *  做法:
 *    1.将参与微信加密签名的三个参数(timestamp,nonce,token)按照字典排序并组合在一起形成一个新数组
 *    2.加数组里所有参数拼接成一个字符串,进行sha1加密
 *    3.加密完成就生成一个signatrue,和微信发送的signatrue进行对比
 *     3.1.如果一样,就说明消息来自于微信服务器,返回echostr给微信服务器
 *     3.2.如果不一样,说明不是微信服务器发送过来的消息,返回error
 */

// 配置对象
const config = {
  token: 'jlc5201314',
  appID: 'wxeb33a37fc55b2891',
  appsecret: '7c7d4cfd58d880cddffdc991733163b2'
}

app.use((req,res,next)=>{
  console.log(req.query);
  // {
  //   signature: '410aca96ed3d2008ab235ea9b429aa307dca84cf', // 微信的嘉明签名
  //   echostr: '3316635900447816895', // 微信的随机字符串
  //   timestamp: '1618735157', // 微信的发送请求时间戳
  //   nonce: '807649707' // 微信的随机数字
  // }  

  const {signature,echostr,timestamp,nonce} = req.query
  const {token} = config

  // 1.将参与微信加密签名的三个参数(timestamp,nonce,token)按照字典排序并组合在一起形成一个新数组
  const arr = [timestamp,nonce,token]
  const arrSort = arr.sort()
  // 2.加数组里所有参数拼接成一个字符串,进行sha1加密
  const str = arr.join('')
  const sha1Str = sha1(str)
  // 3.加密完成就生成一个signatrue,和微信发送的signatrue进行对比
  if(sha1Str === signature){
  // 3.1.如果一样,就说明消息来自于微信服务器,返回echostr给微信服务器
    res.send(echostr)
  }else{
  // 3.2.如果不一样,说明不是微信服务器发送过来的消息,返回error
    res.end('error')
  }
})
// 监听端口
app.listen(5000,()=>console.log('服务器启动成功'))
