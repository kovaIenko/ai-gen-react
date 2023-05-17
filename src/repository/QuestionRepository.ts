import {ChatType} from "../entity/ChatType";
import {getOnboardingQuestion} from "./OnboardingRepository";
import {postMessage as postMessageToGpt} from "./GptRepository";

export function getNextMessage(chatType: ChatType, countAsked: number, lastAnswer: string) {
    switch (chatType) {
        case ChatType.Onboarding:
            return getOnboardingQuestion(countAsked);
        default:
            return postMessageToGpt(lastAnswer);
    }
}