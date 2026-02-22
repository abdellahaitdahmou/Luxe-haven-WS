
// Define the categories we want to classify into
const CANDIDATE_LABELS = [
    "Living Room",
    "Bedroom",
    "Bathroom",
    "Kitchen",
    "Dining Room",
    "Exterior",
    "Pool",
    "Garden",
    "Office",
    "Gym",
    "Balcony"
];

class ImageClassifier {
    static instance: any = null;

    static async getInstance() {
        if (!this.instance) {
            try {
                // Dynamically import to avoid SSR/Build issues
                const { pipeline, env } = await import('@xenova/transformers');

                // Configure environment
                env.allowLocalModels = false;

                // Check if Cache API is available before enabling it
                if (typeof caches === 'undefined') {
                    console.warn("Cache API not available. Disabling browser cache.");
                    env.useBrowserCache = false;
                } else {
                    env.useBrowserCache = true;
                }

                console.log("Initializing transformer pipeline...");

                // Use a smaller, faster model appropriate for client-side
                this.instance = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
                console.log("Transformer pipeline initialized successfully.");
            } catch (err) {
                console.error("Failed to initialize transformer pipeline:", err);
                throw err;
            }
        }
        return this.instance;
    }
}

export async function classifyImage(imageUrl: string): Promise<{ label: string, score: number }[]> {
    try {
        const classifier = await ImageClassifier.getInstance();
        const output = await classifier(imageUrl, CANDIDATE_LABELS);
        return output;
    } catch (error) {
        console.error("Image classification failed:", error);
        return [];
    }
}
