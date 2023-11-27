class CustomError{
    constructor(error, status = 500, auto = false, text = (auto) ? error.message : 'Something went wrong') {
        this.error = error;
        this.status = status;
        this.text = text;
    }
}

module.exports = CustomError;