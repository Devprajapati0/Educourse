import { Request, Response, NextFunction } from 'express';
import asynhandler from "../../utils/context/asynchandler";
import apiResponse from "../../utils/context/apiresponse";
import { signupSchema } from "../../utils/schemas/signup.schemas";
import { PrismaClient } from "@prisma/client";
import { roleType } from "@prisma/client";
import { uploadOnCloudinary } from "../../utils/storage/cloudinary";
import brcypt from "bcryptjs"
import jwt, { JwtPayload } from "jsonwebtoken"
import dotenv from "dotenv"
import { loginSchema } from '../../utils/schemas/login.schemas';
import { authentication } from '../../middlewares/auth.middleware';
import { emailSchema, otpSchema } from '../../utils/schemas/otp.schemas';
import { sendForgotPasswordEmail } from '../../utils/helpers/sendemail';
dotenv.config();

const prisma = new PrismaClient();


//signup function
const register = asynhandler(async (req: Request, resp: Response, next: NextFunction) => {
   
    const signupData = signupSchema.safeParse(req.body);
    // console.log("signup.erro",signupData.error)
    
    if (!signupData.success) {
        // Extracting and formatting detailed error messages
        const errorMessages = signupData.error.errors.map(err => {
            return {
                field: err.path.join('.'), 
                message: err.message,       
            };
        });
    
        // Use the correct variable name for the formatted error messages
        const formattedErrorMessages = errorMessages.map(err => `${err.field}: ${err.message}`);
    
        return resp.status(400).json(
            new apiResponse(400, "Validation failed", formattedErrorMessages.join('; '))
        );
    }

    console.log("signupData:",signupData);

    try { 
        const data = signupData.data;

        console.log("data",data.email);

       
        const existedUser = await prisma.user.findFirst({
            where: {
                email: data.email,
                role: data.role as roleType, 
            },
        });

       
        console.log("existedUser:", existedUser);

        if (existedUser) {
            return resp.status(500).json( // Change status to 500 (Conflict) for better semantics
                new apiResponse(500," ", "Email with this role already exists.")
            );
        }


        console.log("req.file ",req.file);



       
        const profilePhoto = req.file ? req.file.path : './public/temp/def.zip';
        const uploaded = await uploadOnCloudinary(profilePhoto);

        console.log("uploaded",uploaded.url);

    
        const hashedPassword = await brcypt.hash(data.password, 10);
        
       
        const user = await prisma.user.create({
            data: {
                email: data.email,
                role: data.role as roleType,
                photo: uploaded.url || "https://www.google.co.in/imgres?q=profile%20pics%20for%20default%20picture%20download&imgurl=https%3A%2F%2Fstatic-00.iconduck.com%2Fassets.00%2Fprofile-default-icon-512x511-v4sw4m29.png&imgrefurl=https%3A%2F%2Ficonduck.com%2Ficons%2F6491%2Fprofile-default&docid=EQ-pSivjYMHyZM&tbnid=XD4DP1phbrNq0M&vet=12ahUKEwiUm-Sc3_yIAxXjR2cHHet9MvcQM3oECBsQAA..i&w=512&h=511&hcb=2&ved=2ahUKEwiUm-Sc3_yIAxXjR2cHHet9MvcQM3oECBsQAA",
                username: data.username,
                password: hashedPassword,
                accesstoken:'',
                refreshtoken:''
            }, 
        });

        console.log("user",user);

        if (!user) {
            return resp.status(409).json( // Change status to 409 (Conflict) for better semantics
                new apiResponse(500," ", "Something went wrong while registering the user.")
            );
        }

        const accessToken = jwt.sign(
            {
                _id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET!,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            }
        );
        
        // Generate refresh token
        const refreshToken = jwt.sign(
            {
                _id: user.id, 
            },
            process.env.REFRESH_TOKEN_SECRET!,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            }
        );

        console.log("accessToken",accessToken)
        console.log("refreshToken",refreshToken)
        
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshtoken: refreshToken,
                accesstoken:accessToken
            },
        });

        console.log("Updated user:", updatedUser);

        const options = {
            httpOnly: true,
            secure : true
         }

    

        
        return resp.status(201)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new apiResponse(200, user,"User registered successfully.")
        );



    } catch (error) {
       
        return resp.status(500).json( // Change status to 500 (Conflict) for better semantics
            new apiResponse(500," ", "Internal server error.")
        );
    }
});


//login fnction

const login = asynhandler(async (req: Request, resp: Response, next: NextFunction)=>{
    const loginData = loginSchema.safeParse(req.body);
    // console.log("signup.erro",loginData.error)
    
    if (!loginData.success) {
        // Extracting and formatting detailed error messages
        const errorMessages = loginData.error.errors.map(err => {
            return {
                field: err.path.join('.'), 
                message: err.message,       
            };
        });
    
        // Use the correct variable name for the formatted error messages
        const formattedErrorMessages = errorMessages.map(err => `${err.field}: ${err.message}`);
    
        return resp.status(400).json(
            new apiResponse(400, "Validation failed", formattedErrorMessages.join('; '))
        );
    }

    try {
        
    console.log("loginData:",loginData);
    const data = loginData.data;
    const existedUser = await prisma.user.findUnique({
        where:{
            email: data.email
        }
    })

    if(!existedUser){
        return resp.status(404).json(
            new apiResponse(404, "User not found", "No user associated with this email.")
        );
    }

    //verify the user

    const isPasswordValid = brcypt.compare(existedUser.password,data.password);

    if(!isPasswordValid){
        return resp.status(401).json(
            new apiResponse(401, "Invalid password", "The password you entered is incorrect.")
        );
    }

    const accessToken = jwt.sign(
            {
                _id: existedUser.id, 
                username: existedUser.username, 
                email: existedUser.email, 
                role: existedUser.role
            },
            process.env.ACCESS_TOKEN_SECRET!,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            }
        );
        
        // Generate refresh token
        const refreshToken = jwt.sign(
            {
                _id: existedUser.id, 
            },
            process.env.REFRESH_TOKEN_SECRET!,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            }
        );

        console.log("accessToken",accessToken)
        console.log("refreshToken",refreshToken)

        const options = {
            httpOnly: true,
            secure : true
         }

         return resp.status(201)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",refreshToken,options)
         .json(
             new apiResponse(200, existedUser,"User login successfully.")
         );
    } catch (error) {
        return resp.status(500).json( // Change status to 500 (Conflict) for better semantics
            new apiResponse(500," ", "Internal server error.")
        );
    }
})


//logout user

const logout = asynhandler(async (req :authentication ,resp :Response,next: NextFunction) => {
    try {
    const id = await req.user?.id;

    const user = await prisma.user.findUnique({
        where: {
            id: id
        }
    })
    
    if(!user){
        return resp.status(404).json(
            new apiResponse(404," ", "User not found.")
            );
    }
    
    const options = {
        httpOnly:true,
        secure: true

    }

    return resp.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new apiResponse(
                200,
                "",
                "userlogout successfully"

            )
        )


    } catch (error) {
        return resp.status(500).json( // Change status to 500 (Conflict) for better semantics
            new apiResponse(500," ", "Internal server error.")
        );
    }
})

const refreshTokenRegenerate = asynhandler (async (req : Request ,resp : Response , next: NextFunction) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        console.log("token:", token);

        if (!token) {
            return resp.status(401).json(
                new apiResponse(401, "Invalid refresh token", "Refresh token is missing or invalid.")
            );
        }

        const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;

        if (!decodedToken || !decodedToken._id) {
            return resp.status(403).json(
                new apiResponse(403, "Invalid token", "Token verification failed.")
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decodedToken._id,
            }
        });

        if (!user) {
            return resp.status(404).json(
                new apiResponse(404, "User not found", "User associated with the token was not found.")
            );
        }
        

        const accessToken = jwt.sign(
            {
                _id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role
            },
            process.env.ACCESS_TOKEN_SECRET!,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
            }
        );
        
        // Generate refresh token
        const refreshToken = jwt.sign(
            {
                _id: user.id, 
            },
            process.env.REFRESH_TOKEN_SECRET!,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            }
        );

        console.log("accessToken",accessToken)
        console.log("refreshToken",refreshToken)

        const options = {
            httpOnly: true,
            secure : true
         }

         return resp.status(201)
         .cookie("accessToken",accessToken,options)
         .cookie("refreshToken",refreshToken,options)
         .json(
             new apiResponse(200, user,"User login successfully.")
         );

    } catch (error) {
        console.error(error); // Log error for debugging purposes
        return resp.status(500).json(
            new apiResponse(500, "Internal server error", "Something went wrong while processing your request.")
        );
    }
})

const getCurrentUser = asynhandler(async (req:authentication , resp:Response , next : NextFunction) => {
    return resp.json(
        new apiResponse(200, req.user,"user details.")
    )
})

const forgotPassword = asynhandler(async (req: Request, resp: Response, next: NextFunction) => {
 
    const forgotEmail = emailSchema.safeParse(req.body);

    if (!forgotEmail.success) {
    
        const errorMessages = forgotEmail.error.errors.map(err => ({
            field: err.path.join('.'), 
            message: err.message,       
        }));

        const formattedErrorMessages = errorMessages.map(err => `${err.field}: ${err.message}`).join('; ');
    
        return resp.status(400).json(
            new apiResponse(400, "Validation failed", formattedErrorMessages)
        );
    }

    const userExistedWithThisEmail = await prisma.user.findUnique({
        where: { email: forgotEmail.data.email }
    });

    if (!userExistedWithThisEmail) {
        return resp.status(404).json(
            new apiResponse(404, "User not found", "User with this email does not exist")
        );
    }

    // Generate a 6-digit verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 1);
    

    // Create OTP model with the verification code
    const otpModelCreated = await prisma.otp.create({
        data: {
            email: userExistedWithThisEmail.email,
            otp: verifyCode,
            otpexpiry: expiryDate
        }
    });

    // Send the password reset email
    const emailSender = await sendForgotPasswordEmail(
        userExistedWithThisEmail.username,
        userExistedWithThisEmail.email,
        verifyCode
    );

    if (!emailSender) {
        return resp.status(500).json(
            new apiResponse(500, "Failed to send email", "Failed to send email to the user")
        );
    }

    if (!otpModelCreated) {
        return resp.status(500).json(
            new apiResponse(500, "Internal server error", "Failed to create OTP model")
        );
    }

    return resp.status(200).json(
        new apiResponse(200, "OTP sent", "Verification code sent to your email")
    );
});

const verifyCode = asynhandler(async (req: Request, resp: Response, next: NextFunction) => {
    try {
       
        const verify = otpSchema.safeParse(req.body);
        if (!verify.success) {
            // Extract and format validation error messages
            const errorMessages = verify.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
            }));

            const formattedErrorMessages = errorMessages.map(err => `${err.field}: ${err.message}`).join('; ');

            return resp.status(400).json(
                new apiResponse(400, "Validation failed", formattedErrorMessages)
            );
        }

      
        verify.data.email = verify.data.email + "@gmail.com";

        const userExistedWithThisEmail = await prisma.user.findUnique({
            where: {
                email: verify.data.email
            }
        });

        if (!userExistedWithThisEmail) {
            return resp.status(404).json(
                new apiResponse(404, "User not found", "User with this email does not exist")
            );
        }

        const otpModelOfEmail = await prisma.otp.findUnique({
            where: {
                email: verify.data.email
            }
        });

        if (!otpModelOfEmail) {
            return resp.status(404).json(
                new apiResponse(404, "OTP not found", "No OTP found for this email")
            );
        }

        const isCodeValid = otpModelOfEmail.otp === verify.data.otp;
        const isCodeNotExpired = new Date(otpModelOfEmail.otpexpiry) > new Date();

        if (isCodeNotExpired && isCodeValid) {
           
            const passUpdated = await prisma.user.update({
                where: {
                    email: verify.data.email
                },
                data: {
                    password: verify.data.newpassword
                }
            });

            if (!passUpdated) {
                return resp.status(500).json(
                    new apiResponse(500, "Failed to update password", "Failed to update password")
                );
            }

            return resp.status(200).json(
                new apiResponse(200, "Password updated successfully", "Password updated successfully")
            );
        } else if (!isCodeNotExpired) {
            return resp.status(400).json({
                success: false,
                message: "Code expired",
            });
        } else {
            return resp.status(400).json({
                success: false,
                message: "Code is invalid",
            });
        }
    } catch (error) {
        return resp.status(500).json(
            new apiResponse(500, "Internal server error", "An error occurred while processing your request.")
        );
    }
});

const resendCode = asynhandler(async (req: Request, resp: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        if (!email) {
            return resp.status(400).json(
                new apiResponse(400, "Please provide the email", "Missing required email field")
            );
        }

        const emailWithDomain = `${email}@gmail.com`;

        const userExistedWithThisEmail = await prisma.user.findUnique({
            where: {
                email: emailWithDomain
            }
        });

        if (!userExistedWithThisEmail) {
            return resp.status(404).json(
                new apiResponse(404, "User not found", "User with this email does not exist")
            );
        }

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 1);  // Set expiry to 1 minute from now

        // Update OTP model with the new verification code and expiry
        const otpModelUpdated = await prisma.otp.update({
            where: {
                email: userExistedWithThisEmail.email
            },
            data: {
                otp: verifyCode,
                otpexpiry: expiryDate
            }
        });
    
        if (!otpModelUpdated) {
            return resp.status(500).json(
                new apiResponse(500, "Internal server error", "Failed to update OTP model")
            );
        }

        // Send the password reset email with the new verification code
        const emailSender = await sendForgotPasswordEmail(
            userExistedWithThisEmail.username,
            userExistedWithThisEmail.email,
            verifyCode
        );
    
        if (!emailSender) {
            return resp.status(500).json(
                new apiResponse(500, "Failed to send email", "Failed to send email to the user")
            );
        }
        
        return resp.status(200).json(
            new apiResponse(200, "OTP sent", "Verification code sent to your email")
        );

    } catch (error) {
        return resp.status(500).json(
            new apiResponse(500, "Internal server error", error.message || "Something went wrong")
        );
    }
});


export  {register , 
    login,
    logout,
    refreshTokenRegenerate,
    getCurrentUser,
    forgotPassword,
    verifyCode,
    resendCode,
    

}
