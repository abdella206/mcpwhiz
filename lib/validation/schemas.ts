import { z } from "zod";

// Frontend-specific schemas that match existing interface patterns
export const frontendResourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  resource_type: z.enum(['static', 'dynamic', 'context_aware']).default('static'),
  uri: z.string().min(1, "URI is required"),
  title: z.string().default(""),
  description: z.string().default(""),
  mime_type: z.string().optional(),
  static_content: z.string().optional(),
  api_url: z.string().url("Invalid API URL").optional().or(z.literal("")),
  headers: z.record(z.string()).optional(),
  parameters: z.record(z.object({
    description: z.string(),
    type: z.string(),
    required: z.boolean()
  })).optional(),
  completion_config: z.any().optional()
});

export const frontendToolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().default(""),
  description: z.string().default(""),
  tool_type: z.enum(['static', 'api', 'resource_link']).default('static'),
  parameters: z.record(z.object({
    description: z.string(),
    type: z.string(),
    required: z.boolean()
  })).optional(),
  static_result: z.string().optional(),
  api_url: z.string().url("Invalid API URL").optional().or(z.literal("")),
  http_method: z.string().optional(),
  headers: z.record(z.string()).optional(),
  resource_links_header: z.string().optional(),
  resource_links: z.array(z.object({
    uri: z.string(),
    name: z.string(),
    mimeType: z.string(),
    description: z.string()
  })).optional()
});

export const frontendPromptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().default(""),
  description: z.string().default(""),
  prompt_type: z.enum(['basic', 'context_aware']).default('basic'),
  template: z.string().min(1, "Template is required"),
  role: z.enum(['user', 'assistant']).default('user'),
  arguments: z.record(z.object({
    type: z.string(),
    description: z.string(),
    required: z.boolean()
  })).optional(),
  completion_config: z.any().optional()
});

// Validation helpers
export const validateResource = (data: unknown) => {
  try {
    return { success: true as const, data: frontendResourceSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, data: null, errors: error.errors };
    }
    return { success: false as const, data: null, errors: null };
  }
};

export const validateTool = (data: unknown) => {
  try {
    return { success: true as const, data: frontendToolSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, data: null, errors: error.errors };
    }
    return { success: false as const, data: null, errors: null };
  }
};

export const validatePrompt = (data: unknown) => {
  try {
    return { success: true as const, data: frontendPromptSchema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, data: null, errors: error.errors };
    }
    return { success: false as const, data: null, errors: null };
  }
};

// Types for frontend use
export type ResourceData = z.infer<typeof frontendResourceSchema>;
export type ToolData = z.infer<typeof frontendToolSchema>;
export type PromptData = z.infer<typeof frontendPromptSchema>;
export type ValidationError = z.ZodError['errors'][0];
