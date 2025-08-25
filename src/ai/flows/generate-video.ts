'use server';
/**
 * @fileOverview A flow to generate a video summary of a diary event.
 *
 * - generateVideo - A function that generates a video from event content.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Schemas
const GenerateVideoInputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  description: z.string().describe('The main description of the event.'),
  mainImage: z.string().describe("The main image of the event as a data URI."),
  content: z.array(z.string()).describe('An array of text content from the event.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

// Exported wrapper function
export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

// Main Flow
const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    // 1. Generate a script for the video
    const scriptPrompt = `You are a romantic storyteller. Based on the following diary entry, create a short, emotional script of about 50-70 words. The script should capture the feeling of the moment.
        
        Title: ${input.title}
        Description: ${input.description}
        Additional notes: ${input.content.join('; ')}
        
        Generate only the script text, without any labels like "Script:".`;

    const scriptResponse = await ai.generate({
      prompt: scriptPrompt,
      model: 'googleai/gemini-2.0-flash',
    });
    const script = scriptResponse.text;

    // 2. Generate video using the main image and the script
    const { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: [
            { text: `Create an evocative, cinematic video that brings this memory to life. Start with the provided image and make it subtly animate, like a gentle breeze or a soft focus pull. The feeling should be romantic and nostalgic. Script: ${script}` },
            { media: { url: input.mainImage, contentType: 'image/jpeg' } },
        ],
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        }
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // 3. Poll for video completion
    let finalOperation = operation;
    while (!finalOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        finalOperation = await ai.checkOperation(finalOperation);
    }

    if (finalOperation.error) {
        throw new Error(`Video generation failed: ${finalOperation.error.message}`);
    }

    const video = finalOperation.output?.message?.content.find((p) => p.media && p.media.contentType?.startsWith('video/'));
    if (!video || !video.media) {
        throw new Error('Generated operation result does not contain a video.');
    }

    // 4. Fetch and encode video to return to client
     const fetch = (await import('node-fetch')).default;
     const videoDownloadResponse = await fetch(`${video.media.url}&key=${process.env.GEMINI_API_KEY}`);

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }

    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    
    return {
      videoUrl: `data:video/mp4;base64,${videoBase64}`,
    };
  }
);
