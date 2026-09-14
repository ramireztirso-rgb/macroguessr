import generatedDishes from './generatedDishes.json'
import { PLACEHOLDER_DISH_POOL, type Dish } from './dish'

const generated = generatedDishes as Dish[]

export const DISH_POOL: Dish[] = generated.length > 0 ? generated : PLACEHOLDER_DISH_POOL
export const USING_PLACEHOLDER_DATA = generated.length === 0
