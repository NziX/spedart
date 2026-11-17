
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";

const f = createUploadthing();
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({ image: { maxFileSize: "64MB" } })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                metadata,
                file
            };
        }),
    audioUploader: f({ audio: { maxFileSize: "256MB" } })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                metadata,
                file
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;