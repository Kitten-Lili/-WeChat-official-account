// 引入mongoose
const mongoose = require('mongoose')
module.exports = new Promise((resolve, reject) => {
  // 因为连接数据库是异步方法,为确保之后使用数据库操作成功,必须使用Promise来确保连接之后再进行操作
  // 连接数据库
  console.log('执行db模块');
  mongoose.connect('mongodb://localhost:27017/atguigu_movie', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }) // useNewUrlParser:使用新的url解析器
  //绑定事件监听
  mongoose.connection.once('open', err => {
    if (!err) {
      console.log('数据库连接成功')
      resolve();
    } else {
      reject('数据库连接失败' + err)
    }
  })
  mongoose.connection.on('error', function (error) {
  console.log('数据库连接失败：' + error);
  });
})