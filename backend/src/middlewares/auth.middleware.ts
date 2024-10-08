import { PrismaClient } from "@prisma/client";
import asynchandler from "../utils/context/asynchandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import apiResponse from "../utils/context/apiresponse";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

interface User{
    id: number;
    username: string;
    email: string;
    role:string,
}

export interface authentication extends Request {
    user?: User;  
}

 const verifyJWT = asynchandler(async (req: authentication, resp: Response, next: NextFunction) => {
    try {
       
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "");
        console.log("token:", token);

      
        if (!token) {
            return resp.status(401).json(new apiResponse(401, "Unauthorized user", "No token provided."));
        }

    
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;
        
      
        const user = await prisma.user.findUnique({
            where: {
                id: decoded._id, 
            }
        });

        
        if (!user) {
            return resp.status(401).json(
                new apiResponse(401, "Invalid Access Token", "User not found or token is invalid.")
            );
        }

        // Attach user to request object for downstream handlers to use
        req.user = user;
        next();

    } catch (error) {
        // Check if the error is related to token expiration or invalid signature
        if (error instanceof jwt.TokenExpiredError) {
            return resp.status(401).json(new apiResponse(401, "Token expired", "Your session has expired. Please log in again."));
        } else if (error instanceof jwt.JsonWebTokenError) {
            return resp.status(401).json(new apiResponse(401, "Invalid token", "The token provided is invalid."));
        }

   
        return resp.status(500).json(
            new apiResponse(500, "Internal Server Error", "Something went wrong while verifying the token.")
        );
    }
});

export default verifyJWT
