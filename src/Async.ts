/**
 * @author [qianzhixiang]
 * @email [zxqian199@163.com]
 * @create date 2021-04-24 09:04:40
 * @modify date 2021-04-24 09:04:40
 * @desc [异步相关的处理]
 */

export class XPromise {
  private promise?: Promise<any>;
  resolve?: (v?: any) => void;

  reject?: (v?: any) => void;

  constructor() {
    this.init();
  }

  private init() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (p: any) => {
        resolve(p);
        return p;
      };
      this.reject = reject;
    });
  }
  // 外界调用表示结束

  async wait() {
    return this.promise;
  }
}

/**
 * Debounce逻辑控制
 * Debounce是一个调用过来后，并不立即执行，而是要等待一段时间，这段时间内要是没有新的调用 则执行 若是有 则重新开始计时知道没有新的请求
 */
export class Debounce {
  private _timeSchedule: any | null = null;

  private _async = new XPromise();

  wait() {
    return this._async.wait();
  }

  constructor(private timeout = 50) {}

  async execute(func: () => any) {
    // 清空计时
    clearTimeout(this._timeSchedule as any);
    // 重新计时
    this._timeSchedule = setTimeout(async () => {
      // 到这里表示已经在触发处理函数了
      const promise = func();
      // 当处理结束的时候 重新设置promise 开始新的周期
      this._async.wait().then(() => (this._async = new XPromise()));
      if (promise && promise.catch) {
        promise.catch((e: Error) => this._async.reject?.(e));
      }
      this._async.resolve?.(await promise);
    }, this.timeout);

    return this._async.wait();
  }
}
