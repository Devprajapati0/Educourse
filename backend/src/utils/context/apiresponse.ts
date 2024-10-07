class apiResponse{
    public statuscode:number;
    public message:string;
    public data: any;
    public success :boolean;

     constructor(statuscode :number,data : any,message:string="success"){
        this.statuscode = statuscode
        this.data = data
        this.message = message
        this.success = statuscode <400
    }
}

export default apiResponse 