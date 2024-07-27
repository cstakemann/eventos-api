export class ResponseDto<T> {
    status: number;
    message: string;
    data: T;
    isSucceeded: boolean;
  
    constructor(status: number, message: string, data: T, isSucceeded: boolean) {
      this.status = status;
      this.message = message;
      this.data = data;
      this.isSucceeded = isSucceeded;
    }
  }
  