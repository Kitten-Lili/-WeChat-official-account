
// 引入sha1模块
const sha1 = require('sha1');
// 引入config
const config = require('../config');
// 引入tool模块
const { getUserDataAsync, parseXMLAsync, formatMessage } = require('../utils/tool');
// 引入template模块
const template = require('./template');
// 引入reply模块
const reply = require('./reply');


module.exports = () => {
  console.log('调用了reply方法');
  return async (req, res, next) => {
    console.log('进入reply promise函数');

    const { signature, echostr, timestamp, nonce } = req.query
    const { token } = config

    // 1.将参与微信加密签名的三个参数(timestamp,nonce,token)按照字典排序并组合在一起形成一个新数组
    const arr = [timestamp, nonce, token]
    const arrSort = arr.sort()
    // 2.将数组里所有参数拼接成一个字符串,进行sha1加密
    const str = arrSort.join('')
    const sha1Str = sha1(str)
    console.log(sha1Str);

    /**
     * 微信服务器会发送两种类型的消息给开发者服务器
     * 1.GET请求
     *   - 验证服务器的有效性
     * 2.POST请求
     *   -微信服务器会将用户发送的数据以POST请求的方式转发到开发者服务器
     */
    if (req.method === 'GET') {
      // 3.加密完成就生成一个signatrue,和微信发送的signatrue进行对比
      if (sha1Str === signature) {
        // 3.1.如果一样,就说明消息来自于微信服务器,返回echostr给微信服务器
        res.send(echostr)
      } else {
        // 3.2.如果不一样,说明不是微信服务器发送过来的消息,返回error
        console.log('验证微信签名有效性错误');
        res.end('error')
      }
    } else if (req.method === 'POST') {
      console.log('进入index post方法');
      // 微信服务器会将用户发送的数据以POST请求的方式转发到开发者服务器
      // 验证消息来自于微信服务器
      if (sha1Str !== signature) {
        // 不是微信服务器
        res.end('error')
      }
      // console.log(req.query);
      /**
      *  {
      *    signature: '0a783d3f737d4afb00e3b09061ca77915541237c', 
      *    timestamp: '1618801547',
      *    nonce: '1937555583', 
      *    openid: 'oRhq86kWjEZrSBDOmrQgSvHcdWuM'  // 用户的微信ID
      *  }
      */
      // 接收请求体中的数据,流式数据
      const xmlData = await getUserDataAsync(req);
      // console.log(xmlData);
      // <xml>
      //   <ToUserName><![CDATA[gh_fabb72a50749]]></ToUserName> // 开发者ID/接收方ID
      //   <FromUserName><![CDATA[oRhq86kWjEZrSBDOmrQgSvHcdWuM]]></FromUserName> // 用户的openid/发送方ID
      //   <CreateTime>1618813775</CreateTime> // 发送的时间戳
      //   <MsgType><![CDATA[text]]></MsgType> // 发送的消息类型
      //   <Content><![CDATA[刘银森是傻逼]]></Content> // 消息内容
      //   <MsgId>23175838017456900</MsgId> // 消息内容 微信服务器会默认保存3天用户发送的数据,通过此id三天内就能找到消息数据,三天后就被销毁
      // </xml>

      // 将xml数据解析为js对象
      const jsData = await parseXMLAsync(xmlData)
      // console.log(jsData);
      // {
      //   xml: {
      //     ToUserName: [ 'gh_fabb72a50749' ],
      //     FromUserName: [ 'oRhq86kWjEZrSBDOmrQgSvHcdWuM' ],
      //     CreateTime: [ '1618814746' ],
      //     MsgType: [ 'text' ],
      //     Content: [ '刘银森是傻逼' ],
      //     MsgId: [ '23175854285273200' ]
      //   }
      // }

      // 格式化数据
      const message = formatMessage(jsData)
      // console.log(message);
      // {
      //   ToUserName: 'gh_fabb72a50749',
      //   FromUserName: 'oRhq86kWjEZrSBDOmrQgSvHcdWuM',
      //   CreateTime: '1618816943',
      //   MsgType: 'text',
      //   Content: '刘银森是傻逼',
      //   MsgId: '23175885955237965'
      // }

      /**
       * 简单的自动回复,回复文本内容
       * 一旦遇到以下情况,微信都会在公众号会话中,向用户下发系统提示'该公众号暂时无法提供服务,请稍后再试'
       *    1,开发者在5秒内未回复任何内容
       *    2,开发者回复了异常数据,比如JSON数据,字符串,xml数据中有多余的空格等
       */
      // 因为reply的返回值改为了async函数,此时返回值就变成了promise对象
      // 所以必须用await才能拿到最终的返回值
      const options = await reply(message)

      console.log(options);

      // 最终回复用户的消息
      const replyMessage = template(options);

      console.log(replyMessage);
      // 返回响应给微信服务器
      // res.set('Content-Type','text/xml')
      res.send(replyMessage)

      // 如果开发者服务器没有返回响应给微信服务器,微信服务器会发送三次请求过来  
      // res.end('') // 取消三次请求
    } else {
      res.end('error')
    }
  }
}