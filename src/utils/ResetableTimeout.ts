export default class ResetableTimeout {
  private timeout: any;
  // tslint:disable-next-line
  private _reject: Function;
  constructor() {
    this.timeout = null;
    // tslint:disable-next-line
    this._reject = () => {};
  }
  public reset(ms: number) {
    this.cancel();
    return new Promise((resolve, reject) => {
      this._reject = reject;
      this.timeout = setTimeout(resolve, ms);
    });
  }
  public cancel() {
    clearTimeout(this.timeout);
    this._reject();
  }
}
