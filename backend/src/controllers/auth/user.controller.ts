import asynhandler from "../../utils/context/asynchandler";
import apiError from "../../utils/context/apierror";
import apiResponse from "../../utils/context/apiresponse";
import { signupSchema } from "../../utils/schemas/signup.schemas";
import { PrismaClient } from "@prisma/client";
import { roleType } from "@prisma/client";
import { uploadOnCloudinary } from "../../utils/storage/cloudinary";
import brcypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config();

const prisma = new PrismaClient();



const register = asynhandler(async (req, resp) => {
   
    const signupData = signupSchema.safeParse(req.body);
    
    if (!signupData.success) {
        const errorMessages = signupData.error.errors.map(err => err.message);
        throw new apiError(400, errorMessages.join(', '));
    }

    try {
        const data = signupData.data;

       
        const existedUser = await prisma.user.findFirst({
            where: {
                email: data.email,
                role: data.role as roleType,
            },
        });

        if (existedUser) {
            throw new apiError(400, "Email with this role already exists.");
        }

       
        const profilePhoto = req.file ? req.file.path : './public/temp/def.zip';
        const uploaded = await uploadOnCloudinary(profilePhoto);


      
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

        if (!user) {
            throw new apiError(500, "Something went wrong while registering the user.");
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
                _id: user.id, // Use the same ID for the refresh token
            },
            process.env.REFRESH_TOKEN_SECRET!,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
            }
        );
        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshtoken: refreshToken,
                accesstoken:accessToken
            },
        });

        const options = {
            httpOnly: true,
            secure : true
         }

    

        
        return resp.status(201)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new apiResponse(200, user, "User registered successfully.")
        );

    } catch (error) {
       
        if (error instanceof apiError) {
            throw error; // Rethrow known API errors
        }
        throw new apiError(500, "Internal server error."); 
    }
});
