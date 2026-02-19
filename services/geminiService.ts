
import { Lesson } from "../types";

const apiRequest = async <T>(path: string, payload: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const getInterestSuggestions = async (currentInterests: string[]): Promise<string[]> => {
  return apiRequest<string[]>("/interest-suggestions", { currentInterests });
};

export const generateLesson = async (
  targetCategory: string, 
  allInterests: string[], 
  previousLesson?: Lesson
): Promise<Lesson> => {
  return apiRequest<Lesson>("/lesson", {
    targetCategory,
    allInterests,
    previousLesson
  });
};
