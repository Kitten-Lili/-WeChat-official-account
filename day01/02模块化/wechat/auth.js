
// 引入sha1模块
const sha1 = require('sha1')
// 引入config
const config = require('../config')

module.exports = () => {
  return (req,res,next) => {

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
  }
}