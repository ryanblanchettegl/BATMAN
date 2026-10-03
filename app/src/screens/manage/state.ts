/* View state of the Company section: the house style being picked and the trade being put together. */
import { slice } from '../../store';

export interface Creed { style?: string; roots?: string; pledge?: string }
export interface Trade { pid: string; theirs: string; mine: string }
export interface CompanyState { creed: Creed | null; trade: Trade }
export const noTrade = (): Trade => ({ pid: '', theirs: '', mine: '' });
export function co(): CompanyState { return slice<CompanyState>('company', () => ({ creed: null, trade: noTrade() })); }
