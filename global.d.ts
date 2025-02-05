declare module "heic-convert" {
    export default function heicConvert(options: {
        buffer: ArrayBuffer;
        format: "JPEG" | "PNG";
        quality?: number;
    }): Promise<Buffer>;
}