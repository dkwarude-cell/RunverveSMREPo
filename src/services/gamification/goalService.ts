import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../../models/Goal';
import { generateId } from '../../utils/helpers';

const GOALS_KEY = '@smartheal_goals';

export async function getGoals(): Promise<Goal[]> {
  const data = await AsyncStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
  const goals = await getGoals();
  const newGoal: Goal = { ...goal, id: generateId() };
  goals.push(newGoal);
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  return newGoal;
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
  const goals = await getGoals();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx !== -1) {
    goals[idx] = { ...goals[idx], ...updates, updatedAt: Date.now() };
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  let goals = await getGoals();
  goals = goals.filter((g) => g.id !== goalId);
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}
