/**
 * 获取access_token:
 *  是什么?获取调用接口全局唯一凭据
 * 
 *  特定:
 *    1.唯一的
 *    2.有效期为2小时,提前5分钟再次发送请求
 *    3.接口权限,每天2000次
 * 
 *  请求地址:
 *    https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
 *  请求方式:
 *    GET
 *  设计思路:
 *    1.首次使用本地没有access,发送请求获取access_token,保存下来(本地文件)
 *    2.第二次或以后:
 *      -- 先去本地读取文件,判断它是否过期
 *        -- 过期了
 *          -- 重新请求获取access_token, 保存下来覆盖之前的文件(保证文件是唯一的)
 *        -- 没有过期
 *          -- 直接使用
 *  整理思路:
 *    读取文件
 *      --本地有文件
 *        --判断是否过期(isValidAccessToken)
  *         --过期了
  *           --重新请求获取access_token(getAccessToken), 保存下来覆盖之前的文件(保证文件是唯一的)(saveAccessToken)
  *         --没有过期
  *           --直接使用
 *      --本地没有文件
 *        --发送亲求获取access_token(getAccessToken),保存下来(本地文件)
 */
const { appID, appsecret } = require('../config')
const rp = require('request-promise-native')
const { writeFile, readFile } = require('fs')
const e = require('express')
const { resolve } = require('path')
const menu = require('./menu')
// 引入工具函数
const {writeFileAsync,readFileAsync} = require('../utils/tool')

// 定义类,获取access_token
class Wechat {
  constructor() { }
  // 用来获取access_token
  getAccessToken() {
    // 定义请求的地址
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`
    // 发送请求
    /** 
     * 安装 
     *  request
     *  request-promise-native // 只需引入这个,返回值是一个promise对象
     * */
    return new Promise((resolve, reject) => {
      rp({ method: 'GET', url, json: true }).then(res => {
        /**
         *  {
              access_token: '44_8TxS8s7cfyQ9xWPbu3_rGXj6IooYO4TslgX_IBABmGxToQFv6UvJu-fevMWNnKXWw075oX7xnrlAby7B_oOq_yVAxuV-NRZQa4u1wPfJM92PMvLpdM8OkxXZZdlfJ3CJ2ch7kUmNsUNSLTDvWNHjAFAKBV', // access_token
              expires_in: 7200 // 有效时间
            }
         */
        // 重写access_token的过期时间
        res.expires_in = Date.now() + (res.expires_in - 300) * 1000; // now是当前时间戳(毫秒),有效时间减去5分钟在1000转为毫秒值
        // 将promise对象状态改为成功的状态
        resolve(res);
      }).catch(err => {
        // 将promise对象状态改为失败的状态
        reject(err)
      })
    })
  }

  /**
   * 用来保存access_token的方法
   * @param {*} accessToken 要保存的微信凭据
   */
  saveAccessToken(accessToken) {
    return writeFileAsync(accessToken,'accessToken.txt')
  }

  /**
   * 用来读取access_token
   */
  readAccessToken() {
    return readFileAsync('accessToken.txt')
  }

  /**
   * 判断当前access_token凭据是否有效
   * @param {*} accessToken // 微信凭据
   */
  isValidAccessToken(data) {
    // 检查传入的参数是否存在
    if (!data && !data.access_token && !data.expires_in) {
      // 代表accessToken无效
      return false;
    }
    // 检查access_token是否在有效期内
    // if(data.expires_in < Date.now()){
    //   // 过期了
    //   return false
    // }else{
    //   // 没过期
    //   return true
    // }

    return data.expires_in > Date.now();
  }

  /**
   * 
   * 获取没有过期的access_token
   * @returns {Promise}
   */
  fetchAccessToken() {
    if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
      // 说明之前保存过access_token,并且是有效的,直接使用
      return Promise.resolve({
        access_token: this.access_token,
        expires_in: this.expires_in
      })
    }
    return this.readAccessToken()
      .then(async res => {
        // 本地有文件
        // 判断它是否过期
        if (this.isValidAccessToken(res)) {
          // 有效的
          // resolve(res);
          return Promise.resolve(res);
        } else {
          // 过期了
          // 请求凭据,并保存
          const res = await this.getAccessToken()
          // 保存凭据
          await this.saveAccessToken(res);
          // resolve(res);
          return Promise.resolve(res);
        }
      })
      .catch(async err => {
        // 本地没有文件
        // 请求凭据,并保存
        const res = await this.getAccessToken()
        // 保存凭据
        await this.saveAccessToken(res);
        // resolve(res);
        return Promise.resolve(res);
      })
      // 因为.then和.catch返回的是promise对象,所以可以继续.then.catch
      .then(res => {
        // 将access_token挂载到this上
        this.access_token = res.access_token
        this.expires_in = res.expires_in
        // readAccessToken()最终的返回值
        return Promise.resolve(res)
      })
  }

  /**
   * 自定义菜单--创建接口
   * @param {*} menu 菜单配置对象
   * @returns 
   */
  creatMenu(menu) {
    return new Promise(async (resolve, eject) => {
      // 获取access_token
      const data = await this.fetchAccessToken()

      // 定义请求地址
      const url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${data.access_token}`

      // 发送请求
      const result = await rp({ method: 'POST', url, json: true, body: menu })
      resolve(result)
    })
  }

  // 自定义菜单--删除接口
  deleteMenu() {
    return new Promise(async (resolve, reject) => {
      const data = await this.fetchAccessToken()
      const url = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${data.access_token}`
      // 发送请求
      const result = await rp({ method: 'GET', url, json: true })
      resolve(result)
    })
  }

  // 用来获取jsapi_ticket
  getTicket() {
    return new Promise(async (resolve, reject) => {
      // 获取access_token
      const data = await this.fetchAccessToken()
      // 定义请求的地址
      const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${data.access_token}&type=jsapi`
      // 发送请求
      rp({ method: 'GET', url, json: true }).then(res => {
        // console.log(res);
        // {
        //   "errcode":0,
        //   "errmsg":"ok",
        //   "ticket":"bxLdikRXVbTPdHSM05e5u5sUoXNKd8-41ZO3MhKoyN5OfkWITDGgnr2fwJ0m9E8NYzWKVZvdVtaUgWvsdshFKA",
        //   "expires_in":7200
        // }
        // 将promise对象状态改为成功的状态
        resolve({ticket: res.ticket, expires_in: Date.now() + (res.expires_in - 300) * 1000});
      }).catch(err => {
        // 将promise对象状态改为失败的状态
        reject(err)
      })
    })
  }

  /**
   * 用来保存ticket的方法
   * @param {*} ticket 要保存的微信凭据
   */
  saveTicket(ticket) {
    return writeFileAsync(ticket,'ticket.txt')
  }

  /**
   * 用来读取ticket
   */
  readTicket() {
    return readFileAsync('ticket.txt')
  }

  /**
   * 判断当前ticket凭据是否有效
   * @param {*} data // 微信凭据
   */
  isValidTicket(data) {
    // 检查传入的参数是否存在
    if (!data && !data.ticket && !data.expires_in) {
      // 代表accessToken无效
      return false;
    }

    return data.expires_in > Date.now();
  }

  /**
   * 
   * 获取没有过期的access_token
   * @returns {Promise}
   */
  fetchTicket() {
    if (this.ticket && this.ticket_expires_in && this.isValidTicket(this)) {
      // 说明之前保存过access_token,并且是有效的,直接使用
      return Promise.resolve({
        ticket: this.ticket,
        expires_in: this.expires_in
      })
    }
    return this.readTicket()
      .then(async res => {
        // 本地有文件
        // 判断它是否过期
        if (this.isValidTicket(res)) {
          // 有效的
          // resolve(res);
          return Promise.resolve(res);
        } else {
          // 过期了
          // 请求凭据,并保存
          const res = await this.getTicket()
          // 保存凭据
          await this.saveTicket(res);
          // resolve(res);
          return Promise.resolve(res);
        }
      })
      .catch(async err => {
        // 本地没有文件
        // 请求凭据,并保存
        const res = await this.getTicket()
        // 保存凭据
        await this.saveTicket(res);
        // resolve(res);
        return Promise.resolve(res);
      })
      // 因为.then和.catch返回的是promise对象,所以可以继续.then.catch
      .then(res => {
        // 将access_token挂载到this上
        this.ticket = res.ticket
        this.ticket_expires_in = res.expires_in
        // readAccessToken()最终的返回值
        return Promise.resolve(res)
      })
  }
}

module.exports = Wechat

// 测试
// (async () => {
//   const w = new Wechat();
//   // 删除之前定义的菜单
//   // let result = await w.deleteMenu()
//   // console.log(result);
//   // // 创建新的菜单
//   // result = await w.creatMenu(menu)
//   // console.log(result);
//   const data = await w.fetchTicket()
// })()
