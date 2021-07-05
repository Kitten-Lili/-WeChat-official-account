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
    // 将对象转换json字符串
    accessToken = JSON.stringify(accessToken)
    // 将access_token保存一个文件
    return new Promise((reslove, reject) => {
      writeFile('./accessToken.txt', accessToken, err => {
        if (!err) {
          console.log('文件保存成功');
          reslove();
        } else {
          reject(err);
        }
      })
    })
  }

  /**
   * 用来读取access_token
   */
  readAccessToken() {
    // 读取本地文件中的accessToken
    return new Promise((reslove, reject) => {
      readFile('./accessToken.txt', (err, data) => {
        if (!err) {
          console.log('文件读取成功');
          // 将json字符串转换为js对象
          data = JSON.parse(data);
          reslove(data);
        } else {
          reject(err)
        }
      })
    })
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
    if(this.access_token && this.expires_in && this.isValidAccessToken(this)){
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
}

const w = new Wechat();
new Promise((resolve, reject) => {
  w.readAccessToken().then(res => {
    // 本地有文件
    // 判断它是否过期
    if (w.isValidAccessToken(res)) {
      // 有效的
      resolve(res);
    } else {
      // 过期了
      // 请求凭据,并保存
      w.getAccessToken().then(res => {
        // 保存凭据
        w.saveAccessToken(res).then(() => {
          resolve(res);
        })
      })
    }
  }).catch(err => {
    // 本地没有文件
    // 请求凭据,并保存
    w.getAccessToken().then(res => {
      // 保存凭据
      w.saveAccessToken(res).then(() => {
        resolve(res);
      })
    })
  })
}).then(res => {
  console.log(res);
})