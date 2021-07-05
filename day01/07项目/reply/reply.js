/**
 * 处理用户发送的消息类型和内容，决定返回不同内容给用户
 */
// 引入Theaters
const db = require('../db');
const Theaters = require('../model/Theaters')
const { url } = require('../config')

module.exports = async (message) => {
  console.log('进入了reply模块');
  let options = {
    toUserName: message.FromUserName,
    fromUserName: message.ToUserName,
    createTime: Date.now(),
    msgType: 'text'
  }

  let content = '您在说啥，我听不懂？'
  // 判断用户发送的消息是否是文本消息
  if (message.MsgType === 'text') {
    // 判断用户发送的消息内容
    if (message.Content === '1') {
      console.log('进入reply');
      content = '刘银森是傻逼'
    } else if (message.Content === '2') { // 全匹配
      content = '周卫旭是傻逼'
    } else if (message.Content.match('爱')) { // 半匹配
      content = '爱你码'
    } else if (message.Content === '热门') {
      // 回复用户热门消息
      await db;
      const data = await Theaters.find({}, { title: 1, summary: 1, image: 1, doubanId: 1, _id: 0 }); // 需要的东西为1
      // 将内容初始化为空数组
      content = []
      options.msgType = 'news'
      // 通过遍历将数据添加进去
      for (var i = 0; i < data.length; i++) {
        let item = data[i]
        content.push({
          title: item.title,
          description: item.summary,
          picUrl: item.image,
          url: `${url}/detail/${item.doubanId}`
        })
      }
    } else {
      // 搜索用户输入指定电影信息
      // 定义请求地址
    }
  } else if (message.MsgType === 'image') {
    options.msgType = 'image'
    options.mediaId = message.MediaId
    console.log(message.PicUrl);
  } else if (message.MsgType === 'voice') {
    options.msgType = 'voice'
    options.mediaId = message.MediaId
    console.log(message.Recognition)
  } else if (message.MsgType === 'location') {
    content = `纬度：${message.Location_X} 经度：${message.Location_Y} 位置信息：${message.Label}`
  } else if (message.MsgType === 'event') {
    if (message.Event === 'subscribe') {
      // 用户订阅数据
      content = '欢迎您关注公众号~ \n' +
        '回复 首页 能看到电影预告片页面 \n' +
        '回复 热门 能看到最新热门的电影 \n' +
        '回复 文本 能查看指定的电影信息 \n' +
        '回复 语言 能查看指定的电影信息 \n' +
        '也可以点击下面菜单按钮,来了解公众号';
    }
    else if (message.EventKey === 'SCAN') {
      content = '用户扫描了带参数的二维码'
    } else if (message.Event === 'LOCATION') {
      content = `纬度：${message.Location_X} 经度：${message.Location_Y} 位置信息：${message.Label}`
    } else if (message.Event === 'unsubscribe') {
      // 用户取消订阅事件
      console.log('呜呜呜，无情取关，哭/(ㄒoㄒ)/~~');
    } else if (message.Event === 'CLICK') {
      content = '欢迎您关注公众号~ \n' +
        '回复 首页 能看到电影预告片页面 \n' +
        '回复 热门 能看到最新热门的电影 \n' +
        '回复 文本 能查看指定的电影信息 \n' +
        '回复 语言 能查看指定的电影信息 \n' +
        '也可以点击下面菜单按钮,来了解公众号';
    }
  }

  options.content = content

  return options
}