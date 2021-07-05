// 引入Theaters
const Theaters = require('../../model/Theaters');
module.exports = async data => {
  console.log('执行save模块');
  for (var i = 0; i < data.length; i++) {
    let item = data[i]

    // mongoose 里面的方法都默认是Promise对象
    const result = await Theaters.create({
      title: item.title,
      rating: item.rating,
      runtime: item.runtime,
      directors: item.directors,
      casts: item.casts,
      image: item.image,
      doubanId: item.doubanId,
      genre: item.genre,
      summary: item.summary,
      releaseDate: item.releaseDate
    })
    console.log('数据保存成功');
    console.log(result);
  }
}