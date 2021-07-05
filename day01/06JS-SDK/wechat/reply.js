/**
 * 处理用户发送的消息类型和内容，决定返回不同内容给用户
 */
module.exports = (message) => {
  let options = {
    toUserName: message.FromUserName,
    fromUserName: message.ToUserName,
    createTime: Date.now(),
    msgType: 'text'
  }

  let content = '您在说说明，我听不懂？'
  // 判断用户发送的消息是否是文本消息
  if (message.MsgType === 'text') {
    // 判断用户发送的消息内容
    if (message.Content === '1') {
      content = '刘银森是傻逼'
    } else if (message.Content === '2') { // 全匹配
      content = '周卫旭是傻逼'
    } else if (message.Content.match('爱')) { // 半匹配
      content = '爱你码'
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
    // 用户订阅数据
    content = '欢迎您的关注'
    if (message.EventKey === 'SCAN') {
      content = '用户扫描了带参数的二维码'
    } else if (message.Event === 'LOCATION') {
      content = `纬度：${message.Location_X} 经度：${message.Location_Y} 位置信息：${message.Label}`
    }
  } else if (message.Event === 'unsubscribe') {
    // 用户取消订阅事件
    console.log('呜呜呜，无情取关，哭/(ㄒoㄒ)/~~');
  }

  options.content = content

  return options
}