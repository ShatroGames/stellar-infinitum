import { Decimal } from '../utils/numbers';

export interface Resource {
  id: string;
  name: string;
  amount: Decimal;
  productionRate: Decimal;
  displayName: string;
  icon?: string;
}

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'knowledge',
    name: 'knowledge',
    amount: new Decimal(10),
    productionRate: new Decimal(0),
    displayName: 'Energy',
  }
];
