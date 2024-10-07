

class apiError extends Error{
    public statusCode: number;
    public data: any;
    public success: boolean;
    public error: any[];

    constructor(statusCode: number, 
        message: string = "Something went wrong", 
        error: any[] = [], 
        stack: string = ""){

        super(message)
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.error = error;

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export default apiError