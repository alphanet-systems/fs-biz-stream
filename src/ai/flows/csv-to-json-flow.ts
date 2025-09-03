
'use server';
/**
 * @fileOverview A Genkit flow for converting CSV data to a structured JSON array.
 * 
 * - csvToJson - A function that takes a CSV string and a description of the desired JSON fields
 *   and returns a JSON array.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the structure for describing a single field in the target JSON schema.
const FieldDefinitionSchema = z.object({
  type: z.enum(['string', 'number', 'boolean']).describe('The data type of the field.'),
  description: z.string().describe('A description of what the field represents.'),
  optional: z.boolean().optional().describe('Whether the field is optional.'),
});
type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

// Define the input schema for the main csvToJson flow.
export const CsvToJsonInputSchema = z.object({
  csv: z.string().describe('The full CSV content as a single string.'),
  fields: z.record(FieldDefinitionSchema).describe('An object where keys are the desired JSON field names and values are their definitions.'),
});
export type CsvToJsonInput = z.infer<typeof CsvToJsonInputSchema>;

// Helper function to dynamically generate a Zod schema from the field definitions.
// This allows the AI to output a strongly-typed JSON object.
function generateZodSchema(fields: Record<string, FieldDefinition>): z.ZodType {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const key in fields) {
    const field = fields[key];
    let zodType: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'string':
      default:
        zodType = z.string();
        break;
    }
    
    if (field.optional) {
      zodType = zodType.optional();
    }
    shape[key] = zodType.describe(field.description);
  }
  return z.array(z.object(shape));
}

// Main exported function that other parts of the app will call.
export async function csvToJson(input: CsvToJsonInput): Promise<any> {
  // Generate the dynamic Zod schema for the AI's output.
  const dynamicOutputSchema = generateZodSchema(input.fields);

  // Define the prompt for the AI.
  const csvToJsonPrompt = ai.definePrompt({
    name: 'csvToJsonPrompt',
    input: { schema: CsvToJsonInputSchema },
    output: { schema: dynamicOutputSchema },
    prompt: `You are a data processing expert. Your task is to convert the provided CSV data into a structured JSON array.
    
Analyze the CSV data and map it to the requested JSON format defined by the 'fields' object.
The first row of the CSV should be treated as the header row.
Ensure that the data types in the resulting JSON match the specified types (string, number, boolean).

CSV Data:
{{{csv}}}

Desired JSON Structure Fields:
{{#each fields}}
- {{ @key }}: ({{this.type}}) {{this.description}}{{#if this.optional}} (optional){{/if}}
{{/each}}
`,
  });

  // Execute the prompt and return the structured output.
  const { output } = await csvToJsonPrompt(input);
  return output;
}
