/* The Office section: the desk (four windows: the road, what needs an answer, the tasks, the next show), Backstage and Career, plus the week-closed and clock windows and the game-over screen. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { DossierWindow } from './Dossier';
import { Desk, MatterWindow, DeskMoreWindow, RoadYearWindow } from './Desk';
import { Career } from './Career';
import { TitleTaskWindow, ContractTaskWindow } from './Tasks';
import { Backstage, ActWindow } from './BeforeShow';
import { WeekClosed, ClockWindow, AnnualReport, VoicesWindow, WelcomeWindow, FaceWindow } from './Windows';

export const pages: Record<string, () => ComponentChildren> = { desk: Desk, backstage: Backstage, career: Career };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { weekclosed: WeekClosed, annual: AnnualReport, clock: ClockWindow, voices: VoicesWindow, welcome: WelcomeWindow, face: FaceWindow, apact: ActWindow, tasktitle: TitleTaskWindow, taskcon: ContractTaskWindow, matter: MatterWindow, deskmore: DeskMoreWindow, roadyear: RoadYearWindow, dossier: DossierWindow };
export { GameOver } from './GameOver';
