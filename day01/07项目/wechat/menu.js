/**
 * 自定义菜单
 */
const {url} = require('../config')
module.exports = {
  "button": [
    {
      "type": "view",
      "name": "硅谷电影",
      "url": `${url}/movie`
    },
    {
      "type": "view",
      "name": "语言识别",
      "url": `${url}/search`
    },
    {
      "name": "戳我",
      "sub_button": [
        {
          "type": "view",
          "name": "官网",
          "url": "http://www.atguigu.com" 
        },
        {
          "type": "click",
          "name": "帮助",
          "key": "help"
        }
      ]
    },
  ]
}