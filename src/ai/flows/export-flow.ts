
'use server';
/**
 * @fileOverview A Genkit flow for converting JSON data to CSV format.
 * 
 * - jsonToCsv - A function that takes a JSON object with a 'data' key (which is an array of objects) and returns a CSV string.
 * - CsvInput - The input type for the jsonToCsv function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const CsvInputSchema = z.object({
    data: z.array(z.record(z.any())).describe('An array of JSON objects to convert to CSV.'),
});
export type CsvInput = z.infer<typeof CsvInputSchema>;

const csvConversionPrompt = ai.definePrompt({
    name: 'csvConversionPrompt',
    input: { schema: CsvInputSchema },
    prompt: `Convert the following JSON data into a CSV format. 
The first line of the CSV should be the headers, derived from the keys of the JSON objects.
Do not include the JSON structure in the response, only the CSV data.

JSON Data:
{{{json data}}}
`,
});


const jsonToCsvFlow = ai.defineFlow(
    {
        name: 'jsonToCsvFlow',
        inputSchema: CsvInputSchema,
        outputSchema: z.string(),
    },
    async (input) => {
        const { output } = await csvConversionPrompt(input);
        return output!;
    }
);

export async function jsonToCsv(input: CsvInput): Promise<string> {
    return jsonToCsvFlow(input);
}

    