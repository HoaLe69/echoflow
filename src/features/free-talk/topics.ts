import type { FreeTalkTopic } from './types'

export const freeTalkTopics: FreeTalkTopic[] = [
  {
    id: 'work-challenge',
    category: 'Work',
    prompt:
      'Describe a challenge you faced at work or school and explain how you handled it.',
    suggestedLevel: 'b1',
  },
  {
    id: 'ideal-weekend',
    category: 'Everyday',
    prompt:
      'Describe your ideal weekend. What would you do, where would you go, and who would you spend it with?',
    suggestedLevel: 'a1-a2',
  },
  {
    id: 'travel-place',
    category: 'Travel',
    prompt:
      'Talk about a place you would love to visit. Why does it interest you, and what would you do there?',
    suggestedLevel: 'b1',
  },
  {
    id: 'opinion-social-media',
    category: 'Opinions',
    prompt:
      'Do you think social media brings people closer together or pushes them apart? Give examples.',
    suggestedLevel: 'b2',
  },
  {
    id: 'story-mistake',
    category: 'Storytelling',
    prompt:
      'Tell a short story about a mistake you made and what you learned from it.',
    suggestedLevel: 'b1',
  },
  {
    id: 'interview-strength',
    category: 'Interview',
    prompt:
      'Describe your greatest strength and give a concrete example of how you used it.',
    suggestedLevel: 'b2',
  },
  {
    id: 'daily-routine',
    category: 'Everyday',
    prompt:
      'Walk me through a normal day in your life, from morning to evening.',
    suggestedLevel: 'a1-a2',
  },
  {
    id: 'opinion-remote-work',
    category: 'Opinions',
    prompt:
      'What are the advantages and disadvantages of working or studying remotely?',
    suggestedLevel: 'b2',
  },
  {
    id: 'food-culture',
    category: 'Storytelling',
    prompt:
      'Talk about a food from your culture that you would recommend to a visitor.',
    suggestedLevel: 'b1',
  },
  {
    id: 'future-goal',
    category: 'Work',
    prompt:
      'What is one goal you want to achieve in the next year, and what is your plan?',
    suggestedLevel: 'b1',
  },
  {
    id: 'travel-problem',
    category: 'Travel',
    prompt:
      'Describe a travel problem you experienced or imagine one. How did or would you solve it?',
    suggestedLevel: 'b1',
  },
  {
    id: 'random-advice',
    category: 'Opinions',
    prompt:
      'What advice would you give to someone who is learning a new language?',
    suggestedLevel: 'b1',
  },
]

export const freeTalkCategories = [
  'Everyday',
  'Work',
  'Travel',
  'Opinions',
  'Storytelling',
  'Interview',
]

export function pickRandomTopic(excludeId?: string): FreeTalkTopic {
  const candidates = excludeId
    ? freeTalkTopics.filter((topic) => topic.id !== excludeId)
    : freeTalkTopics
  const pool = candidates.length > 0 ? candidates : freeTalkTopics
  return pool[Math.floor(Math.random() * pool.length)]
}
