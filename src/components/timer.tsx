import { h } from 'preact';
import { styled } from 'goober';
import { createMachine, state, transition } from 'robot3';
import { useMachine } from 'preact-robot';
import { analytics } from '../firebase';
import { Button } from './button';
import { Mascot } from './mascot';
import { useTimer } from '../hooks/useTimer';
import { sendNotification, playCompleteSound } from '../utils';

const Mins25 = 25 * 60;
const Mins5 = 5 * 60;

const machine = createMachine({
	startPomodoro: state(transition('START_POMODORO', 'activePomodoro')),
	activePomodoro: state(
		transition('CANCEL_POMODORO', 'startPomodoro'),
		transition('DONE_POMODORO', 'startBreak'),
	),
	startBreak: state(transition('START_BREAK', 'activeBreak')),
	activeBreak: state(
		transition('CANCEL_BREAK', 'startPomodoro'),
		transition('DONE_BREAK', 'startPomodoro'),
	),
});

function formatTimeDigits(num: number): string {
	return `${num < 10 ? '0' : ''}${num}`;
}

function formatTime(total: number): string {
	const secs = total % 60;
	const mins = (total - secs) / 60;
	const hours = Math.floor(total / 3600);

	return `${formatTimeDigits(hours)}:${formatTimeDigits(mins)}:${formatTimeDigits(secs)}`;
}

const TimerContainer = styled('div')`
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	align-items: center;
	padding-bottom: 4em;
`;

const Centered = styled('div')`
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const TimerText = styled('div')`
	font-size: 5rem;
	font-weight: 500;
`;

export function Timer() {
	const { seconds, start: startTimer, stop: stopTimer } = useTimer();
	const [current, send] = useMachine(machine);
	const state = current.name;

	const sendEvent = (event: string) => {
		send(event);
		analytics.logEvent(event);
	};

	const startPomodoro = () => {
		sendEvent('START_POMODORO');
		startTimer(Mins25);
	};

	const cancelPomodoro = () => {
		sendEvent('CANCEL_POMODORO');
		stopTimer();
	};

	const startBreak = () => {
		sendEvent('START_BREAK');
		startTimer(Mins5);
	};

	const cancelBreak = () => {
		sendEvent('CANCEL_BREAK');
		stopTimer();
	};

	const finishPomodoro = () => {
		sendEvent('DONE_POMODORO');
		playCompleteSound();
		sendNotification('Done! Its time to take a break!');
		stopTimer();
	};

	const finishBreak = () => {
		sendEvent('DONE_BREAK');
		playCompleteSound();
		sendNotification('Its time to work!');
		stopTimer();
	};

	if (seconds <= 0) {
		switch (state) {
			case 'activePomodoro': {
				finishPomodoro();
				break;
			}

			case 'activeBreak': {
				finishBreak();
				break;
			}

			default:
				break;
		}
	}

	return (
		<TimerContainer>
			<Centered>
				{seconds <= 0 ? (
					<Mascot
						message={
							state == 'startPomodoro'
								? "It's time to work!"
								: "It's time to take a break!"
						}
					/>
				) : (
					<TimerText>{formatTime(seconds)}</TimerText>
				)}
			</Centered>

			{state == 'startPomodoro' && (
				<Button type="button" onClick={startPomodoro}>
					Start Pomodoro
				</Button>
			)}
			{state == 'activePomodoro' && (
				<Button type="button" onClick={cancelPomodoro}>
					Cancel Pomodoro
				</Button>
			)}
			{state == 'startBreak' && (
				<Button type="button" onClick={startBreak}>
					Start Break
				</Button>
			)}
			{state == 'activeBreak' && (
				<Button type="button" onClick={cancelBreak}>
					Cancel Break
				</Button>
			)}
		</TimerContainer>
	);
}
