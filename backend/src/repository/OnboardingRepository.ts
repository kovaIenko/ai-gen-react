import Question from "../entity/Question";
import {OnboardingQuestionType} from "../entity/OnboardingQuestionType";

export function getOnboardingQuestion(countAsked: number) {
    if (countAsked < onboardingQuestions.length) {
        return onboardingQuestions[countAsked]
    } else {
        return null
    }
}


const standartQuestionRange = ["1", "2", "3", "4", "5",]

const onboardingQuestions: Question[] = [
    {
        question: "What is your current profession and role?",
        type: OnboardingQuestionType.OPEN,
    },
    {
        question: "How many years have you worked in that profession?",
        type: OnboardingQuestionType.OPEN,
    },
    {
        question: "How good are you with Communication skill on a scale from 0 to 5?",
        type: OnboardingQuestionType.OPTIONAL,
        options: standartQuestionRange,
    },
    {
        question: "How good are you with Collaboration skill on a scale from 0 to 5?",
        type: OnboardingQuestionType.OPTIONAL,
        options: standartQuestionRange,
    },
    {
        question: "How good are you with Adaptation skill on a scale from 0 to 5?",
        type: OnboardingQuestionType.OPTIONAL,
        options: standartQuestionRange,
    },
    {
        question: "How good are you with Problem-solving skill on a scale from 0 to 5?",
        type: OnboardingQuestionType.OPTIONAL,
        options: standartQuestionRange,
    },
    {
        question: "How good are you with Leadership skill on a scale from 0 to 5?",
        type: OnboardingQuestionType.OPTIONAL,
        options: standartQuestionRange,
    }
]
