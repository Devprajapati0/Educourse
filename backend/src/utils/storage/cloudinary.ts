import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET  
})

export const uploadOnCloudinary = async (localLink: string): Promise<{ url?: string; error?: string }> => {
    try {
        if (!localLink) {
            return { error: "File cannot be found" };
        }

        const fileUpload = await cloudinary.uploader.upload(localLink, {
            resource_type: "auto"
        });

        
        fs.unlinkSync(localLink);

       
        return { url: fileUpload.secure_url };
    } catch (error) {
       
        console.error("Cloudinary upload error:", error);
        
       
        if (fs.existsSync(localLink)) {
            fs.unlinkSync(localLink);
        }

        return { error: "An error occurred during the upload" };
    }
};




