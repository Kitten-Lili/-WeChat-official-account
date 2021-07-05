/**
 * puppeteer chrom开发的爬虫库
 * npm i puppeteer --save-dev
 */
const puppeteer = require('puppeteer');

// 爬取热门电影
const url = 'https://movie.douban.com/cinema/nowplaying/guangzhou/'

module.exports = async () => {
  console.log('执行theaters模块');
  // 1.打开浏览器
  const browser = await puppeteer.launch({
    args: [''],
    headless: false // 以无头浏览器的形式打开浏览器,没有界面显示,在后台运行
  });
  // 2.创建tab标签页
  const page = await browser.newPage();
  // 3.跳转到指定网址
  await page.goto(url, {
    waitUntil: 'networkidle2' // 等待网路空闲时,再跳转加载页面
  });
  // 4.等待网址加载完成,开始爬取数据
  // 开启延时器,掩饰2秒再开始爬取数据
  await timeout()

  const result = await page.evaluate(() => {
    // 对加载好的页面进行dom操作
    const result = []
    // 获取所有热门电影的li
    const $list = $('#nowplaying>.mod-bd>.lists>.list-item')
    // 提取前8条数据
    for (let i = 0; i < 8; i++) {
      const liDom = $list[i];
      // 电影标题
      let title = $(liDom).data('title')
      // 电影评分
      let rating = $(liDom).data('score')
      // 电影片长
      let runtime = $(liDom).data('duration')
      // 导演
      let directors = $(liDom).data('director')
      // 主演
      let casts = $(liDom).data('actors')
      // 豆瓣id
      let doubanId = $(liDom).data('subject')
      // 电影的详情网址
      let href = $(liDom).find('.poster>a').attr('href')
      // 电影的海报图
      let image = $(liDom).find('.poster>a>img').attr('src')

      result.push({
        title,
        rating,
        runtime,
        directors,
        casts,
        doubanId,
        href,
        image
      })
    }
    // 将爬取的数据返回出去
    return result
  })

  // console.log(result);
  // 遍历爬取到的8条数据
  for (let i = 0; i < result.length; i++) {
    // 获取条目信息
    const item = result[i]
    // 更改url为某条数据的详情页
    let url = item.href
    // 跳转到当前遍历的详情页
    await page.goto(url, {
      waitUntil: 'networkidle2' // 等待网路空闲时,再跳转加载页面
    })
    // 爬取当前详情页的其他数据
    var itemResult = await page.evaluate(() => {
      // 获取电影类型数据
      const genre = []
      // 属性选择器[]--找到电影类型数据DOM
      const $genre = $('[property="v:genre"]')
      // 遍历类型数组
      for (let j = 0; j < $genre.length; j++) {
        // 获取类型数据插入自定义类型数组里
        genre.push($genre[j].innerText)
      }

      // 获取简介
      const summary = $('[property="v:summary"]').html().replace(/\s+/g,'');
      // 上映日期
      const releaseDate = $('[property="v:initialReleaseDate"]')[0].innerText

      // 给当前对象插入类型和简介数据
      return {
        genre,
        summary,
        releaseDate
      }
    })
    // 在在最后给当前对象添加两个属性
    // 在evaluate函数中没办法读取到服务器最终的变量
    item.genre = itemResult.genre
    item.summary = itemResult.summary
    item.releaseDate = itemResult.releaseDate
  }
  console.log(result);
  // 5.关闭浏览器
  await browser.close();
  // 返回数据
  return result
}
function timeout() {
  return new Promise(resolve => {
    setTimeout(resolve, 2000)
  })
}