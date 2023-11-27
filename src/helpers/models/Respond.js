class Respond{
    constructor(success,statusCode,data,message){
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}

module.exports = Respond;