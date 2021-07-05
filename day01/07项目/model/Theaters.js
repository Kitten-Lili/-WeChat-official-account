// 引入mongoose
const mongoose = require('mongoose')
// 获取Schema
const Schema = mongoose.Schema
// 创建约束对象
const theaterSchema = new Schema({
  title: String,
  rating: Number,
  runtime: String,
  directors: String,
  casts: String,
  image: String,
  doubanId: {
    type: Number,
    unique: true
  },
  genre: [String],
  summary: String,
  releaseDate: String,
  posterKey: String, // 图片上传到七牛中,返回key值
  createTime: {
    type: Date,
    default: Date.now()
  }
})

// 创建模型对象
const Theaters = mongoose.model('Theaters',theaterSchema)
console.log(Theaters);
// 暴露出去
module.exports = Theaters